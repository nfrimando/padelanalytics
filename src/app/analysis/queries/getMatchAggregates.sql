create or replace function get_match_aggregates(session_id uuid)
returns table (
  num_sets integer,
  num_games integer,
  num_points integer
)
language sql
as $$
  select
    count(distinct set_number) as num_sets,
    count(distinct game_number) as num_games,
    count(*) as num_points
  from public.events
  where events.session_id = get_match_aggregates.session_id;
$$;