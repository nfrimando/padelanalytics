import React from "react";
import { useMatchSetsGamesTeamsAggregates } from "@/lib/useAnalytics";
import Spinner from "./Spinner";

interface Props {
  sessionId: string;
}

export default function SetGamePointsTable({ sessionId }: Props) {
  const { data, isLoading, error } =
    useMatchSetsGamesTeamsAggregates(sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 justify-center my-8">
        <Spinner size="md" />
        <span className="text-gray-600">Loading set/game points...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">Error loading set/game points.</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="text-gray-500 text-center mb-4">
        No set/game points data available.
      </div>
    );
  }

  // Get unique sets and games
  const sets = Array.from(new Set(data.map((d) => d.set_number))).sort(
    (a, b) => a - b,
  );
  // Always show 13 games
  const games = Array.from({ length: 13 }, (_, i) => i + 1);

  // Build lookup: { [game_number]: { [set_number]: { t1, t2 } } }
  const lookup: Record<number, Record<number, { t1: number; t2: number }>> = {};
  data.forEach(({ set_number, game_number, team, points_won }) => {
    if (!lookup[game_number]) lookup[game_number] = {};
    if (!lookup[game_number][set_number])
      lookup[game_number][set_number] = { t1: 0, t2: 0 };
    if (team === 1) lookup[game_number][set_number].t1 = points_won;
    if (team === 2) lookup[game_number][set_number].t2 = points_won;
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Set/Game Points by Team
      </h2>
      <table className="min-w-full border text-sm mb-2">
        <thead>
          <tr>
            <th className="px-3 py-2 border-b text-left">Game</th>
            {sets.map((set) => (
              <th key={set} className="px-3 py-2 border-b text-center">
                Set {set}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game}>
              <td className="px-3 py-2 border-b">{game}</td>
              {sets.map((set) => {
                const cell = lookup[game]?.[set] || { t1: 0, t2: 0 };
                const display =
                  cell.t1 === 0 && cell.t2 === 0
                    ? "-"
                    : `${cell.t1}-${cell.t2}`;
                return (
                  <td key={set} className="px-3 py-2 border-b text-center">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
