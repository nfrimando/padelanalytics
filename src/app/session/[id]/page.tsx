"use client";

import { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import React from "react";

import { useSession } from "@/lib/useSession";
import { useSessionPlayers } from "@/lib/useSessionPlayers";
import { useCreateEvent } from "@/lib/useCreateEvent";
import { useUpdateSession } from "@/lib/useUpdateSession";
import { getPartnerPlayerId } from "@/lib/utils/session";
import { useAuth } from "@/lib/useAuth";

import VideoPlayer from "@/app/components/VideoPlayer";
import EventLogger from "@/app/components/EventLogger";
import EventsTable from "@/app/components/EventsTable";
import LockSessionButton from "@/app/components/LockSessionButton";

import type { EventType } from "@/lib/utils/types";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessionEvents } from "@/lib/queries/supabase";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = React.use(params);

  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  const [selectedSet, setSelectedSet] = useState(1);
  const [selectedGame, setSelectedGame] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedPointType, setSelectedPointType] = useState<EventType | null>(
    null,
  );
  const [involvedPlayer, setInvolvedPlayer] = useState<number | null>(null);

  // FIX 4: useSession now returns a React Query object directly
  const { data: session, error: sessionError } = useSession(sessionId);
  const { sessionPlayers } = useSessionPlayers(sessionId);
  const { user } = useAuth();

  const isOwner = !!user && !!session && session.owner_id === user.id;

  const { mutate: updateSession } = useUpdateSession(sessionId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  function handleTitleClick() {
    if (!isOwner) return;
    setTitleDraft(session?.title ?? "");
    setEditingTitle(true);
  }

  function handleTitleSave() {
    const trimmed = titleDraft.trim();
    if (trimmed !== (session?.title ?? "")) {
      updateSession({ title: trimmed || null });
    }
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setEditingTitle(false);
  }

  // FIX 1: only one declaration of useCreateEvent, with sessionId
  const { createEvent, loading: isLogging } = useCreateEvent(sessionId);

  // FIX 2: handleLogEvent is defined here
  const handleLogEvent = async (decrementSeconds = 0) => {
    if (!ytPlayer || !selectedPlayer || !selectedPointType || isLogging) return;
    const timestamp = Math.max(0, ytPlayer.getCurrentTime() - decrementSeconds);
    await createEvent({
      session_id: sessionId,
      timestamp_seconds: timestamp,
      player_id: selectedPlayer,
      event_type: selectedPointType,
      target_player_id: involvedPlayer,
      set_number: selectedSet,
      game_number: selectedGame,
    });
    // No setEvents needed — cache handles it
    setSelectedPointType(null);
  };

  // 404 on bad session
  useEffect(() => {
    if (sessionError) notFound();
  }, [sessionError]);

  // Reset involved player when point type or player changes
  useEffect(() => {
    setInvolvedPlayer(null);
  }, [selectedPointType, selectedPlayer]);

  // Auto-select partner for winner_assisted
  useEffect(() => {
    if (selectedPointType !== "winner_assisted" || !selectedPlayer) return;
    const playerObj = sessionPlayers.find((p) => p.id === selectedPlayer);
    if (!playerObj) return;
    const partnerId = getPartnerPlayerId(playerObj.position, sessionPlayers);
    if (partnerId) setInvolvedPlayer(partnerId);
  }, [selectedPointType, selectedPlayer, sessionPlayers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!ytPlayer) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        ytPlayer.getPlayerState?.() === 1
          ? ytPlayer.pauseVideo()
          : ytPlayer.playVideo();
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        ytPlayer.seekTo(
          Math.max((ytPlayer.getCurrentTime?.() ?? 0) - 10, 0),
          true,
        );
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        ytPlayer.seekTo((ytPlayer.getCurrentTime?.() ?? 0) + 10, true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [ytPlayer]);

  const { data: events = [] } = useQuery({
    queryKey: queryKeys.sessionEvents(sessionId),
    queryFn: () => fetchSessionEvents(sessionId),
    enabled: !!sessionId,
  });

  return (
    <div className="p-6 grid grid-cols-2 gap-6 relative">
      <a
        href={`/analysis/${sessionId}`}
        className="absolute right-0 top-0 mt-4 mr-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-semibold z-20"
      >
        Analytics
      </a>
      {session && (
        <div className="absolute right-0 top-0 mt-4 mr-36 z-20">
          <LockSessionButton
            sessionId={sessionId}
            status={session.status}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Inline title */}
      <div className="col-span-2 -mt-2 mb-1 flex items-center gap-2">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="text-lg font-semibold border-b border-zinc-400 bg-transparent outline-none w-full max-w-lg"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled Match"
          />
        ) : (
          <span
            onClick={handleTitleClick}
            className={`text-lg font-semibold text-zinc-800 dark:text-white ${
              isOwner
                ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                : ""
            }`}
            title={isOwner ? "Click to edit title" : undefined}
          >
            {session?.title ?? "Untitled Match"}
            {isOwner && (
              <span className="ml-2 text-xs text-zinc-400 font-normal">✏️</span>
            )}
          </span>
        )}
      </div>

      {/* LEFT: Video */}
      {session?.youtube_video_id && (
        <VideoPlayer
          videoId={session.youtube_video_id}
          videoLoading={videoLoading}
          onReady={setYtPlayer}
          onLoadingChange={setVideoLoading}
        />
      )}

      {/* RIGHT: Controls + Table */}
      <div>
        <EventLogger
          players={sessionPlayers}
          selectedSet={selectedSet}
          selectedGame={selectedGame}
          selectedPlayer={selectedPlayer}
          selectedPointType={selectedPointType}
          involvedPlayer={involvedPlayer}
          isLogging={isLogging}
          locked={session?.status === "completed"}
          onSetChange={setSelectedSet}
          onGameChange={setSelectedGame}
          onPlayerChange={setSelectedPlayer}
          onPointTypeChange={setSelectedPointType}
          onInvolvedPlayerChange={setInvolvedPlayer}
          onLogNow={() => handleLogEvent(0)}
          onLogSecondsAgo={handleLogEvent}
        />
        <EventsTable
          sessionId={sessionId}
          events={events}
          players={sessionPlayers}
          onSeek={(s) => ytPlayer?.seekTo(s, true)}
        />
      </div>
    </div>
  );
}