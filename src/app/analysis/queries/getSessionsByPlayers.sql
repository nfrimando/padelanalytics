CREATE OR REPLACE FUNCTION public.get_sessions_by_players(player_ids integer[])
RETURNS SETOF uuid
LANGUAGE sql
STABLE
AS $$
  SELECT session_id
  FROM public.session_players
  WHERE player_id = ANY(player_ids)
  GROUP BY session_id
  HAVING COUNT(DISTINCT player_id) = array_length(player_ids, 1);
$$;
 