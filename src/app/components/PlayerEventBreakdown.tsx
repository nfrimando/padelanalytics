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

function round2(n: number) { return Math.round(n * 100) / 100; }
function formatPc(n: number): string { return n > 0 ? `+${n}` : String(n); }
function formatPct(n: number): string { return `${Math.round(n * 100)}%`; }

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

// ─── Mobile metric row ────────────────────────────────────────────────────────
// Label on top, then a horizontal strip of [player chip + bar + value] per player

function MobileMetricRow({
  label,
  tooltip,
  players,
  getValue,
  getBar,
  getColor,
  sub,
}: {
  label: React.ReactNode;
  tooltip?: string;
  players: { player_id: number; player_name: string }[];
  getValue: (pid: number) => React.ReactNode;
  getBar?: (pid: number) => number; // 0-100
  getColor?: (pid: number) => "green" | "red" | "neutral";
  sub?: React.ReactNode;
}) {
  return (
    <div className="py-2.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
        {sub}
      </div>
      <div className="flex flex-col gap-1.5">
        {players.map((p) => {
          const color = getColor?.(p.player_id) ?? "neutral";
          const barWidth = getBar?.(p.player_id) ?? 0;
          const valueColorCls = color === "green"
            ? "text-emerald-600 dark:text-emerald-400"
            : color === "red"
            ? "text-red-500 dark:text-red-400"
            : "text-zinc-700 dark:text-zinc-300";

          return (
            <div key={p.player_id} className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-400 w-16 shrink-0 truncate">{p.player_name}</span>
              {getBar && (
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      color === "green" ? "bg-emerald-500" : color === "red" ? "bg-red-400" : "bg-zinc-400"
                    } opacity-80`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              )}
              <span className={`text-xs font-semibold shrink-0 ${getBar ? "w-9 text-right" : ""} ${valueColorCls}`}>
                {getValue(p.player_id)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerEventBreakdown({ data, sessionPlayers, events }: PlayerEventBreakdownProps) {
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [winExpanded, setWinExpanded] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [mobileWinExpanded, setMobileWinExpanded] = useState(false);
  const [mobileErrorExpanded, setMobileErrorExpanded] = useState(false);
  const [mobileEventsExpanded, setMobileEventsExpanded] = useState(false);

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
        const score = config.role === "actor" ? scoringTable[config.eventType].actor : scoringTable[config.eventType].involved;
        total += count * score;
      }
      totalPc[p.player_id] = round2(total);
    }
  }

  const winners: Record<number, number> = {};
  for (const p of players) {
    winners[p.player_id] = WINNER_KEYS.reduce((sum, key) => {
      const config = PLAYER_EVENT_ROW_CONFIGS.find((c) => c.key === key)!;
      return sum + (lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0);
    }, 0);
  }

  const unforcedErrors: Record<number, number> = {};
  for (const p of players) {
    unforcedErrors[p.player_id] =
      (lookup[`actor_unforced_error_attack_${p.player_id}`] ?? 0) +
      (lookup[`actor_unforced_error_defense_${p.player_id}`] ?? 0);
  }

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

  // Shared scale computations
  const ratios = players.map((p) => {
    const winPct = totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0;
    const errPct = totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0;
    return errPct === 0 ? null : round2(winPct / errPct);
  });
  const finiteRatios = ratios.filter((r): r is number => r !== null);
  const maxDist = finiteRatios.length > 0 ? Math.max(...finiteRatios.map((r) => Math.abs(r - 1.0)), 0.5) : 1.0;
  const scaleMin = 1.0 - maxDist;
  const scaleMax = 1.0 + maxDist;
  function toPercent(value: number) { return ((value - scaleMin) / (scaleMax - scaleMin)) * 100; }
  const midPct = toPercent(1.0);

  const maxBarPct = Math.max(...players.map((p) => Math.max(
    totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0,
    totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0,
  )));

  const maxWinners = Math.max(...players.map((p) => winners[p.player_id] ?? 0), 1);
  const maxUE = Math.max(...players.map((p) => unforcedErrors[p.player_id] ?? 0), 1);
  const maxPcAbs = Math.max(...players.map((p) => Math.abs(totalPc[p.player_id] ?? 0)), 1);

  const playerCols = players.map((p) => (
    <th key={p.player_id} className="py-2 px-3 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      {p.player_name}
    </th>
  ));

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="block lg:hidden">

        {/* Summary section */}
        <div className="mb-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Summary</p>

          {/* Win/Error Ratio */}
          <MobileMetricRow
            label="Win / Error Ratio"
            tooltip="Win Contribution % ÷ Error %. Higher than 1.0 means more wins than errors."
            players={players}
            getValue={(pid) => {
              const winPct = totalPoints > 0 ? totalWins[pid] / totalPoints : 0;
              const errPct = totalPoints > 0 ? totalErrors[pid] / totalPoints : 0;
              const ratio = errPct === 0 ? (winPct > 0 ? Infinity : null) : round2(winPct / errPct);
              return ratio === null ? "—" : ratio === Infinity ? "∞" : ratio.toFixed(2);
            }}
            getBar={(pid) => {
              const winPct = totalPoints > 0 ? totalWins[pid] / totalPoints : 0;
              const errPct = totalPoints > 0 ? totalErrors[pid] / totalPoints : 0;
              const ratio = errPct === 0 ? (winPct > 0 ? Infinity : null) : round2(winPct / errPct);
              if (ratio === null || totalPoints === 0) return 0;
              const dotPct = ratio === Infinity ? 100 : toPercent(Math.min(Math.max(ratio, scaleMin), scaleMax));
              return dotPct;
            }}
            getColor={(pid) => {
              const winPct = totalPoints > 0 ? totalWins[pid] / totalPoints : 0;
              const errPct = totalPoints > 0 ? totalErrors[pid] / totalPoints : 0;
              const ratio = errPct === 0 ? (winPct > 0 ? Infinity : null) : round2(winPct / errPct);
              return ratio !== null && ratio >= 1.0 ? "green" : "red";
            }}
          />

          {/* Win % */}
          <MobileMetricRow
            label="Win Contribution %"
            tooltip="% of rallies where player contributed to winning the point"
            players={players}
            getValue={(pid) => totalPoints > 0 ? formatPct(totalWins[pid] / totalPoints) : "—"}
            getBar={(pid) => maxBarPct > 0 ? (totalPoints > 0 ? totalWins[pid] / totalPoints : 0) / maxBarPct * 100 : 0}
            getColor={() => "green"}
            sub={totalPoints > 0 && (
              <button onClick={() => setMobileWinExpanded(v => !v)} className="text-[10px] text-zinc-400 hover:text-indigo-500 ml-1">
                {mobileWinExpanded ? "▴" : "▾"}
              </button>
            )}
          />
          {mobileWinExpanded && WIN_COMPONENTS.map((wc) => (
            <div key={wc.key} className="pl-4 mb-1">
              <MobileMetricRow
                label={<span className="text-emerald-600 dark:text-emerald-500 italic">{wc.label}</span>}
                players={players}
                getValue={(pid) => totalPoints > 0 ? formatPct(winCounts[wc.key][pid] / totalPoints) : "—"}
                getColor={() => "green"}
              />
            </div>
          ))}

          {/* Error % */}
          <MobileMetricRow
            label="Error %"
            tooltip="% of rallies where player contributed to losing the point"
            players={players}
            getValue={(pid) => totalPoints > 0 ? formatPct(totalErrors[pid] / totalPoints) : "—"}
            getBar={(pid) => maxBarPct > 0 ? (totalPoints > 0 ? totalErrors[pid] / totalPoints : 0) / maxBarPct * 100 : 0}
            getColor={() => "red"}
            sub={totalPoints > 0 && (
              <button onClick={() => setMobileErrorExpanded(v => !v)} className="text-[10px] text-zinc-400 hover:text-indigo-500 ml-1">
                {mobileErrorExpanded ? "▴" : "▾"}
              </button>
            )}
          />
          {mobileErrorExpanded && ERROR_COMPONENTS.map((ec) => (
            <div key={ec.key} className="pl-4 mb-1">
              <MobileMetricRow
                label={<span className="text-red-400 dark:text-red-500 italic">{ec.label}</span>}
                players={players}
                getValue={(pid) => totalPoints > 0 ? formatPct(errorCounts[ec.key][pid] / totalPoints) : "—"}
                getColor={() => "red"}
              />
            </div>
          ))}

          {/* Winners */}
          <MobileMetricRow
            label="Winners"
            players={players}
            getValue={(pid) => winners[pid] ?? 0}
            getBar={(pid) => (winners[pid] ?? 0) / maxWinners * 100}
            getColor={() => "green"}
          />

          {/* Unforced Errors */}
          <MobileMetricRow
            label="Unforced Errors"
            players={players}
            getValue={(pid) => unforcedErrors[pid] ?? 0}
            getBar={(pid) => (unforcedErrors[pid] ?? 0) / maxUE * 100}
            getColor={() => "red"}
          />

          {/* Total PC */}
          <MobileMetricRow
            label={<>Total PC <span className="text-zinc-300 dark:text-zinc-600 font-mono text-[10px]">v{CURRENT_SCORING_VERSION}</span></>}
            players={players}
            getValue={(pid) => formatPc(totalPc[pid] ?? 0)}
            getBar={(pid) => Math.abs(totalPc[pid] ?? 0) / maxPcAbs * 100}
            getColor={(pid) => (totalPc[pid] ?? 0) >= 0 ? "green" : "red"}
          />
        </div>

        {/* Event breakdown */}
        <button
          onClick={() => setMobileEventsExpanded(v => !v)}
          className="w-full text-[10px] font-semibold text-zinc-400 uppercase tracking-wide py-2 text-left hover:text-indigo-500 transition-colors"
        >
          {mobileEventsExpanded ? "▴ Hide Event Breakdown" : "▾ Event Breakdown"}
        </button>

        {mobileEventsExpanded && PLAYER_EVENT_ROW_CONFIGS.map((config) => {
          const pcScore = config.role === "actor" ? scoringTable[config.eventType].actor : scoringTable[config.eventType].involved;
          const maxCount = Math.max(...players.map((p) => lookup[`${config.role}_${config.eventType}_${p.player_id}`] ?? 0), 1);
          return (
            <MobileMetricRow
              key={config.key}
              label={
                <span className={config.positive ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}>
                  {config.label}
                </span>
              }
              tooltip={`${config.tooltip} (${formatPc(pcScore)} PC)`}
              players={players}
              getValue={(pid) => {
                const count = lookup[`${config.role}_${config.eventType}_${pid}`] ?? 0;
                return count > 0 ? count : "—";
              }}
              getBar={(pid) => (lookup[`${config.role}_${config.eventType}_${pid}`] ?? 0) / maxCount * 100}
              getColor={() => config.positive ? "green" : "red"}
            />
          );
        })}
      </div>

      {/* ── DESKTOP: table (unchanged) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="py-2 px-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide w-48">Summary</th>
              {playerCols}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">

            {/* Win / Error Ratio */}
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="py-2 px-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Win / Error Ratio</span>
                  <InfoTooltip text="Win Contribution % ÷ Error %. Dot to the right of centre (1.0) means more wins than errors." />
                </div>
              </td>
              {players.map((p) => {
                const winPct = totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0;
                const errPct = totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0;
                const ratio = errPct === 0 ? (winPct > 0 ? Infinity : null) : round2(winPct / errPct);
                const dotPct = ratio === null ? null : ratio === Infinity ? 100 : toPercent(Math.min(Math.max(ratio, scaleMin), scaleMax));
                const isGood = ratio !== null && ratio >= 1.0;
                return (
                  <td key={p.player_id} className="py-3 px-3">
                    {totalPoints === 0 || ratio === null ? (
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="relative h-4 flex items-center">
                          <div className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-700" />
                          <div className="absolute w-px h-3 bg-zinc-400 dark:bg-zinc-500" style={{ left: `${midPct}%` }} />
                          <div className={`absolute w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 transition-all duration-300 ${isGood ? "bg-emerald-500" : "bg-red-400"}`}
                            style={{ left: `calc(${dotPct}% - 6px)` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-400">
                          <span>{round2(scaleMin).toFixed(1)}</span>
                          <span className={`font-semibold text-xs ${isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                            {ratio === Infinity ? "∞" : ratio.toFixed(2)}
                          </span>
                          <span>{ratio === Infinity ? "∞" : round2(scaleMax).toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Win/Error bars */}
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="py-2 px-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Win / Error</span>
                    <InfoTooltip text="Green: Win Contribution % — % of rallies contributing to winning. Red: Error % — % of rallies contributing to losing." />
                    {totalPoints > 0 && (
                      <button onClick={() => { setWinExpanded(v => !v); setErrorExpanded(v => !v); }} className="text-[10px] text-zinc-400 hover:text-indigo-500 transition-colors">
                        {winExpanded ? "▴ hide" : "▾ breakdown"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 opacity-70" /> Win%</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-400 opacity-70" /> Err%</span>
                  </div>
                </div>
              </td>
              {players.map((p) => {
                const winPct = totalPoints > 0 ? totalWins[p.player_id] / totalPoints : 0;
                const errPct = totalPoints > 0 ? totalErrors[p.player_id] / totalPoints : 0;
                const winW = maxBarPct > 0 ? (winPct / maxBarPct) * 100 : 0;
                const errW = maxBarPct > 0 ? (errPct / maxBarPct) * 100 : 0;
                return (
                  <td key={p.player_id} className="py-2 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 opacity-80 rounded-full transition-all duration-300" style={{ width: `${winW}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 w-7 text-right shrink-0">
                          {totalPoints > 0 ? formatPct(winPct) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 opacity-80 rounded-full transition-all duration-300" style={{ width: `${errW}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-red-500 dark:text-red-400 w-7 text-right shrink-0">
                          {totalPoints > 0 ? formatPct(errPct) : "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
            {winExpanded && WIN_COMPONENTS.map((wc) => (
              <tr key={wc.key} className="bg-zinc-50 dark:bg-zinc-800/30">
                <td className="py-1.5 px-3 pl-6 text-xs text-emerald-600 dark:text-emerald-500 italic">{wc.label}</td>
                {players.map((p) => (
                  <td key={p.player_id} className="py-1.5 px-3 text-center text-xs text-zinc-400">
                    {totalPoints > 0 ? formatPct(winCounts[wc.key][p.player_id] / totalPoints) : "—"}
                  </td>
                ))}
              </tr>
            ))}
            {errorExpanded && ERROR_COMPONENTS.map((ec) => (
              <tr key={ec.key} className="bg-zinc-50 dark:bg-zinc-800/30">
                <td className="py-1.5 px-3 pl-6 text-xs text-red-400 dark:text-red-500 italic">{ec.label}</td>
                {players.map((p) => (
                  <td key={p.player_id} className="py-1.5 px-3 text-center text-xs text-zinc-400">
                    {totalPoints > 0 ? formatPct(errorCounts[ec.key][p.player_id] / totalPoints) : "—"}
                  </td>
                ))}
              </tr>
            ))}

            {/* Winners */}
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">Winners</td>
              {players.map((p) => (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{winners[p.player_id] ?? 0}</span>
                </td>
              ))}
            </tr>

            {/* Unforced Errors */}
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">Unforced Errors</td>
              {players.map((p) => (
                <td key={p.player_id} className="py-2 px-3 text-center">
                  <span className="font-semibold text-red-500 dark:text-red-400">{unforcedErrors[p.player_id] ?? 0}</span>
                </td>
              ))}
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

          <thead>
            <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 border-b border-zinc-100 dark:border-zinc-800">
              <th className="py-2 px-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Event Breakdown</th>
              {playerCols}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {PLAYER_EVENT_ROW_CONFIGS.map((config) => {
              const pcScore = config.role === "actor" ? scoringTable[config.eventType].actor : scoringTable[config.eventType].involved;
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
                          <span className={`font-semibold ${config.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{count}</span>
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
    </>
  );
}