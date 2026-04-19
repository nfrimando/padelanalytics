CREATE OR REPLACE FUNCTION get_match_aggregates(session_id uuid)
RETURNS TABLE (
  number_of_sets int,
  number_of_games int,
  number_of_events int
)
AS $$
  SELECT
    COUNT(DISTINCT set_number) AS number_of_sets,
    COUNT(DISTINCT set_number || '-' || game_number) AS number_of_games,
    COUNT(*) AS number_of_events
  FROM events
  WHERE session_id = get_match_aggregates.session_id;
$$ LANGUAGE sql;