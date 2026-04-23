import { supabase } from "@/lib/supabase/client";
import type { 
  Session, 
  Event, 
  Player, 
  SessionPlayerOption, 
  PlayerPosition, 
  MatchAggregates, 
  MatchPlayerEventAggregates,
  MatchSetsGamesTeamsAggregates
} from "@/lib/utils/types";

// Each function is a plain async function that either returns data or throws.
// React Query catches the thrown error and puts it in query.error for you.

export async function fetchSession(sessionId: string): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSessionPlayers(sessionId: string): Promise<SessionPlayerOption[]> {
  const { data, error } = await supabase
    .from("session_players")
    .select("id, session_id, player_id, position, created_at, players(player_name, nickname)")
    .eq("session_id", sessionId);
  if (error) throw error;

  return (data ?? [])
    .sort((a, b) => a.position - b.position)
    .map((sp) => {
      const playerArr = sp.players as { player_name: string; nickname: string | null }[] | null;
      const player = Array.isArray(playerArr) ? playerArr[0] : playerArr;
      return {
        id: sp.player_id,
        label: player?.nickname ?? player?.player_name ?? `Player ${sp.player_id}`,
        position: sp.position as PlayerPosition,
      };
    });
}

export async function fetchSessionEvents(sessionId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp_seconds", { ascending: true });
  if (error) throw error;
  return data as Event[];
}

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from("players").select("*");
  if (error) throw error;
  return data as Player[];
}

export async function createEventMutation(params: {
  session_id: string;
  timestamp_seconds: number;
  player_id: number;
  event_type: string;
  target_player_id: number | null;
  set_number: number;
  game_number: number;
}): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function updateEventMutation(params: {
  id: string;
  [key: string]: any;
}): Promise<Event> {
  const { id, ...fields } = params;
  const { data, error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function deleteEventMutation(id: string): Promise<string> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return id; // return the id so we know what to remove from the cache
}

// RPC Analytics ------------------------------------

export async function fetchMatchAggregates(
  sessionId: string
): Promise<MatchAggregates> {
  const { data, error } = await supabase.rpc("get_match_aggregates", {
    session_id: sessionId,
  });
  if (error) throw error;
  return data[0] as MatchAggregates;
}

export async function fetchMatchPlayerEventAggregates(
  sessionId: string
): Promise<MatchPlayerEventAggregates[]> {
  const { data, error } = await supabase.rpc("get_match_players_events_aggregates", {
    session_id: sessionId,
  });
  if (error) throw error;
  return data as MatchPlayerEventAggregates[];
}

export async function fetchMatchSetsGamesTeamsAggregates(
  sessionId: string
): Promise<MatchSetsGamesTeamsAggregates[]> {
  const { data, error } = await supabase.rpc("get_match_sets_games_teams_aggregates", {
    session_id: sessionId,
  });
  if (error) throw error;
  return data as MatchSetsGamesTeamsAggregates[];
}