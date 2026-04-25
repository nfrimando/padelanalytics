import type { EventType } from "@/lib/utils/types";

// ─── Scoring Versions ─────────────────────────────────────────────────────────
//
// Each version is a self-contained scoring table.
// To change the scoring system, add a new version and bump CURRENT_SCORING_VERSION.
// Old versions are kept for historical reference.

export type ScoringVersion = "v1";

export const CURRENT_SCORING_VERSION: ScoringVersion = "v1";

interface EventScore {
  /** Points awarded to the player who performed the action (actor) */
  actor: number;
  /** Points awarded to the player on the receiving end (involved player), if any */
  involved: number;
}

type ScoringTable = Record<EventType, EventScore>;

const SCORING_TABLES: Record<ScoringVersion, ScoringTable> = {
  v1: {
    winner:                { actor: +1.50, involved:  0.00 },
    winner_fed:            { actor: +1.00, involved: -0.50 },
    winner_assisted:       { actor: +0.75, involved:  0.00 },
    forced_error:          { actor: +0.75, involved: -0.75 },
    unforced_error_attack: { actor: -1.50, involved:  0.00 },
    unforced_error_defense:{ actor: -1.50, involved:  0.00 },
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PCDelta {
  actorPlayerId: number;
  actorDelta: number;
  involvedPlayerId: number | null;
  involvedDelta: number;
}

/**
 * Given a single event, returns the PC score deltas for the actor and
 * involved player under the specified scoring version.
 */
export function scoringEvent(
  eventType: EventType,
  actorPlayerId: number,
  involvedPlayerId: number | null,
  version: ScoringVersion = CURRENT_SCORING_VERSION
): PCDelta {
  const table = SCORING_TABLES[version];
  const { actor, involved } = table[eventType];

  return {
    actorPlayerId,
    actorDelta: actor,
    involvedPlayerId,
    involvedDelta: involvedPlayerId !== null ? involved : 0,
  };
}

/**
 * Returns the scoring table for a given version.
 * Useful for displaying the scoring legend in the UI.
 */
export function getScoringTable(
  version: ScoringVersion = CURRENT_SCORING_VERSION
): ScoringTable {
  return SCORING_TABLES[version];
}