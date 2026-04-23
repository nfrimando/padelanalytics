import React from "react";

interface PlayerEventRow {
  player_id: number;
  player_name: string;
  event_type: string;
  role: "actor" | "receiver";
  count: number;
}

interface AnalyticsPlayerEventTableProps {
  data: PlayerEventRow[];
}

// Helper: Pivot and order event types, now supports role
const EVENT_ORDER = [
  "winner",
  "winner_assisted",
  "winner_fed",
  "forced_error",
  "unforced_error_attack",
  "unforced_error_defense",
];

export function transformPlayerEventData(
  data: PlayerEventRow[],
  role: "actor" | "receiver",
) {
  // Filter by role
  const filtered = data.filter((d) => d.role === role);
  // Get unique players
  const players = Array.from(
    new Map(filtered.map((d) => [d.player_id, d.player_name])).entries(),
  ).map(([player_id, player_name]) => ({ player_id, player_name }));

  // Only include event types that are present in the data, in the desired order
  const eventTypes = EVENT_ORDER.filter((type) =>
    filtered.some((d) => d.event_type === type),
  );

  // Build lookup: event_type -> player_id -> count
  const lookup: Record<string, Record<number, number>> = {};
  filtered.forEach(({ event_type, player_id, count }) => {
    if (!lookup[event_type]) lookup[event_type] = {};
    lookup[event_type][player_id] = count;
  });

  return { players, eventTypes, lookup };
}

function PlayerEventRoleTable({
  data,
  role,
}: {
  data: PlayerEventRow[];
  role: "actor" | "receiver";
}) {
  const { players, eventTypes, lookup } = transformPlayerEventData(data, role);
  if (players.length === 0 || eventTypes.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic mb-4">
        No data for this role.
      </div>
    );
  }
  return (
    <table className="min-w-full border text-sm mb-4">
      <thead>
        <tr>
          <th className="px-3 py-2 border-b text-left">Event</th>
          {players.map((p) => (
            <th key={p.player_id} className="px-3 py-2 border-b text-center">
              {p.player_name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {eventTypes.map((event) => (
          <tr key={event}>
            <td className="px-3 py-2 border-b font-medium">
              {event
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </td>
            {players.map((p) => (
              <td key={p.player_id} className="px-3 py-2 border-b text-center">
                {lookup[event]?.[p.player_id] ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AnalyticsPlayerEventTable({
  data,
}: AnalyticsPlayerEventTableProps) {
  return (
    <div className="overflow-x-auto mt-4">
      <h3 className="font-semibold mb-2">
        By Actor (Who made the winner, caused a forced error, or made an
        unforced error)
      </h3>
      <PlayerEventRoleTable data={data} role="actor" />
      <h3 className="font-semibold mt-6 mb-2">
        By Involved Player (Who assisted, fed a winner, or made the forced
        error)
      </h3>
      <PlayerEventRoleTable data={data} role="receiver" />
    </div>
  );
}
