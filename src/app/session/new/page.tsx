"use client";

import { useState } from "react";
import { usePlayers } from "@/lib/usePlayers";
import type { Player, PlayerPosition } from "@/lib/types";
import { useRouter } from "next/navigation";

function extractVideoId(url: string) {
  const regExp = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^#&?]*)/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function NewSessionPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [videoId, setVideoId] = useState<string | null>(null);

  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [titleLoading, setTitleLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  // Player selection state
  const [selectedPlayers, setSelectedPlayers] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
  ]); // Player IDs by position (PlayerPosition-1)
  const { players, loading: playersLoading } = usePlayers();
  // Handler for player select
  const handlePlayerSelect = (index: number, playerId: number) => {
    setSelectedPlayers((prev) => {
      const updated = [...prev];
      updated[index] = playerId;
      return updated;
    });
  };

  const handleCreateSession = async () => {
    if (loading) return;
    const videoId = extractVideoId(url);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }
    if (selectedPlayers.some((p) => !p)) {
      alert("Please select all 4 players.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (
        await import("@/lib/supabase/client")
      ).supabase.rpc("create_session_with_players", {
        youtube_url: url,
        youtube_video_id: videoId,
        title: videoTitle || null,
        player_ids: selectedPlayers,
      });
      setLoading(false);
      if (error || !data) {
        setError(error?.message || "Session creation failed");
        console.log("Session creation failed", error);
        return;
      }
      console.log("Session and players created successfully", data);
      router.push(`/session/${data}`);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Unknown error");
      console.log("Session creation failed", err);
    }
  };

  const fetchVideoTitle = async (url: string) => {
    setTitleLoading(true);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${url}&format=json`,
      );
      const data = await res.json();
      setVideoTitle(data.title);
    } catch (err) {
      setVideoTitle(null);
    }
    setTitleLoading(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);

    const id = extractVideoId(value);
    setVideoId(id);

    if (id) {
      fetchVideoTitle(value);
    } else {
      setVideoTitle(null);
    }
  };

  // Sort players alphabetically by nickname (fallback to player_name)
  const sortedPlayers: Player[] = [...players].sort((a: Player, b: Player) => {
    const nameA = (a.nickname || a.player_name || "").toLowerCase();
    const nameB = (b.nickname || b.player_name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="p-6 max-w-xl mx-auto" style={{ minWidth: "40vw" }}>
      <h1 className="text-2xl font-bold mb-4">Start Session</h1>

      <div className="flex w-full gap-2 mb-2">
        <input
          className="border p-2 rounded-l flex-grow min-w-0"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        <button
          disabled={!videoId || loading || selectedPlayers.some((p) => !p)}
          onClick={handleCreateSession}
          className={`px-4 py-2 rounded-r whitespace-nowrap border font-semibold transition-colors duration-150 ${
            videoId && !loading && selectedPlayers.every((p) => p)
              ? "bg-black text-white border-black cursor-pointer hover:bg-gray-900"
              : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
          }`}
        >
          {loading ? "Creating..." : "Create Session"}
        </button>
      </div>

      {/* 4 Player Select Buttons with Team Labels */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 mb-1">
          <div className="text-center font-semibold">Team 1</div>
          <div className="text-center font-semibold">Team 2</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Team 1: left column, Team 2: right column */}
          <select
            id="team_1_player_1"
            tabIndex={1}
            className={`border p-2 rounded w-full transition-colors duration-150 ${
              !videoId || playersLoading
                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                : "bg-white text-black border-black cursor-pointer hover:bg-gray-50"
            }`}
            disabled={!videoId || playersLoading}
            value={selectedPlayers[0] ?? ""}
            onChange={(e) => handlePlayerSelect(0, Number(e.target.value))}
          >
            <option value="" disabled>
              {playersLoading ? "Loading..." : "Select Player 1"}
            </option>
            {sortedPlayers.map((player: Player) => (
              <option key={player.player_id} value={player.player_id}>
                {player.nickname ||
                  player.player_name ||
                  `Player ${player.player_id}`}
              </option>
            ))}
          </select>
          <select
            id="team_2_player_1"
            tabIndex={3}
            className={`border p-2 rounded w-full transition-colors duration-150 ${
              !videoId || playersLoading
                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                : "bg-white text-black border-black cursor-pointer hover:bg-gray-50"
            }`}
            disabled={!videoId || playersLoading}
            value={selectedPlayers[2] ?? ""}
            onChange={(e) => handlePlayerSelect(2, Number(e.target.value))}
          >
            <option value="" disabled>
              {playersLoading ? "Loading..." : "Select Player 3"}
            </option>
            {sortedPlayers.map((player: Player) => (
              <option key={player.player_id} value={player.player_id}>
                {player.nickname ||
                  player.player_name ||
                  `Player ${player.player_id}`}
              </option>
            ))}
          </select>
          <select
            id="team_1_player_2"
            tabIndex={2}
            className={`border p-2 rounded w-full transition-colors duration-150 ${
              !videoId || playersLoading
                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                : "bg-white text-black border-black cursor-pointer hover:bg-gray-50"
            }`}
            disabled={!videoId || playersLoading}
            value={selectedPlayers[1] ?? ""}
            onChange={(e) => handlePlayerSelect(1, Number(e.target.value))}
          >
            <option value="" disabled>
              {playersLoading ? "Loading..." : "Select Player 2"}
            </option>
            {sortedPlayers.map((player: Player) => (
              <option key={player.player_id} value={player.player_id}>
                {player.nickname ||
                  player.player_name ||
                  `Player ${player.player_id}`}
              </option>
            ))}
          </select>
          <select
            id="team_2_player_2"
            tabIndex={4}
            className={`border p-2 rounded w-full transition-colors duration-150 ${
              !videoId || playersLoading
                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                : "bg-white text-black border-black cursor-pointer hover:bg-gray-50"
            }`}
            disabled={!videoId || playersLoading}
            value={selectedPlayers[3] ?? ""}
            onChange={(e) => handlePlayerSelect(3, Number(e.target.value))}
          >
            <option value="" disabled>
              {playersLoading ? "Loading..." : "Select Player 4"}
            </option>
            {sortedPlayers.map((player: Player) => (
              <option key={player.player_id} value={player.player_id}>
                {player.nickname ||
                  player.player_name ||
                  `Player ${player.player_id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {titleLoading ? (
        <div className="mt-2 flex items-center gap-2 justify-center text-center w-full">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
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
          <span>Loading title...</span>
        </div>
      ) : (
        videoTitle && (
          <p className="mt-2 font-medium text-center w-full">{videoTitle}</p>
        )
      )}
      {videoId && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2 text-center">Preview</p>
          <div className="relative flex justify-center">
            {thumbLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 z-10">
                <svg
                  className="animate-spin h-8 w-8 text-indigo-600"
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
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="rounded border"
              onLoad={() => setThumbLoading(false)}
              onError={() => setThumbLoading(false)}
              style={{ display: thumbLoading ? "none" : "block" }}
              onLoadStart={() => setThumbLoading(true)}
            />
          </div>
        </div>
      )}

      {url && !videoId && (
        <p className="text-red-500 mt-2 text-sm">Invalid YouTube link</p>
      )}
    </div>
  );
}
