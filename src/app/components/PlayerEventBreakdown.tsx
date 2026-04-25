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

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function formatRatio(win: number, err: number): string {
  if (err === 0) return win > 0 ? "∞" : "—";
  return round2(win / err).toFixed(2);
}

const WIN_COMPONENTS: { key: string; label: string }[] = [
  { key: "actor_winner",             label: "Pure Winner" },
  { key: "actor_winner_assisted",    label: "Assisted Winner" },
  { key: "receiver_winner_assisted", label: "Assisted a Winner" },
  { key: "actor_winner_fed",         label: "Fed Winner" },
  { key: "actor_forced_error",       label: "Forced an Error" },
];

const ERROR_COMPONENTS: { key: string; label: string }[] = [
  { key: "actor_unforced_error_attack",  label: "Unforced Error (Attack)" },
  { key: "actor_unforced_error_defense", label: "Unforced Error (Defense)" },
  { key: "receiver_winner_fed",          label: "Fed a Winner" },
  { key: "receiver_forced_error",        label: "Forced Error" },
];

const WINNER_KEYS = ["actor_winner", "actor_winner_fed", "actor_winner_assisted"];

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        className="text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
      </button>
      {show && (
        <div className="absolute left-0 top-5 z-50 w-48 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {text}
        </div>
      )}
    </span>
  );
}

