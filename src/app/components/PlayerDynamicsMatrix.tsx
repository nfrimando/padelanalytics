"use client";

import { useState } from "react";
import type { PlayerDynamics, SessionPlayerWithName } from "@/lib/utils/types";

interface PlayerDynamicsMatrixProps {
  data: PlayerDynamics[];
  players: SessionPlayerWithName[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayerName(playerId: number, players: SessionPlayerWithName[]): string {
  const p = players.find((p) => p.player_id === playerId);
  return p?.nickname ?? p?.player_name ?? `Player ${playerId}`;
}

function getTeam(position: number): 1 | 2 {
  return position <= 2 ? 1 : 2;
}

function buildMatrix(
  data: PlayerDynamics[],
  actorIds: number[],
  targetIds: number[],
  eventType: "forced_error" | "winner_fed" | "all"
): Record<number, Record<number, number>> {
  const matrix: Record<number, Record<number, number>> = {};
  for (const a of actorIds) {
    matrix[a] = {};
    for (const t of targetIds) matrix[a][t] = 0;
  }
  for (const row of data) {
    if (eventType !== "all" && row.event_type !== eventType) continue;
    if (matrix[row.actor_player_id] !== undefined && targetIds.includes(row.target_player_id)) {
      matrix[row.actor_player_id][row.target_player_id] =
        (matrix[row.actor_player_id][row.target_player_id] ?? 0) + row.count;
    }
  }
  return matrix;
}

// Build net matrix: team1 players as rows, team2 players as cols
// value = (row→col) - (col→row), positive favours row player
function buildPlayerNetMatrix(
  data: PlayerDynamics[],
  team1Ids: number[],
  team2Ids: number[],
  eventType: "forced_error" | "winner_fed" | "all"
): Record<number, Record<number, number>> {
  const matrix: Record<number, Record<number, number>> = {};
  for (const a of team1Ids) {
    matrix[a] = {};
    for (const t of team2Ids) matrix[a][t] = 0;
  }
  for (const row of data) {
    if (eventType !== "all" && row.event_type !== eventType) continue;
    // team1 player → team2 player: positive
    if (team1Ids.includes(row.actor_player_id) && team2Ids.includes(row.target_player_id)) {
      matrix[row.actor_player_id][row.target_player_id] =
        (matrix[row.actor_player_id][row.target_player_id] ?? 0) + row.count;
    }
    // team2 player → team1 player: subtract (negative for team1 row)
    if (team2Ids.includes(row.actor_player_id) && team1Ids.includes(row.target_player_id)) {
      matrix[row.target_player_id][row.actor_player_id] =
        (matrix[row.target_player_id][row.actor_player_id] ?? 0) - row.count;
    }
  }
  return matrix;
}

function maxAbsValue(matrix: Record<number, Record<number, number>>, rowIds: number[], colIds: number[]): number {
  let max = 0;
  for (const r of rowIds) for (const c of colIds) max = Math.max(max, Math.abs(matrix[r]?.[c] ?? 0));
  return max;
}

function maxValue(matrix: Record<number, Record<number, number>>, rowIds: number[], colIds: number[]): number {
  let max = 0;
  for (const r of rowIds) for (const c of colIds) max = Math.max(max, matrix[r]?.[c] ?? 0);
  return max;
}

type MatrixType = "combined" | "forced_error" | "winner_fed";

function getCellTooltip(actorName: string, targetName: string, value: number, matrixType: MatrixType, isNet = false): string {
  if (value === 0) return "";
  if (isNet) {
    const winner = value > 0 ? actorName : targetName;
    const loser = value > 0 ? targetName : actorName;
    const abs = Math.abs(value);
    return `${winner} had a net +${abs} pressure advantage over ${loser}`;
  }
  switch (matrixType) {
    case "combined":  return `${actorName} got ${value} pressure point${value !== 1 ? "s" : ""} on ${targetName}`;
    case "forced_error": return `${actorName} forced ${value} error${value !== 1 ? "s" : ""} on ${targetName}`;
    case "winner_fed":  return `${actorName} had ${value} winner${value !== 1 ? "s" : ""} from ${targetName}'s fed shot${value !== 1 ? "s" : ""}`;
  }
}

// ─── Reusable cell ────────────────────────────────────────────────────────────

function Cell({
  value,
  max,
  colorClass,
  tooltipText,
  blank = false,
  isNet = false,
  onEnter,
  onLeave,
}: {
  value: number;
  max: number;
  colorClass: string;
  tooltipText: string;
  blank?: boolean;
  isNet?: boolean;
  onEnter: (e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  if (blank) {
    return (
      <div className="w-14 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900/50" />
    );
  }

  if (isNet) {
    const abs = Math.abs(value);
    const intensity = max > 0 ? abs / max : 0;
    const opacity = value === 0 ? 1 : 0.25 + intensity * 0.75;
    return (
      <div
        className={`w-14 h-10 rounded-lg flex items-center justify-center font-semibold cursor-default transition-all ${
          value === 0
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
            : value > 0
            ? "bg-blue-500 text-white"
            : "bg-amber-400 text-white"
        }`}
        style={{ opacity: value === 0 ? 1 : opacity }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {value === 0 ? "0" : `${value > 0 ? "+" : ""}${value}`}
      </div>
    );
  }

  const intensity = max > 0 ? value / max : 0;
  return (
    <div
      className={`w-14 h-10 rounded-lg flex items-center justify-center font-semibold cursor-default transition-all ${
        value === 0
          ? "bg-zinc-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700"
          : `${colorClass} text-white`
      }`}
      style={{ opacity: value === 0 ? 1 : 0.3 + intensity * 0.7 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {value === 0 ? "0" : value}
    </div>
  );
}

// ─── Single matrix ────────────────────────────────────────────────────────────

function Matrix({
  title,
  description,
  matrix,
  rowIds,
  colIds,
  players,
  colorClass,
  matrixType,
  sameTeamPairs,
  isNet = false,
  teamLabels,
}: {
  title: string;
  description: string;
  matrix: Record<number, Record<number, number>>;
  rowIds: number[];
  colIds: number[];
  players: SessionPlayerWithName[];
  colorClass: string;
  matrixType: MatrixType;
  sameTeamPairs?: Set<string>;
  isNet?: boolean;
  teamLabels?: Record<number, string>;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const max = isNet
    ? maxAbsValue(matrix, rowIds, colIds)
    : maxValue(matrix, rowIds, colIds);

  function getLabel(id: number): string {
    if (teamLabels) return teamLabels[id] ?? `Team ${id}`;
    return getPlayerName(id, players);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>

      {tooltip && (
        <div
          className="fixed z-[100] w-52 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none text-center"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -110%)" }}
        >
          {tooltip.text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-700" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-20" />
              {colIds.map((colId) => (
                <th key={colId} className="text-center font-medium text-zinc-500 dark:text-zinc-400 pb-1 w-16">
                  <span className="block truncate max-w-[64px]">{getLabel(colId)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowIds.map((rowId) => (
              <tr key={rowId}>
                <td className="pr-2 font-medium text-zinc-600 dark:text-zinc-300 text-right whitespace-nowrap">
                  <span className="block truncate max-w-[76px]">{getLabel(rowId)}</span>
                </td>
                {colIds.map((colId) => {
                  const isSelf = rowId === colId;
                  const isSameTeam = sameTeamPairs?.has(`${rowId}-${colId}`);
                  const blank = isSelf || isSameTeam;
                  const value = matrix[rowId]?.[colId] ?? 0;
                  const tooltipText = !blank && (value !== 0)
                    ? getCellTooltip(getLabel(rowId), getLabel(colId), value, matrixType, isNet)
                    : "";

                  return (
                    <td key={colId} className="text-center">
                      <Cell
                        value={value}
                        max={max}
                        colorClass={colorClass}
                        tooltipText={tooltipText}
                        blank={blank}
                        isNet={isNet}
                        onEnter={(e) => {
                          if (tooltipText) {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setTooltip({ text: tooltipText, x: rect.left + rect.width / 2, y: rect.top });
                          }
                        }}
                        onLeave={() => setTooltip(null)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {max > 0 && !isNet && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
              <div key={o} className={`w-4 h-3 rounded-sm ${colorClass}`} style={{ opacity: 0.3 + o * 0.7 }} />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
      {max > 0 && isNet && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span className="text-amber-500">Col dominates</span>
          <div className="flex gap-0.5">
            {[1.0, 0.6, 0.25, 0.6, 1.0].map((o, i) => (
              <div key={i} className={`w-4 h-3 rounded-sm ${i < 2 ? "bg-amber-400" : i === 2 ? "bg-zinc-200 dark:bg-zinc-700" : "bg-blue-500"}`} style={{ opacity: o }} />
            ))}
          </div>
          <span className="text-blue-500">Row dominates</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerDynamicsMatrix({ data, players }: PlayerDynamicsMatrixProps) {
  const [teamView, setTeamView] = useState(false);

  const playerIds = players.map((p) => p.player_id);
  const positionMap: Record<number, number> = {};
  for (const p of players) positionMap[p.player_id] = p.position;

  // Same-team pairs — cells to blank out in player view
  const sameTeamPairs = new Set<string>();
  for (const a of playerIds) {
    for (const b of playerIds) {
      if (a !== b && getTeam(positionMap[a] ?? 0) === getTeam(positionMap[b] ?? 0)) {
        sameTeamPairs.add(`${a}-${b}`);
      }
    }
  }

  // Only cross-team data
  const crossTeamData = data.filter((row) => {
    const at = getTeam(positionMap[row.actor_player_id] ?? 0);
    const tt = getTeam(positionMap[row.target_player_id] ?? 0);
    return at !== tt;
  });

  const hasData = crossTeamData.length > 0;

  if (!hasData) {
    return <p className="text-sm text-zinc-400 text-center py-4">No player dynamics data yet.</p>;
  }

  const matrices = teamView
    ? [
        { type: "all" as const, title: "Combined Pressure (Net)", description: "Net pressure advantage per player matchup", color: "bg-emerald-500", matrixType: "combined" as MatrixType },
        { type: "forced_error" as const, title: "Forced Errors (Net)", description: "Net forced errors per player matchup", color: "bg-indigo-500", matrixType: "forced_error" as MatrixType },
        { type: "winner_fed" as const, title: "Fed Winners (Net)", description: "Net fed winners per player matchup", color: "bg-red-400", matrixType: "winner_fed" as MatrixType },
      ]
    : [
        { type: "all" as const, title: "Combined Pressure", description: "Total forced errors + fed winners", color: "bg-emerald-500", matrixType: "combined" as MatrixType },
        { type: "forced_error" as const, title: "Forced Errors", description: "How many errors each player forced", color: "bg-indigo-500", matrixType: "forced_error" as MatrixType },
        { type: "winner_fed" as const, title: "Fed Winners", description: "How many easy balls given to opponents", color: "bg-red-400", matrixType: "winner_fed" as MatrixType },
      ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-zinc-400">
          {teamView
            ? "Net view · Rows = Team 1 · Cols = Team 2 · Blue = row player dominated · Amber = column player dominated"
            : "Detailed view · Row = actor · Column = target · Same-team cells hidden"}
        </p>
        <button
          onClick={() => setTeamView((v) => !v)}
          className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
            teamView
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300"
          }`}
        >
          {teamView ? "Detailed" : "Net"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {matrices.map(({ type, title, description, color, matrixType }) => {
          if (teamView) {
            const team1Ids = players.filter((p) => p.position <= 2).map((p) => p.player_id);
            const team2Ids = players.filter((p) => p.position > 2).map((p) => p.player_id);
            const netMatrix = buildPlayerNetMatrix(crossTeamData, team1Ids, team2Ids, type);
            return (
              <Matrix
                key={type}
                title={title}
                description={description}
                matrix={netMatrix}
                rowIds={team1Ids}
                colIds={team2Ids}
                players={players}
                colorClass={color}
                matrixType={matrixType}
                isNet
              />
            );
          }
          const m = buildMatrix(crossTeamData, playerIds, playerIds, type);
          return (
            <Matrix
              key={type}
              title={title}
              description={description}
              matrix={m}
              rowIds={playerIds}
              colIds={playerIds}
              players={players}
              colorClass={color}
              matrixType={matrixType}
              sameTeamPairs={sameTeamPairs}
            />
          );
        })}
      </div>
    </div>
  );
}