-- ============================================================
-- RPC: get_player_dynamics
-- Returns actor → target counts for forced_error and winner_fed
-- Optionally filtered by set_number (NULL = all sets)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_player_dynamics(
  session_id uuid,
  filter_set_number integer DEFAULT NULL
)
RETURNS TABLE (
  actor_player_id   integer,
  actor_name        text,
  target_player_id  integer,
  target_name       text,
  event_type        text,
  count             bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.player_id          AS actor_player_id,
    pa.player_name       AS actor_name,
    e.target_player_id   AS target_player_id,
    pt.player_name       AS target_name,
    e.event_type         AS event_type,
    COUNT(*)             AS count
  FROM events e
  JOIN players pa ON e.player_id        = pa.player_id
  JOIN players pt ON e.target_player_id = pt.player_id
  WHERE e.session_id    = get_player_dynamics.session_id
    AND e.event_type    IN ('forced_error', 'winner_fed')
    AND e.target_player_id IS NOT NULL
    AND (filter_set_number IS NULL OR e.set_number = filter_set_number)
  GROUP BY
    e.player_id, pa.player_name,
    e.target_player_id, pt.player_name,
    e.event_type
  ORDER BY
    e.player_id, e.target_player_id, e.event_type;
$$;