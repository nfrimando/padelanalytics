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
  const [selectedPointType, setSelectedPointType] = useState<EventType | null>(null);
  const [involvedPlayer, setInvolvedPlayer] = useState<number | null>(null);

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

  const { createEvent, loading: isLogging } = useCreateEvent(sessionId);

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
    setSelectedPointType(null);
  };

  useEffect(() => {
    if (sessionError) notFound();
  }, [sessionError]);

  useEffect(() => {
    setInvolvedPlayer(null);
  }, [selectedPointType, selectedPlayer]);

  useEffect(() => {
    if (selectedPointType !== "winner_assisted" || !selectedPlayer) return;
    const playerObj = sessionPlayers.find((p) => p.id === selectedPlayer);
    if (!playerObj) return;
    const partnerId = getPartnerPlayerId(playerObj.position, sessionPlayers);
    if (partnerId) setInvolvedPlayer(partnerId);
  }, [selectedPointType, selectedPlayer, sessionPlayers]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!ytPlayer) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        ytPlayer.getPlayerState?.() === 1 ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        ytPlayer.seekTo(Math.max((ytPlayer.getCurrentTime?.() ?? 0) - 10, 0), true);
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

  useEffect(() => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    setSelectedSet(last.set_number);
    setSelectedGame(last.game_number);
  }, [events.length > 0]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Header */}
        <div className="flex flex-col gap-1 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  className="text-2xl font-bold bg-transparent outline-none w-full border-b-2 border-indigo-500 text-zinc-900 dark:text-white pb-0.5"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="Untitled Match"
                />
              ) : (
                <h1
                  onClick={handleTitleClick}
                  className={`text-2xl font-bold text-zinc-900 dark:text-white truncate ${
                    isOwner ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" : ""
                  }`}
                >
                  {session?.title ?? "Untitled Match"}
                </h1>
              )}
            </div>

            {/* Action links */}
            <div className="flex items-center gap-3 shrink-0 pt-1">
              {session && isOwner && (
                <LockSessionButton
                  sessionId={sessionId}
                  status={session.status}
                  isOwner={isOwner}
                />
              )}
              <a
                href={`/analysis/${sessionId}`}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
              >
                View Analysis →
              </a>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
            {/* Status dot */}
            <span className="flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${session?.status === "completed" ? "bg-zinc-400" : "bg-emerald-500"}`} />
              <span className="capitalize">{session?.status ?? "loading"}</span>
            </span>
            {session?.created_at && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>
                  {new Date(session.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
            {isOwner && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span
                  onClick={handleTitleClick}
                  className="text-zinc-400 hover:text-indigo-500 cursor-pointer transition-colors"
                  title="Click to edit title"
                >
                  Rename
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main layout: stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Video — full width on mobile, 60% on desktop */}
          {session?.youtube_video_id && (
            <div className="w-full lg:flex-[3]">
              <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow border border-zinc-100 dark:border-zinc-800">
                <VideoPlayer
                  videoId={session.youtube_video_id}
                  videoLoading={videoLoading}
                  onReady={setYtPlayer}
                  onLoadingChange={setVideoLoading}
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
                Space / K — play/pause · J — −10s · L — +10s
              </p>
            </div>
          )}

          {/* Controls — full width on mobile, 40% on desktop */}
          <div className="w-full lg:flex-[2] flex flex-col gap-4">

            {/* Event Logger */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-100 dark:border-zinc-800 p-4">
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
            </div>

            {/* Events Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-100 dark:border-zinc-800 p-4">
              <EventsTable
                sessionId={sessionId}
                events={events}
                players={sessionPlayers}
                onSeek={(s) => ytPlayer?.seekTo(s, true)}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}