"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import PlayerCreate from "@/app/components/PlayerCreate";
import YouTube from "react-youtube";
import { supabase } from "@/lib/supabase/client";

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
  const [selectedPointType, setSelectedPointType] = useState<string | null>(
    null,
  );

  const players = [
    { id: 1, label: "A" },
    { id: 2, label: "B" },
    { id: 3, label: "C" },
    { id: 4, label: "D" },
  ];
  const pointTypes = ["Winner", "Error", "Smash", "Lob"];

  // Editing and deleting events
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editPlayer, setEditPlayer] = useState<number | null>(null);
  const [editPointType, setEditPointType] = useState<string | null>(null);

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const startEdit = (event: any) => {
    setEditingEventId(event.id);
    setEditPlayer(event.player_id);
    setEditPointType(event.point_type);
  };

  const saveEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("events")
      .update({
        player_id: editPlayer,
        point_type: editPointType,
      })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
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

  // Log event
  const logEvent = async () => {
    if (!player || selectedPlayer === null || !selectedPointType) {
      alert("Select player and point type");
      return;
    }

    const timestamp = player.getCurrentTime();

    const { data, error } = await supabase
      .from("events")
      .insert({
        session_id: sessionId,
        timestamp_seconds: timestamp,
        player_id: selectedPlayer,
        point_type: selectedPointType,
      })
      .select()
      .single();

    if (!error && data) {
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
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className={`px-3 py-1 rounded border ${
                  selectedPlayer === p.id ? "bg-black text-white" : "bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="font-semibold mb-2">Point Type</p>
          <div className="flex flex-wrap gap-2">
            {pointTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedPointType(type)}
                className={`px-3 py-1 rounded border ${
                  selectedPointType === type
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={logEvent}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
        >
          Log Event
        </button>

        {/* EVENTS TABLE */}
        <div className="mt-6">
          <h2 className="font-bold mb-2">Events</h2>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Time</th>
                <th>Player</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const isEditing = editingEventId === e.id;

                return (
                  <tr key={e.id} className="border-t">
                    <td>{formatTime(e.timestamp_seconds)}</td>

                    {/* PLAYER */}
                    <td>
                      {isEditing ? (
                        <select
                          value={editPlayer ?? ""}
                          onChange={(ev) =>
                            setEditPlayer(Number(ev.target.value))
                          }
                        >
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        players.find((pl) => pl.id === e.player_id)?.label ||
                        e.player_id
                      )}
                    </td>

                    {/* POINT TYPE */}
                    <td>
                      {isEditing ? (
                        <select
                          value={editPointType || ""}
                          onChange={(ev) => setEditPointType(ev.target.value)}
                        >
                          {pointTypes.map((pt) => (
                            <option key={pt} value={pt}>
                              {pt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        e.point_type
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
                            onClick={() => deleteEvent(e.id)}
                            className="text-red-600"
                          >
                            Delete
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
