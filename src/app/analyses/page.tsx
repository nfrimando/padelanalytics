"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSessions } from "@/lib/useSessions";
import { usePlayers } from "@/lib/usePlayers";
import { useAuth } from "@/lib/useAuth";
import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import type { SessionStatus } from "@/lib/utils/types";

const STATUSES: { value: SessionStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "live", label: "Live" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AnalysesContent() {
  const { user } = useAuth();
  const { players } = usePlayers();
  const searchParams = useSearchParams();

  const [selectedStatuses, setSelectedStatuses] = useState<SessionStatus[]>(["completed"]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(undefined);
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);

  useEffect(() => {
    const playerParam = searchParams.get("player");
    if (playerParam) {
      const id = parseInt(playerParam, 10);
      if (!isNaN(id)) setSelectedPlayerId(id);
    }
  }, [searchParams]);

  const { sessions, isLoading } = useSessions({
    status: selectedStatuses,
    player_id: selectedPlayerId,
  });

  function toggleStatus(status: SessionStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.length === 1
          ? prev
          : prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }

  const filteredPlayers = playerSearch
    ? players.filter((p) =>
        p.player_name?.toLowerCase().includes(playerSearch.toLowerCase()) ||
        p.nickname?.toLowerCase().includes(playerSearch.toLowerCase())
      )
    : players;

  const selectedPlayer = players.find((p) => p.player_id === selectedPlayerId);

  function handlePlayerSelect(playerId: number) {
    setSelectedPlayerId(playerId);
    setPlayerSearch("");
    setPlayerDropdownOpen(false);
  }

  function handlePlayerClear() {
    setSelectedPlayerId(undefined);
    setPlayerSearch("");
    setPlayerDropdownOpen(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Analyses
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse match analyses
          </p>
        </div>
        <Link
          href="/session/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">

        {/* Status pills */}
        <div className="flex items-center gap-2">
          {STATUSES.map(({ value, label }) => {
            const active = selectedStatuses.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleStatus(value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

        {/* Player search */}
        <div className="relative">
          {selectedPlayer ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-full text-sm text-indigo-700 dark:text-indigo-300">
              <span className="font-medium">
                {selectedPlayer.nickname ?? selectedPlayer.player_name}
              </span>
              <button
                onClick={handlePlayerClear}
                className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => {
                setPlayerSearch(e.target.value);
                setPlayerDropdownOpen(true);
              }}
              onFocus={() => setPlayerDropdownOpen(true)}
              onBlur={() => setTimeout(() => setPlayerDropdownOpen(false), 150)}
              placeholder="Filter by player..."
              className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-indigo-400 w-44"
            />
          )}

          {playerDropdownOpen && !selectedPlayer && filteredPlayers.length > 0 && (
            <ul className="absolute z-50 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredPlayers.map((player) => (
                <li
                  key={player.player_id}
                  onMouseDown={() => handlePlayerSelect(player.player_id)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <span className="font-medium">
                    {player.nickname ?? player.player_name}
                  </span>
                  {player.nickname && (
                    <span className="ml-1.5 text-zinc-400 text-xs">
                      {player.player_name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg font-medium mb-1">No matches found</p>
          <p className="text-sm">Try adjusting the filters above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => {
            const isOwner = !!user && session.owner_id === user.id;
            const isLive = session.status === "live";
            return (
              <li key={session.id}>
                <Link
                  href={`/analysis/${session.id}`}
                  className="flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {session.title ?? "Untitled Match"}
                      </p>
                      {isLive && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded text-[10px] font-medium">
                          live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {session.owner_email ?? "Unknown"}
                      {isOwner && (
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded text-[10px] font-medium">
                          you
                        </span>
                      )}
                      {" · "}
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <span className="ml-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors text-lg shrink-0">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AnalysesPage() {
  return (
    <Suspense>
      <AnalysesContent />
    </Suspense>
  );
}