export default function PlayerEventBreakdown({ data, sessionPlayers, events }: PlayerEventBreakdownProps) {
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [winExpanded, setWinExpanded] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);

  const scoringTable = getScoringTable(CURRENT_SCORING_VERSION);

  const players = sessionPlayers.map((p) => ({
    player_id: p.player_id,
    player_name: p.nickname ?? p.player_name ?? `Player ${p.player_id}`,
  }));

  const lookup: Record<string, number> = {};
  for (const row of data) {
    lookup[`${row.role}_${row.event_type}_${row.player_id}`] = row.count;
  }

  const totalPoints = events?.length ?? 0;

  // Total PC
  const totalPc: Record<number, number> = {};
  if (events && events.length > 0) {
    const series = buildContributionSeries(events);
    const last = series.points[series.points.length - 1];
    if (last) {
      for (const p of players) totalPc[p.player_id] = last.scores[p.player_id] ?? 0;
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

  // Winners
  const winners: Record<number, number> = {};
  for (const p of players) {
    winners[p.player_id] = WINNER_KEYS.reduce((sum, key) => {
      const config = PLAYER_EVENT_ROW_CONFIGS.find((c) => c.key === key)!;
      return sum + (lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0);
    }, 0);
  }

  // Win contribution
  const winCounts: Record<string, Record<number, number>> = {};
  for (const wc of WIN_COMPONENTS) {
    const config = PLAYER_EVENT_ROW_CONFIGS.find((c) => c.key === wc.key)!;
    winCounts[wc.key] = {};
    for (const p of players) {
      winCounts[wc.key][p.player_id] = lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0;
    }
  }
  const totalWins: Record<number, number> = {};
  for (const p of players) {
    totalWins[p.player_id] = WIN_COMPONENTS.reduce((sum, wc) => sum + winCounts[wc.key][p.player_id], 0);
  }

  // Errors
  const errorCounts: Record<string, Record<number, number>> = {};
  for (const ec of ERROR_COMPONENTS) {
    const config = PLAYER_EVENT_ROW_CONFIGS.find((c) => c.key === ec.key)!;
    errorCounts[ec.key] = {};
    for (const p of players) {
      errorCounts[ec.key][p.player_id] = lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0;
    }
  }
  const totalErrors: Record<number, number> = {};
  for (const p of players) {
    totalErrors[p.player_id] = ERROR_COMPONENTS.reduce((sum, ec) => sum + errorCounts[ec.key][p.player_id], 0);
  }

  if (players.length === 0) {
    return <p className="text-zinc-400 text-sm text-center">No player event data available.</p>;
  }

  const playerCols = players.map((p) => (
    <th key={p.player_id} className="py-2 px-3 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      {p.player_name}
    </th>
  ));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="py-2 px-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide w-48">
              Summary
            </th>
            {playerCols}
          </tr>
        </thead>

        {/* ── Summary rows ── */}
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">

          {/* Win / Error Ratio */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Win / Error Ratio</span>
                <InfoTooltip text="Win Contribution % divided by Error %. Higher is better." />
              </div>
            </td>
            {players.map((p) => {
              const winPct = totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0;
              const errPct = totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0;
              const ratio = parseFloat(formatRatio(winPct, errPct));
              const isGood = !isNaN(ratio) && ratio >= 1;
              return (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className={`font-bold text-sm ${isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {formatRatio(winPct, errPct)}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Win Contribution % */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Win Contribution %</span>
                <InfoTooltip text="% of rallies where player contributed to winning the point" />
                {totalPoints > 0 && (
                  <button onClick={() => setWinExpanded((v) => !v)} className="text-[10px] text-zinc-400 hover:text-indigo-500 transition-colors">
                    {winExpanded ? "▴ hide" : "▾ breakdown"}
                  </button>
                )}
              </div>
            </td>
            {players.map((p) => {
              const pct = totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0;
              return (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {totalPoints > 0 ? formatPct(pct) : "—"}
                  </span>
                </td>
              );
            })}
          </tr>
          {winExpanded && WIN_COMPONENTS.map((wc) => (
            <tr key={wc.key} className="bg-zinc-50 dark:bg-zinc-800/30">
              <td className="py-1.5 px-3 pl-6 text-xs text-zinc-400 italic">{wc.label}</td>
              {players.map((p) => {
                const pct = totalPoints > 0 ? winCounts[wc.key][p.player_id] / totalPoints : 0;
                return (
                  <td key={p.player_id} className="py-1.5 px-3 text-center text-xs text-zinc-400">
                    {totalPoints > 0 ? formatPct(pct) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Error % */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Error %</span>
                <InfoTooltip text="% of rallies where player contributed to losing the point" />
                {totalPoints > 0 && (
                  <button onClick={() => setErrorExpanded((v) => !v)} className="text-[10px] text-zinc-400 hover:text-indigo-500 transition-colors">
                    {errorExpanded ? "▴ hide" : "▾ breakdown"}
                  </button>
                )}
              </div>
            </td>
            {players.map((p) => {
              const pct = totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0;
              return (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {totalPoints > 0 ? formatPct(pct) : "—"}
                  </span>
                </td>
              );
            })}
          </tr>
          {errorExpanded && ERROR_COMPONENTS.map((ec) => (
            <tr key={ec.key} className="bg-zinc-50 dark:bg-zinc-800/30">
              <td className="py-1.5 px-3 pl-6 text-xs text-zinc-400 italic">{ec.label}</td>
              {players.map((p) => {
                const pct = totalPoints > 0 ? errorCounts[ec.key][p.player_id] / totalPoints : 0;
                return (
                  <td key={p.player_id} className="py-1.5 px-3 text-center text-xs text-zinc-400">
                    {totalPoints > 0 ? formatPct(pct) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Winners */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">Winners</td>
            {players.map((p) => (
              <td key={p.player_id} className="py-2 px-3 text-center">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {winners[p.player_id] ?? 0}
                </span>
              </td>
            ))}
          </tr>

          {/* Unforced Errors */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">Unforced Errors</td>
            {players.map((p) => {
              const count =
                (lookup[`actor_unforced_error_attack_${p.player_id}`] ?? 0) +
                (lookup[`actor_unforced_error_defense_${p.player_id}`] ?? 0);
              return (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {count}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Total PC */}
          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="py-2 px-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Total PC</span>
                <span className="text-zinc-300 dark:text-zinc-600 font-mono text-[10px]">v{CURRENT_SCORING_VERSION}</span>
              </div>
            </td>
            {players.map((p) => {
              const total = totalPc[p.player_id] ?? 0;
              return (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className={`font-bold ${total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {formatPc(total)}
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>

        {/* ── Event breakdown ── */}
        <thead>
          <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 border-b border-zinc-100 dark:border-zinc-800">
            <th className="py-2 px-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Event Breakdown
            </th>
            {playerCols}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {PLAYER_EVENT_ROW_CONFIGS.map((config) => {
            const pcScore = config.role === "actor"
              ? scoringTable[config.eventType].actor
              : scoringTable[config.eventType].involved;
            const tooltipText = `${config.tooltip} (${formatPc(pcScore)} PC)`;

            return (
              <tr key={config.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
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
      </table>
    </div>
  );
}