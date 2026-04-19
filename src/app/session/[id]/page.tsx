"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/lib/useSession";
import YouTube from "react-youtube";
import { supabase } from "@/lib/supabase/client";
import { useCreateEvent } from "@/lib/useCreateEvent";
import { useUpdateEvent } from "@/lib/useUpdateEvent";
import { useDeleteEvent } from "@/lib/useDeleteEvent";
import { useSessionPlayers } from "@/lib/useSessionPlayers";
import { usePlayers } from "@/lib/usePlayers";
import SessionPlayerSelector from "@/app/components/SessionPlayerSelector";
import EventSelector from "@/app/components/EventSelector";

import React from "react";
import { notFound } from "next/navigation";

// for logs
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// for getting partner and opponent position
function getPartnerAndOpponentPositions(selectedPosition: number): {
  PartnerPosition: number[];
  OpponentPositions: number[];
} {
  switch (selectedPosition) {
    case 1:
      return { PartnerPosition: [2], OpponentPositions: [3, 4] };
    case 2:
      return { PartnerPosition: [1], OpponentPositions: [3, 4] };
    case 3:
      return { PartnerPosition: [4], OpponentPositions: [1, 2] };
    case 4:
      return { PartnerPosition: [3], OpponentPositions: [1, 2] };
    default:
      return { PartnerPosition: [], OpponentPositions: [] };
  }
}

const EVENT_NAMES = [
  "winner",
  "winner_fed",
  "winner_assisted",
  "forced_error",
  "unforced_error_attack",
  "unforced_error_defense",
];

