// ─── Enums / Unions ───────────────────────────────────────────────────────────

export type EventType =
  | "winner"
  | "winner_fed"
  | "winner_assisted"
  | "forced_error"
  | "unforced_error_attack"
  | "unforced_error_defense";

export type SessionStatus = "live" | "completed";

export type PlayerPosition = 1 | 2 | 3 | 4;

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Player {
  player_id: number
  player_name: string
  nickname: string | null
  email: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string | null;
  status: SessionStatus;
  owner_id: string | null;
  edit_mode: EditMode;
  created_at: string;
  updated_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_id: number;
  position: PlayerPosition;
  created_at: string;
}

export interface Event {
  id: string;
  session_id: string;
  timestamp_seconds: number;
  event_type: EventType;
  player_id: number;
  target_player_id: number | null;
  set_number: number;
  game_number: number;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Derived / View Types ─────────────────────────────────────────────────────

/** SessionPlayer with player name fields joined in from the players table */
export interface SessionPlayerWithName extends SessionPlayer {
  player_name: string | null;
  nickname: string | null;
}

/** Flattened player object used in UI selectors */
export interface SessionPlayerOption {
  id: number;           // player_id
  label: string;        // nickname ?? player_name ?? fallback
  position: PlayerPosition;
}

// ─── RPC Analytics Queries ─────────────────────────────────────────────────────

export interface MatchAggregates {
  num_sets: number;
  num_games: number;
  num_points: number;
}

export interface MatchPlayerEventAggregates {
  player_id: number;
  player_name: string;
  event_type: EventType;
  role: "actor" | "receiver";
  count: number;
}

export type EditMode = "owner_only" | "invite_only" | "public_edit";

export interface SessionAccess {
  id: string;
  session_id: string;
  user_id: string;
  access_level: "view" | "edit";
  granted_at: string;
  // joined
  email?: string;
}

export interface PlayerDynamics {
  actor_player_id: number;
  actor_name: string;
  target_player_id: number;
  target_name: string;
  event_type: string;
  count: number;
}

export interface MatchSetsGamesTeamsAggregates {
  set_number: number;
  game_number: number;
  team: number;
  points_won: number;
}