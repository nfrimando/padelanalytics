"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { usePlayerContribution } from "@/lib/usePlayerContribution";
import type { ScoringVersion } from "@/lib/scoring";
import type { SessionPlayerWithName } from "@/lib/utils/types";
import { EVENT_TYPE_LABELS } from "@/lib/utils/session";
import Spinner from "@/app/components/Spinner";

// ─── Colours ──────────────────────────────────────────────────────────────────
// One colour per position slot — consistent across all charts in the session

const PLAYER_COLOURS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayerContributionChartProps {
  sessionId: string;
  /** Players with names, ordered by position */
  players: SessionPlayerWithName[];
  /** If provided, only shows events from this set */
  setNumber?: number;
  /** Scoring version override */
  version?: ScoringVersion;
  /** Chart title — defaults to "Player Contribution" */
  title?: string;
  height?: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PCTooltip({ active, payload, label, players }: any) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const timestampSeconds = point?.timestampSeconds;
  const eventType = point?.eventType;
  const actorPlayerId = point?.actorPlayerId;
  const involvedPlayerId = point?.involvedPlayerId;

  const getPlayerName = (id: number) => {
    const p = players.find((p: any) => p.player_id === id);
    return p?.nickname ?? p?.player_name ?? `Player ${id}`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 shadow-lg text-xs min-w-40">
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <p className="text-zinc-400">Point {label}</p>
        {timestampSeconds !== undefined && (
          <p className="text-zinc-400 font-mono">{formatTimestamp(timestampSeconds)}</p>
        )}
      </div>

      {/* Event info */}
      {eventType && (
        <div className="mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            {EVENT_TYPE_LABELS[eventType as keyof typeof EVENT_TYPE_LABELS]}
          </p>
          {actorPlayerId && (
            <p className="text-zinc-500 mt-0.5">
              by <span className="text-zinc-700 dark:text-zinc-300 font-medium">{getPlayerName(actorPlayerId)}</span>
            </p>
          )}
          {involvedPlayerId && (
            <p className="text-zinc-500">
              vs <span className="text-zinc-700 dark:text-zinc-300 font-medium">{getPlayerName(involvedPlayerId)}</span>
            </p>
          )}
        </div>
      )}

      {/* Scores */}
      {payload.map((entry: any) => {
        const name = getPlayerName(Number(entry.dataKey));
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-700 dark:text-zinc-300">{name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.value > 0 ? "+" : ""}
              {entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerContributionChart({
  sessionId,
  players,
  setNumber,
  version,
  title = "Player Contribution",
  height = 320,
}: PlayerContributionChartProps) {
  const { series, isLoading, error } = usePlayerContribution(sessionId, {
    setNumber,
    version,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-8">
        <Spinner size="sm" />
        <span>Loading contribution data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 py-4">
        Failed to load contribution data.
      </p>
    );
  }

  if (!series || series.points.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-4 text-center">
        No events logged yet.
      </p>
    );
  }

  // Build the chart data — one object per point with each player's score as a key
  const chartData = series.points.map((point) => {
    const row: Record<string, unknown> = {
      pointIndex: point.pointIndex,
      timestampSeconds: point.timestampSeconds,
      eventType: point.eventType,
      actorPlayerId: point.actorPlayerId,
      involvedPlayerId: point.involvedPlayerId,
    };
    for (const player of players) {
      row[String(player.player_id)] = point.scores[player.player_id] ?? 0;
    }
    return row;
  });

  // Detect set boundaries for reference lines
  const setBoundaries: number[] = [];
  if (!setNumber) {
    let currentSet = series.points[0]?.setNumber;
    for (const point of series.points) {
      if (point.setNumber !== currentSet) {
        setBoundaries.push(point.pointIndex - 1);
        currentSet = point.setNumber;
      }
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 border border-zinc-100 dark:border-zinc-800">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
        {title}
      </h2>
      <p className="text-xs text-zinc-400 mb-4">
        Scoring v{series.scoringVersion} · {series.points.length} events
      </p>

      {/* Custom legend — position-ordered */}
      <div className="flex flex-wrap gap-3 mb-3">
        {players.map((player, i) => (
          <div key={player.player_id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: PLAYER_COLOURS[i % PLAYER_COLOURS.length] }}
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-300">
              {player.nickname ?? player.player_name ?? `Player ${player.player_id}`}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />

          <XAxis
            dataKey="pointIndex"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Points played",
              position: "insideBottomRight",
              offset: -5,
              fontSize: 11,
              fill: "#a1a1aa",
            }}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
          />

          <Tooltip content={<PCTooltip players={players} />} />

          <ReferenceLine y={0} stroke="#71717a" strokeWidth={1} />

          {/* Set boundary lines */}
          {setBoundaries.map((x) => (
            <ReferenceLine
              key={x}
              x={x}
              stroke="#71717a"
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />
          ))}

          {/* One line per player */}
          {players.map((player, i) => (
            <Line
              key={player.player_id}
              type="monotone"
              dataKey={String(player.player_id)}
              name={String(player.player_id)}
              stroke={PLAYER_COLOURS[i % PLAYER_COLOURS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}