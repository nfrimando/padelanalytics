"use client";

import { useState } from "react";
import type { SessionPlayerWithName, MatchAggregates } from "@/lib/utils/types";
import type { SetSummary } from "@/lib/matchSummaryUtils";
import { getTeamLabel } from "@/lib/matchSummaryUtils";

interface MatchSummaryCardProps {
  players: SessionPlayerWithName[];
  sets: SetSummary[];
  aggregates?: MatchAggregates;
}

export default function MatchSummaryCard({
  players,
  sets,
  aggregates,
}: MatchSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const t1Label = getTeamLabel(1, players) || "Team 1";
  const t2Label = getTeamLabel(2, players) || "Team 2";
  const t1SetsWon = sets.filter((s) => s.winner === 1).length;
  const t2SetsWon = sets.filter((s) => s.winner === 2).length;
  const matchWinner = t1SetsWon > t2SetsWon ? 1 : t2SetsWon > t1SetsWon ? 2 : null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-100 dark:border-zinc-800 mb-6 overflow-hidden">

      {/* Match score header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className={`flex-1 text-center ${matchWinner === 1 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}>
          <p className="text-xs font-medium truncate mb-1">{t1Label}</p>
          <p className="text-4xl font-bold">{t1SetsWon}</p>
          {matchWinner === 1 && <p className="text-[10px] mt-1 font-semibold uppercase tracking-widest">Winner</p>}
        </div>

        <div className="px-4 text-center shrink-0">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Sets</p>
          <p className="text-lg font-light text-zinc-300 dark:text-zinc-600">—</p>
        </div>

        <div className={`flex-1 text-center ${matchWinner === 2 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}>
          <p className="text-xs font-medium truncate mb-1">{t2Label}</p>
          <p className="text-4xl font-bold">{t2SetsWon}</p>
          {matchWinner === 2 && <p className="text-[10px] mt-1 font-semibold uppercase tracking-widest">Winner</p>}
        </div>
      </div>

      {/* Footer stats + toggle */}
      <div
        className="flex items-center justify-between px-6 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex gap-4 text-xs text-zinc-400">
          {aggregates && (
            <>
              <span>{aggregates.num_sets} sets</span>
              <span>{aggregates.num_games} games</span>
              <span>{aggregates.num_points} points</span>
            </>
          )}
        </div>
        <button className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
          {expanded ? "Hide" : "Set scores"}
          <span className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      {/* Collapsible set breakdown */}
      {expanded && sets.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {sets.map((set) => (
            <div key={set.setNumber}>
              {/* Set row */}
              <div className="flex items-center justify-between px-6 py-2 bg-zinc-50 dark:bg-zinc-800/30">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Set {set.setNumber}
                </span>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <span className={set.winner === 1 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                    {set.t1Games}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600 font-light text-xs">–</span>
                  <span className={set.winner === 2 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                    {set.t2Games}
                  </span>
                </div>
              </div>

              {/* Game rows */}
              {set.games.map((game) => (
                <div key={game.gameNumber} className="flex items-center justify-between px-6 py-1">
                  <span className="text-xs text-zinc-400">Game {game.gameNumber}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`w-4 text-right font-medium ${game.winner === 1 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                      {game.t1Points}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">–</span>
                    <span className={`w-4 font-medium ${game.winner === 2 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                      {game.t2Points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}