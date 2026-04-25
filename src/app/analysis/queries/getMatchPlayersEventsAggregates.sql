-- ============================================================
-- Updated get_match_players_events_aggregates
-- Adds optional set_number filter (NULL = all sets)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_match_players_events_aggregates(
  session_id uuid,
  filter_set_number integer DEFAULT NULL
)
RETURNS TABLE (
  player_id integer,
  player_name text,
  event_type text,
  role text,
  count bigint
)
LANGUAGE sql
AS $$
  -- Actor perspective
  SELECT
    p.player_id,
    p.player_name,
    e.event_type,
    'actor' AS role,
    count(*) AS count
  FROM events e
  JOIN players p ON e.player_id = p.player_id
  WHERE e.session_id = get_match_players_events_aggregates.session_id
    AND (filter_set_number IS NULL OR e.set_number = filter_set_number)
  GROUP BY p.player_id, p.player_name, e.event_type

  UNION ALL

  -- Receiver perspective
  SELECT
    p.player_id,
    p.player_name,
    e.event_type,
    'receiver' AS role,
    count(*) AS count
  FROM events e
  JOIN players p ON e.target_player_id = p.player_id
  WHERE e.session_id = get_match_players_events_aggregates.session_id
    AND e.target_player_id IS NOT NULL
    AND (filter_set_number IS NULL OR e.set_number = filter_set_number)
  GROUP BY p.player_id, p.player_name, e.event_type;
$$;