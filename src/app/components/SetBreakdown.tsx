"use client";

import type { SessionPlayerWithName } from "@/lib/utils/types";
import type { SetSummary } from "@/lib/matchSummaryUtils";
import { getTeamLabel } from "@/lib/matchSummaryUtils";

interface SetBreakdownProps {
  players: SessionPlayerWithName[];
  sets: SetSummary[];
}

export default function SetBreakdown({ players, sets }: SetBreakdownProps) {
  if (sets.length === 0) return null;

  const t1Label = getTeamLabel(1, players) || "Team 1";
  const t2Label = getTeamLabel(2, players) || "Team 2";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 border border-zinc-100 dark:border-zinc-800">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
        Set Breakdown
      </h2>

      <div className="flex flex-col gap-3">
        {sets.map((set) => (
          <div
            key={set.setNumber}
            className="border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Set header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Set {set.setNumber}
              </span>
              <div className="flex items-center gap-6 text-xs text-zinc-400">
                <span className="truncate max-w-24 text-right">{t1Label}</span>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className={set.winner === 1 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                    {set.t1Games}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600 font-light">–</span>
                  <span className={set.winner === 2 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                    {set.t2Games}
                  </span>
                </div>
                <span className="truncate max-w-24">{t2Label}</span>
              </div>
            </div>

            {/* Game rows */}
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {set.games.map((game) => (
                <div
                  key={game.gameNumber}
                  className="flex items-center justify-between px-4 py-1.5"
                >
                  <span className="text-xs text-zinc-400">Game {game.gameNumber}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-medium w-6 text-right ${game.winner === 1 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                      {game.t1Points}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">–</span>
                    <span className={`font-medium w-6 ${game.winner === 2 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                      {game.t2Points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
