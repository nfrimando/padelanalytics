import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessionEvents } from "@/lib/queries/supabase";
import { scoringEvent, CURRENT_SCORING_VERSION, type ScoringVersion } from "@/lib/scoring";
import type { Event, EventType } from "@/lib/utils/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/** One data point on the chart — represents the state after a single event */
export interface ContributionPoint {
  pointIndex: number;
  scores: Record<number, number>;
  setNumber: number;
  gameNumber: number;
  timestampSeconds: number;
  /** The event type that caused this point */
  eventType: EventType;
  /** The player who performed the action */
  actorPlayerId: number;
  /** The involved player, if any */
  involvedPlayerId: number | null;
}

/** The full contribution series for a session */
export interface ContributionSeries {
  /** Ordered array of data points — one per event */
  points: ContributionPoint[];
  /** All player IDs that appear in the series */
  playerIds: number[];
  /** The scoring version used to compute this series */
  scoringVersion: ScoringVersion;
}

// ─── Pure Transform ───────────────────────────────────────────────────────────

/**
 * Takes raw events and builds the cumulative PC time series.
 * Pure function — no side effects, easy to test.
 *
 * @param events   Raw events ordered by timestamp_seconds ascending
 * @param setNumber  If provided, only include events from this set
 * @param version  Scoring version to use
 */
export function buildContributionSeries(
  events: Event[],
  setNumber?: number,
  version: ScoringVersion = CURRENT_SCORING_VERSION
): ContributionSeries {
  // Collect all unique player IDs from the full event list first
  // (so players who don't act in a filtered set still appear with 0)
  const allPlayerIds = new Set<number>();
  for (const event of events) {
    allPlayerIds.add(event.player_id);
    if (event.target_player_id !== null) allPlayerIds.add(event.target_player_id);
  }
  const playerIds = Array.from(allPlayerIds);

  // Filter events by set if requested
  const filteredEvents = setNumber !== undefined
    ? events.filter((e) => e.set_number === setNumber)
    : events;

  // Running totals — start everyone at 0
  const running: Record<number, number> = {};
  for (const id of playerIds) running[id] = 0;

  const points: ContributionPoint[] = [];

  filteredEvents.forEach((event, i) => {
    const delta = scoringEvent(
      event.event_type,
      event.player_id,
      event.target_player_id,
      version
    );

    // Apply deltas to running totals
    running[delta.actorPlayerId] = round2(
      (running[delta.actorPlayerId] ?? 0) + delta.actorDelta
    );
    if (delta.involvedPlayerId !== null) {
      running[delta.involvedPlayerId] = round2(
        (running[delta.involvedPlayerId] ?? 0) + delta.involvedDelta
      );
    }

    points.push({
      pointIndex: i + 1,
      scores: { ...running },
      setNumber: event.set_number,
      gameNumber: event.game_number,
      timestampSeconds: event.timestamp_seconds,
      eventType: event.event_type,
      actorPlayerId: event.player_id,
      involvedPlayerId: event.target_player_id,
    });
  });

  return { points, playerIds, scoringVersion: version };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UsePlayerContributionOptions {
  /** If provided, only include events from this set */
  setNumber?: number;
  /** Scoring version override — defaults to current */
  version?: ScoringVersion;
}

export function usePlayerContribution(
  sessionId: string,
  options: UsePlayerContributionOptions = {}
) {
  const { setNumber, version } = options;

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: queryKeys.sessionEvents(sessionId),
    queryFn: () => fetchSessionEvents(sessionId),
    enabled: !!sessionId,
    staleTime: 1000 * 5,
  });

  const series =
    events.length > 0
      ? buildContributionSeries(events, setNumber, version)
      : null;

  return { series, isLoading, error: error?.message ?? null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}