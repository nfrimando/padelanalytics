import type { EventType } from "@/lib/utils/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventRole = "actor" | "receiver";

export interface PlayerEventRowConfig {
  key: string;
  eventType: EventType;
  role: EventRole;
  label: string;
  tooltip: string;
  /** Whether this event is considered positive for the player in this role */
  positive: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────
//
// Order here determines row order in the table.
// PC scores are NOT stored here — they are derived at render time from
// scoring.ts so versioning is always respected.
// To add a new event type: add a new entry here only.

export const PLAYER_EVENT_ROW_CONFIGS: PlayerEventRowConfig[] = [
  {
    key: "actor_winner",
    eventType: "winner",
    role: "actor",
    label: "Pure Winner",
    tooltip: "Pure skillz",
    positive: true,
  },
  {
    key: "actor_winner_assisted",
    eventType: "winner_assisted",
    role: "actor",
    label: "Assisted Winner",
    tooltip: "A winner directly resulting from partner's pressuring shot",
    positive: true,
  },
  {
    key: "receiver_winner_assisted",
    eventType: "winner_assisted",
    role: "receiver",
    label: "Assisted a Winner",
    tooltip: "A pressuring shot that led to partner's winner",
    positive: true,
  },
  {
    key: "actor_winner_fed",
    eventType: "winner_fed",
    role: "actor",
    label: "Fed Winner",
    tooltip: "A winner that resulted from an opponent's bad shot",
    positive: true,
  },
  {
    key: "receiver_winner_fed",
    eventType: "winner_fed",
    role: "receiver",
    label: "Fed a Winner",
    tooltip: "A shot that made it easy for the opponent to finish the point",
    positive: false,
  },
  {
    key: "actor_forced_error",
    eventType: "forced_error",
    role: "actor",
    label: "Forced an Error",
    tooltip: "Pressuring shot that caused an opponent to make a mistake",
    positive: true,
  },
  {
    key: "receiver_forced_error",
    eventType: "forced_error",
    role: "receiver",
    label: "Forced Error",
    tooltip: "Received a pressuring shot and made a forced error",
    positive: false,
  },
  {
    key: "actor_unforced_error_attack",
    eventType: "unforced_error_attack",
    role: "actor",
    label: "Unforced Error (Attack)",
    tooltip: "Unforced error made on an attacking shot (overhead, volley, bajada)",
    positive: false,
  },
  {
    key: "actor_unforced_error_defense",
    eventType: "unforced_error_defense",
    role: "actor",
    label: "Unforced Error (Defense)",
    tooltip: "Unforced error made from defending, or double faults",
    positive: false,
  },
];