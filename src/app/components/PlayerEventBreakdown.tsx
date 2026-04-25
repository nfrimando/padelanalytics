"use client";

import { useState } from "react";
import type { MatchPlayerEventAggregates, Event, SessionPlayerWithName } from "@/lib/utils/types";
import { PLAYER_EVENT_ROW_CONFIGS } from "@/lib/playerEventConfig";
import { buildContributionSeries } from "@/lib/usePlayerContribution";
import { getScoringTable, CURRENT_SCORING_VERSION } from "@/lib/scoring";

interface PlayerEventBreakdownProps {
  data: MatchPlayerEventAggregates[];
  sessionPlayers: SessionPlayerWithName[];
  events?: Event[];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatPc(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export default function PlayerEventBreakdown({ data, sessionPlayers, events }: PlayerEventBreakdownProps) {
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);

  const scoringTable = getScoringTable(CURRENT_SCORING_VERSION);

  // Use sessionPlayers order (by position) rather than data order
  const players = sessionPlayers.map((p) => ({
    player_id: p.player_id,
    player_name: p.nickname ?? p.player_name ?? `Player ${p.player_id}`,
  }));

  // Build lookup: `${role}_${eventType}_${player_id}` -> count
  const lookup: Record<string, number> = {};
  for (const row of data) {
    lookup[`${row.role}_${row.event_type}_${row.player_id}`] = row.count;
  }

  // Compute total PC per player
  const totalPc: Record<number, number> = {};
  if (events && events.length > 0) {
    const series = buildContributionSeries(events);
    const last = series.points[series.points.length - 1];
    if (last) {
      for (const p of players) {
        totalPc[p.player_id] = last.scores[p.player_id] ?? 0;
      }
    }
  } else {
    for (const p of players) {
      let total = 0;
      for (const config of PLAYER_EVENT_ROW_CONFIGS) {
        const count = lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0;
        const score = config.role === "actor"
          ? scoringTable[config.eventType].actor
          : scoringTable[config.eventType].involved;
        total += count * score;
      }
      totalPc[p.player_id] = round2(total);
    }
  }

  if (players.length === 0) {
    return <p className="text-zinc-400 text-sm text-center">No player event data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="py-2 px-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide w-48">
              Event
            </th>
            {players.map((p) => (
              <th key={p.player_id} className="py-2 px-3 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {p.player_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {PLAYER_EVENT_ROW_CONFIGS.map((config) => {
            const hasData = players.some(
              (p) => (lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0) > 0
            );
            if (!hasData) return null;

            // PC score for tooltip
            const pcScore = config.role === "actor"
              ? scoringTable[config.eventType].actor
              : scoringTable[config.eventType].involved;
            const tooltipText = `${config.tooltip} (${formatPc(pcScore)} PC)`;

            return (
              <tr key={config.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                {/* Label + tooltip */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5 relative">
                    <span className={`text-xs font-medium ${config.positive ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {config.label}
                    </span>
                    <button
                      className="text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors shrink-0"
                      onMouseEnter={() => setTooltipKey(config.key)}
                      onMouseLeave={() => setTooltipKey(null)}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                      </svg>
                    </button>
                    {tooltipKey === config.key && (
                      <div className="absolute left-0 top-6 z-50 w-60 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                        {tooltipText}
                      </div>
                    )}
                  </div>
                </td>

                {/* Count per player */}
                {players.map((p) => {
                  const count = lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0;
                  return (
                    <td key={p.player_id} className="py-2 px-3 text-center">
                      {count > 0 ? (
                        <span className={`font-semibold ${config.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {count}
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>

        {/* Total PC footer */}
        <tfoot>
          <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
            <td className="py-3 px-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              Total PC
              <span className="ml-1.5 text-zinc-300 dark:text-zinc-600 font-mono font-normal">v{CURRENT_SCORING_VERSION}</span>
            </td>
            {players.map((p) => {
              const total = totalPc[p.player_id] ?? 0;
              return (
                <td key={p.player_id} className="py-3 px-3 text-center">
                  <span className={`font-bold text-sm ${total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {formatPc(total)}
                  </span>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}