function getDisabledPositionsForEvent(
  eventName: string,
  playerPosition: number,
): number[] {
  const { PartnerPosition, OpponentPositions } =
    getPartnerAndOpponentPositions(playerPosition);

  if (eventName === "winner") {
    return [1, 2, 3, 4];
  }
  if (eventName === "winner_fed") {
    return [playerPosition, ...PartnerPosition];
  }
  if (eventName === "winner_assisted") {
    return [playerPosition, ...OpponentPositions];
  }
  if (eventName === "forced_error") {
    return [playerPosition, ...PartnerPosition];
  }
  if (eventName.startsWith("unforced")) {
    return [1, 2, 3, 4];
  }
  return [];
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const { updateEvent, loading: updatingEvent } = useUpdateEvent();

  const startEdit = (event: any) => {
    setEditingEventId(event.id);
    setEditFields({
      player_id: event.player_id,
      event_type: event.event_type,
      target_player_id: event.target_player_id,
      set_number: event.set_number,
      game_number: event.game_number,
      timestamp_seconds: event.timestamp_seconds,
    });
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditFields({});
  };

  const saveEdit = async (id: string) => {
    const updated = await updateEvent({ id, ...editFields });
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditingEventId(null);
      setEditFields({});
    }
  };

  // Set and Game selectors
  const [selectedSet, setSelectedSet] = useState<number>(1);
  const [selectedGame, setSelectedGame] = useState<number>(1);

  // Selected Player
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  // Involved Player (disabled selector)
  const [involvedPlayer, setInvolvedPlayer] = useState<number | null>(null);

  // Selected Point Type
  const [selectedPointType, setSelectedPointType] = useState<string | null>(
    null,
  );

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

  // Only deleting events
  const { deleteEvent: deleteEventHook, loading: deletingEvent } =
    useDeleteEvent();
  const handleDeleteEvent = async (id: string) => {
    const success = await deleteEventHook(id);
    if (success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
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
    player.seekTo(seconds - 10, true);
  };

  // Spacebar play/pause toggle
  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (e.code === "Space" && player) {
        // Avoid triggering when typing in an input or textarea
        if (
          (e.target as HTMLElement)?.tagName === "INPUT" ||
          (e.target as HTMLElement)?.tagName === "TEXTAREA"
        )
          return;
        e.preventDefault();
        const state = player.getPlayerState?.();
        if (state === 1) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    };
    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  }, [player]);

  // Spacebar play/pause toggle and J/L seek
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!player) return;
      // Avoid triggering when typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Spacebar or K: play/pause
      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        const state = player.getPlayerState?.();
        if (state === 1) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }

      // J: rewind 10s
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const current = player.getCurrentTime?.() ?? 0;
        player.seekTo(Math.max(current - 10, 0), true);
      }

      // L: forward 10s
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const current = player.getCurrentTime?.() ?? 0;
        player.seekTo(current + 10, true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [player]);

  // Reset involvedPlayer when point type or selected player changes
  useEffect(() => {
    setInvolvedPlayer(null);
  }, [selectedPointType, selectedPlayer]);

  // For Log Event button enable/disable logic
  const isLogEventEnabled = (() => {
    // Must have selected player and point type
    if (!selectedPlayer || !selectedPointType) return false;

    // Compute disabled positions for involved player
    const playerObj = orderedSessionPlayers.find(
      (p) => p.id === selectedPlayer,
    );
    const disabledPositions =
      selectedPlayer && selectedPointType && playerObj
        ? getDisabledPositionsForEvent(selectedPointType, playerObj.position)
        : orderedSessionPlayers.map((p) => p.position);

    // If all involved player buttons are disabled, allow log event
    const allPositions = orderedSessionPlayers.map((p) => p.position);
    const allDisabled = allPositions.every((pos) =>
      disabledPositions.includes(pos),
    );
    if (allDisabled) return true;

    // Otherwise, must have a selected involved player that is not disabled
    if (
      involvedPlayer &&
      !disabledPositions.includes(
        orderedSessionPlayers.find((p) => p.id === involvedPlayer)?.position ??
          0,
      )
    ) {
      return true;
    }
    return false;
  })();

  useEffect(() => {
    if (selectedPointType === "winner_assisted" && selectedPlayer) {
      const playerObj = orderedSessionPlayers.find(
        (p) => p.id === selectedPlayer,
      );
      if (playerObj) {
        const { PartnerPosition } = getPartnerAndOpponentPositions(
          playerObj.position,
        );
        // Find the player with the partner position
        const partner = orderedSessionPlayers.find(
          (p) => p.position === PartnerPosition[0],
        );
        if (partner) {
          setInvolvedPlayer(partner.id);
        }
      }
    }
  }, [selectedPointType, selectedPlayer, orderedSessionPlayers]);

  // Log event using useCreateEvent hook
  const { createEvent, loading: isLogging } = useCreateEvent();

  const logEvent = async () => {
    if (isLogging) return;

    if (!player || selectedPlayer === null || !selectedPointType) {
      alert("Select player and point type");
      return;
    }

    const timestamp = player.getCurrentTime();

    const data = await createEvent({
      session_id: sessionId,
      timestamp_seconds: timestamp,
      player_id: selectedPlayer,
      event_type: selectedPointType || "",
      target_player_id: involvedPlayer,
      set_number: selectedSet,
      game_number: selectedGame,
    });

    if (data) {
      setEvents((prev) => [...prev, data]);
      setSelectedPointType(null);
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
              height: "432",
            }}
          />
        )}
      </div>

      {/* RIGHT: CONTROLS */}
      <div>
        <h2 className="font-bold mb-4 mt-8">Log Event</h2>

        {/* Set and Game Selectors */}
        <div className="flex gap-4 mb-4">
          <div>
            <p className="font-semibold mb-2">Set</p>
            <select
              className="border rounded px-2 py-1"
              value={selectedSet}
              onChange={(e) => setSelectedSet(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="font-semibold mb-2">Game</p>
            <select
              className="border rounded px-2 py-1"
              value={selectedGame}
              onChange={(e) => setSelectedGame(Number(e.target.value))}
            >
              {Array.from({ length: 13 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-2">Player</p>
          <SessionPlayerSelector
            players={orderedSessionPlayers}
            selectedPlayer={selectedPlayer}
            onChange={setSelectedPlayer}
          />
        </div>

        {/* Event Selector between Player and Involved Player */}
        <div className="mt-4">
          <p className="font-semibold mb-2">Point Type</p>
          <EventSelector
            eventNames={EVENT_NAMES}
            value={selectedPointType}
            onChange={setSelectedPointType}
          />
        </div>

        <div className="mt-4">
          <p className="font-semibold mb-2">Involved Player</p>
          <SessionPlayerSelector
            players={orderedSessionPlayers}
            selectedPlayer={involvedPlayer}
            onChange={setInvolvedPlayer}
            disabledPositions={
              selectedPlayer && selectedPointType
                ? getDisabledPositionsForEvent(
                    selectedPointType,
                    orderedSessionPlayers.find((p) => p.id === selectedPlayer)
                      ?.position ?? 0,
                  )
                : orderedSessionPlayers.map((p) => p.position)
            }
          />
        </div>

        <button
          onClick={logEvent}
          className={`mt-6 px-4 py-2 rounded font-semibold transition-colors duration-150
            ${isLogEventEnabled ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer" : "bg-gray-300 text-gray-400 cursor-not-allowed opacity-60"}`}
          disabled={!isLogEventEnabled}
        >
          Log Event
        </button>

        {/* Points Table */}
        <div className="mt-6">
          <h2 className="font-bold mb-2">Points Table</h2>

          <table className="w-full text-sm text-center">
            <thead>
              <tr>
                <th>Time</th>
                <th>Set</th>
                <th>Game</th>
                <th>Type</th>
                <th>Player</th>
                <th>Involved Player</th>
              </tr>
            </thead>
            <tbody>
              {[...events].reverse().map((e) => {
                const isEditing = editingEventId === e.id;
                return (
                  <tr key={e.id} className="border-t">
                    <td
                      onClick={() => seekToEvent(e.timestamp_seconds)}
                      className="text-blue-700 underline cursor-pointer hover:text-blue-900 transition-colors duration-100 font-semibold"
                      title="Seek video to this time"
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-16 border rounded px-1"
                          value={editFields.timestamp_seconds}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              timestamp_seconds: Number(ev.target.value),
                            }))
                          }
                        />
                      ) : (
                        formatTime(e.timestamp_seconds)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editFields.set_number}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              set_number: Number(ev.target.value),
                            }))
                          }
                          className="border rounded px-1"
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      ) : (
                        (e.set_number ?? "—")
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editFields.game_number}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              game_number: Number(ev.target.value),
                            }))
                          }
                          className="border rounded px-1"
                        >
                          {Array.from({ length: 13 }, (_, i) => i + 1).map(
                            (num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ),
                          )}
                        </select>
                      ) : (
                        (e.game_number ?? "—")
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editFields.event_type}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              event_type: ev.target.value,
                            }))
                          }
                          className="border rounded px-1"
                        >
                          {EVENT_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        e.event_type
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editFields.player_id}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              player_id: Number(ev.target.value),
                            }))
                          }
                          className="border rounded px-1"
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
                    <td>
                      {isEditing ? (
                        <select
                          value={editFields.target_player_id ?? ""}
                          onChange={(ev) =>
                            setEditFields((f: any) => ({
                              ...f,
                              target_player_id: ev.target.value
                                ? Number(ev.target.value)
                                : null,
                            }))
                          }
                          className="border rounded px-1"
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
                    <td className="space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(e.id)}
                            className="text-green-600"
                            disabled={updatingEvent}
                          >
                            {updatingEvent ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600"
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
