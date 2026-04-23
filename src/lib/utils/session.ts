import type { EventType, PlayerPosition, SessionPlayerOption } from "@/lib/utils/types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const EVENT_TYPES: EventType[] = [
  "winner",
  "winner_fed",
  "winner_assisted",
  "forced_error",
  "unforced_error_attack",
  "unforced_error_defense",
];

/** Human-readable labels for each event type, used in UI selectors */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  winner: "Winner",
  winner_fed: "Winner Fed",
  winner_assisted: "Winner Assisted",
  forced_error: "Forced Error",
  unforced_error_attack: "Unforced Error Attack",
  unforced_error_defense: "Unforced Error Defense",
};

// ─── Player Relationships ─────────────────────────────────────────────────────

interface PositionRelationships {
  partnerPositions: PlayerPosition[];
  opponentPositions: PlayerPosition[];
}

export function getPositionRelationships(
  position: PlayerPosition
): PositionRelationships {
  switch (position) {
    case 1: return { partnerPositions: [2], opponentPositions: [3, 4] };
    case 2: return { partnerPositions: [1], opponentPositions: [3, 4] };
    case 3: return { partnerPositions: [4], opponentPositions: [1, 2] };
    case 4: return { partnerPositions: [3], opponentPositions: [1, 2] };
  }
}

// ─── Event Logic ──────────────────────────────────────────────────────────────

/**
 * Returns positions that should be disabled in the "involved player" selector
 * for a given event type and the acting player's position.
 *
 * An empty array means all positions are selectable.
 * ALL positions disabled means the involved player selector is not applicable.
 */
export function getDisabledPositionsForEvent(
  eventType: EventType,
  playerPosition: PlayerPosition
): PlayerPosition[] {
  const { partnerPositions, opponentPositions } =
    getPositionRelationships(playerPosition);

  switch (eventType) {
    case "winner":
      return [1, 2, 3, 4];

    case "winner_fed":
      // Fed by an opponent — disable self and partner
      return [playerPosition, ...partnerPositions];

    case "winner_assisted":
      // Assisted by partner — disable self and opponents
      return [playerPosition, ...opponentPositions];

    case "forced_error":
      // Error forced by an opponent — disable self and partner
      return [playerPosition, ...partnerPositions];

    case "unforced_error_attack":
    case "unforced_error_defense":
      return [1, 2, 3, 4];
  }
}

/**
 * Returns true if the involved player selector is not applicable
 * for the given event type (i.e. all positions are disabled).
 */
export function isInvolvedPlayerRequired(eventType: EventType): boolean {
  return !getDisabledPositionsForEvent(eventType, 1).includes(1);
}

// ─── Player Label Resolution ──────────────────────────────────────────────────

export function getPlayerLabel(
  playerId: number,
  players: SessionPlayerOption[]
): string {
  return players.find((p) => p.id === playerId)?.label ?? String(playerId);
}

/**
 * Given a player's position and a list of session players,
 * returns the partner's player_id, or null if not found.
 */
export function getPartnerPlayerId(
  playerPosition: PlayerPosition,
  players: SessionPlayerOption[]
): number | null {
  const { partnerPositions } = getPositionRelationships(playerPosition);
  return players.find((p) => p.position === partnerPositions[0])?.id ?? null;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}