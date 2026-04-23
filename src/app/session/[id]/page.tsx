"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import React from "react";

import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/useSession";
import { useSessionPlayers } from "@/lib/useSessionPlayers";
import { useCreateEvent } from "@/lib/useCreateEvent";
import { getPartnerPlayerId } from "@/lib/utils/session";

import VideoPlayer from "@/app/components/VideoPlayer";
import EventLogger from "@/app/components/EventLogger";
import EventsTable from "@/app/components/EventsTable";

import type { Event, EventType } from "@/lib/utils/types";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = React.use(params);

  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  const [selectedSet, setSelectedSet] = useState(1);
  const [selectedGame, setSelectedGame] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedPointType, setSelectedPointType] = useState<EventType | null>(
    null,
  );
  const [involvedPlayer, setInvolvedPlayer] = useState<number | null>(null);

  const { session, error: sessionError } = useSession(sessionId);
  const { sessionPlayers } = useSessionPlayers(sessionId);
  const { createEvent, loading: isLogging } = useCreateEvent();

  // 404 on bad session
  useEffect(() => {
    if (sessionError) notFound();
  }, [sessionError]);

  // Load events
  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from("events")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp_seconds", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as Event[]);
      });
  }, [sessionId]);

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

  const handleLogEvent = async (decrementSeconds = 0) => {
    if (!ytPlayer || !selectedPlayer || !selectedPointType || isLogging) return;
    const timestamp = Math.max(0, ytPlayer.getCurrentTime() - decrementSeconds);
    const data = await createEvent({
      session_id: sessionId,
      timestamp_seconds: timestamp,
      player_id: selectedPlayer,
      event_type: selectedPointType,
      target_player_id: involvedPlayer,
      set_number: selectedSet,
      game_number: selectedGame,
    });
    if (data) {
      setEvents((prev) => [...prev, data as Event]);
      setSelectedPointType(null);
    }
  };

  return (
    <div className="p-6 grid grid-cols-2 gap-6 relative">
      <a
        href={`/analysis/${sessionId}`}
        className="absolute right-0 top-0 mt-4 mr-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-semibold z-20"
      >
        Analytics
      </a>

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
          onSetChange={setSelectedSet}
          onGameChange={setSelectedGame}
          onPlayerChange={setSelectedPlayer}
          onPointTypeChange={setSelectedPointType}
          onInvolvedPlayerChange={setInvolvedPlayer}
          onLogNow={() => handleLogEvent(0)}
          onLogSecondsAgo={handleLogEvent}
        />
        <EventsTable
          events={events}
          players={sessionPlayers}
          onSeek={(s) => ytPlayer?.seekTo(s, true)}
          onEventUpdated={(updated) =>
            setEvents((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e)),
            )
          }
          onEventDeleted={(id) =>
            setEvents((prev) => prev.filter((e) => e.id !== id))
          }
        />
      </div>
    </div>
  );
}
