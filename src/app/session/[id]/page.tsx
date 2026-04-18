"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/lib/useSession";
import PlayerCreate from "@/app/components/PlayerCreate";
import EventSelector from "@/app/components/EventSelector";
import YouTube from "react-youtube";
import { supabase } from "@/lib/supabase/client";
import { useUpdateEvent } from "@/lib/useUpdateEvent";
import { useCreateEvent } from "@/lib/useCreateEvent";
import { useDeleteEvent } from "@/lib/useDeleteEvent";
import { useSessionPlayers } from "@/lib/useSessionPlayers";
import { usePlayers } from "@/lib/usePlayers";

import React from "react";
import { notFound } from "next/navigation";

// for logs
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = React.use(params);

  const [videoId, setVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null,
  );

  // For EventSelector validity
  const [isEventValid, setIsEventValid] = useState(false);

  // Get session players (ordered by position)
  const { sessionPlayers } = useSessionPlayers(sessionId);
  const { players: allPlayers } = usePlayers();
  // Map sessionPlayers to include player info
  const orderedSessionPlayers = [...sessionPlayers]
    .sort((a, b) => a.position - b.position)
    .map((sp) => {
      const player = allPlayers.find((p) => p.player_id === sp.player_id);
      return {
        id: sp.player_id,
        label:
          player?.nickname || player?.player_name || `Player ${sp.player_id}`,
        position: sp.position,
      };
    });
  const eventTypes = ["winner", "forced_error", "unforced_error"];

  // Editing and deleting events
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editPlayer, setEditPlayer] = useState<number | null>(null);
  const [editEventType, setEditEventType] = useState<string | null>(null);
  const [editTargetPlayer, setEditTargetPlayer] = useState<number | null>(null);

  const { deleteEvent: deleteEventHook, loading: deletingEvent } =
    useDeleteEvent();
  const handleDeleteEvent = async (id: string) => {
    const success = await deleteEventHook(id);
    if (success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const startEdit = (event: any) => {
    setEditingEventId(event.id);
    setEditPlayer(event.player_id);
    setEditEventType(event.event_type);
    setEditTargetPlayer(event.target_player_id ?? null);
  };

  const { updateEvent, loading: isUpdating } = useUpdateEvent();
  const saveEdit = async (id: string) => {
    const data = await updateEvent({
      id,
      player_id: editPlayer!,
      event_type: editEventType!,
      target_player_id: editTargetPlayer,
    });
    if (data) {
      setEvents((prev) => prev.map((e) => (e.id === id ? data : e)));
      setEditingEventId(null);
    }
  };

  const cancelEdit = () => {
    setEditingEventId(null);
  };

  // Load session using reusable hook
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession(sessionId);
  useEffect(() => {
    if (sessionError) {
      notFound();
    }
    if (session && session.youtube_video_id) {
      setVideoId(session.youtube_video_id);
    }
  }, [session, sessionError]);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp_seconds", { ascending: true });

      if (data) setEvents(data);
    };

    fetchEvents();
  }, [sessionId]);

  // Seek video to specific time
  const seekToEvent = (seconds: number) => {
    player.seekTo(seconds, true);
  };

  // Log event using useCreateEvent hook
  const { createEvent, loading: isLogging } = useCreateEvent();

  const logEvent = async () => {
    if (isLogging) return;

    if (!player || selectedPlayer === null || !selectedEventType) {
      alert("Select player and event type");
      return;
    }

    const timestamp = player.getCurrentTime();

    const data = await createEvent({
      session_id: sessionId,
      timestamp_seconds: timestamp,
      player_id: selectedPlayer,
      event_type: selectedEventType,
      target_player_id: null, // for future use (e.g. who made the error or who won the point)
    });

    if (data) {
      setEvents((prev) => [...prev, data]);
      setSelectedEventType(null);
      // keep player selected (faster workflow)
    }
  };

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* LEFT: VIDEO */}
      <div className="relative min-h-[200px]">
        {videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/70 dark:bg-black/70">
            <svg
              className="animate-spin h-10 w-10 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
        )}
        {videoId && (
          <YouTube
            videoId={videoId}
            onReady={(e) => {
              setPlayer(e.target);
              setVideoLoading(false);
            }}
            onStateChange={(e) => {
              if (e.data === 1) setVideoLoading(false); // playing
            }}
            opts={{
              width: "100%",
              height: "360",
            }}
          />
        )}
      </div>

      {/* RIGHT: CONTROLS */}
      <div>
        <h2 className="font-bold mb-4 mt-8">Log Event</h2>

        <div>
          <p className="font-semibold mb-2">Player</p>
          <div className="flex gap-2">
            {orderedSessionPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className={`px-3 py-1 rounded border font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 ${
                  selectedPlayer === p.id
                    ? "bg-indigo-700 text-white border-indigo-700 hover:bg-indigo-800"
                    : "bg-white text-black border-gray-400 hover:bg-indigo-100"
                }`}
                title={`Position ${p.position}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="font-semibold mb-2">Point Type</p>
          <EventSelector
            value={selectedEventType}
            onChange={setSelectedEventType}
            eventTypes={eventTypes}
            onValidityChange={setIsEventValid}
          />
        </div>

        <button
          onClick={logEvent}
          className={`mt-6 px-4 py-2 rounded font-semibold transition-colors duration-150
            ${isEventValid ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer" : "bg-gray-300 text-gray-400 cursor-not-allowed opacity-60"}`}
          disabled={!isEventValid}
        >
          Log Event
        </button>

        {/* EVENTS TABLE */}
        <div className="mt-6">
          <h2 className="font-bold mb-2">Events</h2>

          <table className="w-full text-sm text-center">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Player</th>
                <th>Target Player</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const isEditing = editingEventId === e.id;

                return (
                  <tr key={e.id} className="border-t">
                    <td
                      onClick={() => seekToEvent(e.timestamp_seconds)}
                      className="text-blue-700 underline cursor-pointer hover:text-blue-900 transition-colors duration-100 font-semibold"
                      title="Seek video to this time"
                    >
                      {formatTime(e.timestamp_seconds)}
                    </td>

                    {/* POINT TYPE */}
                    <td>
                      {isEditing ? (
                        <select
                          value={editEventType || ""}
                          onChange={(ev) => setEditEventType(ev.target.value)}
                        >
                          {eventTypes.map((et) => (
                            <option key={et} value={et}>
                              {et}
                            </option>
                          ))}
                        </select>
                      ) : (
                        e.event_type
                      )}
                    </td>

                    {/* PLAYER */}
                    <td>
                      {isEditing ? (
                        <select
                          value={editPlayer ?? ""}
                          onChange={(ev) =>
                            setEditPlayer(Number(ev.target.value))
                          }
                        >
                          {orderedSessionPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        orderedSessionPlayers.find(
                          (pl) => pl.id === e.player_id,
                        )?.label || e.player_id
                      )}
                    </td>

                    {/* TARGET PLAYER */}
                    <td>
                      {isEditing ? (
                        <select
                          value={editTargetPlayer ?? ""}
                          onChange={(ev) =>
                            setEditTargetPlayer(Number(ev.target.value))
                          }
                        >
                          <option value="">—</option>
                          {orderedSessionPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        orderedSessionPlayers.find(
                          (pl) => pl.id === e.target_player_id,
                        )?.label ||
                        (e.target_player_id ?? "—")
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(e.id)}
                            className="text-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-500"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(e)}
                            className="text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(e.id)}
                            className="text-red-600"
                            disabled={deletingEvent}
                          >
                            {deletingEvent ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
