"use client";

import { useState } from "react";
import type { PlayerDynamics, SessionPlayerWithName } from "@/lib/utils/types";

interface PlayerDynamicsMatrixProps {
  data: PlayerDynamics[];
  players: SessionPlayerWithName[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayerName(
  playerId: number,
  players: SessionPlayerWithName[]
): string {
  const p = players.find((p) => p.player_id === playerId);
  return p?.nickname ?? p?.player_name ?? `Player ${playerId}`;
}

function buildMatrix(
  data: PlayerDynamics[],
  playerIds: number[],
  eventType: "forced_error" | "winner_fed" | "all"
): Record<number, Record<number, number>> {
  const matrix: Record<number, Record<number, number>> = {};
  for (const actorId of playerIds) {
    matrix[actorId] = {};
    for (const targetId of playerIds) {
      matrix[actorId][targetId] = 0;
    }
  }
  for (const row of data) {
    if (eventType !== "all" && row.event_type !== eventType) continue;
    if (!matrix[row.actor_player_id]) continue;
    matrix[row.actor_player_id][row.target_player_id] =
      (matrix[row.actor_player_id][row.target_player_id] ?? 0) + row.count;
  }
  return matrix;
}

function maxValue(matrix: Record<number, Record<number, number>>, playerIds: number[]): number {
  let max = 0;
  for (const actorId of playerIds) {
    for (const targetId of playerIds) {
      max = Math.max(max, matrix[actorId]?.[targetId] ?? 0);
    }
  }
  return max;
}

type MatrixType = "combined" | "forced_error" | "winner_fed";

function getCellTooltip(
  actorName: string,
  targetName: string,
  value: number,
  matrixType: MatrixType
): string {
  if (value === 0) return "";
  switch (matrixType) {
    case "combined":
      return `${actorName} got ${value} pressure point${value !== 1 ? "s" : ""} on ${targetName}`;
    case "forced_error":
      return `${actorName} forced ${value} error${value !== 1 ? "s" : ""} on ${targetName}`;
    case "winner_fed":
      return `${actorName} had ${value} winner${value !== 1 ? "s" : ""} from ${targetName}'s fed shot${value !== 1 ? "s" : ""}`;
  }
}

// ─── Single matrix ────────────────────────────────────────────────────────────

function Matrix({
  title,
  description,
  matrix,
  playerIds,
  players,
  colorClass,
  matrixType,
}: {
  title: string;
  description: string;
  matrix: Record<number, Record<number, number>>;
  playerIds: number[];
  players: SessionPlayerWithName[];
  colorClass: string;
  matrixType: MatrixType;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const max = maxValue(matrix, playerIds);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>

      {/* Fixed tooltip rendered outside table overflow context */}
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
              {/* Top-left empty cell */}
              <th className="w-20" />
              {playerIds.map((targetId) => (
                <th
                  key={targetId}
                  className="text-center font-medium text-zinc-500 dark:text-zinc-400 pb-1 w-16"
                >
                  <span className="block truncate max-w-[64px]">
                    {getPlayerName(targetId, players)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerIds.map((actorId) => (
              <tr key={actorId}>
                {/* Row label */}
                <td className="pr-2 font-medium text-zinc-600 dark:text-zinc-300 text-right whitespace-nowrap">
                  <span className="block truncate max-w-[76px]">
                    {getPlayerName(actorId, players)}
                  </span>
                </td>
                {playerIds.map((targetId) => {
                  const value = matrix[actorId]?.[targetId] ?? 0;
                  const isSelf = actorId === targetId;
                  const intensity = max > 0 && !isSelf ? value / max : 0;
                  const tooltipText = !isSelf && value > 0
                    ? getCellTooltip(getPlayerName(actorId, players), getPlayerName(targetId, players), value, matrixType)
                    : "";

                  return (
                    <td key={targetId} className="text-center">
                      {isSelf ? (
                        <div className="w-14 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        </div>
                      ) : (
                        <div
                          className={`w-14 h-10 rounded-lg flex items-center justify-center font-semibold transition-all cursor-default ${
                            value === 0
                              ? "bg-zinc-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700"
                              : `${colorClass} text-white`
                          } ${tooltip && value > 0 ? "" : ""}`}
                          style={{ opacity: value === 0 ? 1 : 0.3 + intensity * 0.7 }}
                          onMouseEnter={(e) => {
                            if (tooltipText) {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setTooltip({
                                text: tooltipText,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {value === 0 ? "0" : value}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {max > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
              <div
                key={o}
                className={`w-4 h-3 rounded-sm ${colorClass}`}
                style={{ opacity: 0.3 + o * 0.7 }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerDynamicsMatrix({
  data,
  players,
}: PlayerDynamicsMatrixProps) {
  // Use position order from sessionPlayers
  const playerIds = players.map((p) => p.player_id);

  // Filter to only cross-team interactions (actor and target on different teams)
  // Padel: positions 1+2 = team 1, positions 3+4 = team 2
  const positionMap: Record<number, number> = {};
  for (const p of players) positionMap[p.player_id] = p.position;

  const crossTeamData = data.filter((row) => {
    const actorPos = positionMap[row.actor_player_id];
    const targetPos = positionMap[row.target_player_id];
    if (!actorPos || !targetPos) return true;
    const actorTeam = actorPos <= 2 ? 1 : 2;
    const targetTeam = targetPos <= 2 ? 1 : 2;
    return actorTeam !== targetTeam;
  });

  const forcedErrorMatrix = buildMatrix(crossTeamData, playerIds, "forced_error");
  const winnerFedMatrix = buildMatrix(crossTeamData, playerIds, "winner_fed");
  const combinedMatrix = buildMatrix(crossTeamData, playerIds, "all");

  const hasData = crossTeamData.length > 0;

  if (!hasData) {
    return (
      <p className="text-sm text-zinc-400 text-center py-4">
        No player dynamics data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-zinc-400">
        Row = actor · Column = who they targeted · Self-interactions excluded
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Matrix
          title="Combined Pressure"
          description="Total forced errors + fed winners (overall dominance)"
          matrix={combinedMatrix}
          playerIds={playerIds}
          players={players}
          colorClass="bg-emerald-500"
          matrixType="combined"
        />
        <Matrix
          title="Forced Errors"
          description="How many errors each player forced on opponents"
          matrix={forcedErrorMatrix}
          playerIds={playerIds}
          players={players}
          colorClass="bg-indigo-500"
          matrixType="forced_error"
        />
        <Matrix
          title="Fed Winners"
          description="How many easy balls each player gave to opponents"
          matrix={winnerFedMatrix}
          playerIds={playerIds}
          players={players}
          colorClass="bg-red-400"
          matrixType="winner_fed"
        />
      </div>
    </div>
  );
}