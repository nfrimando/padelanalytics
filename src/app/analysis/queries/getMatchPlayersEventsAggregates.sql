create or replace function get_match_players_events_aggregates(session_id uuid)
returns table (
  player_id integer,
  player_name text,
  event_type text,
  role text,
  count bigint
)
language sql
as $$
  -- Actor perspective (who performed the action)
  select
    p.player_id,
    p.player_name,
    e.event_type,
    'actor' as role,
    count(*) as count
  from events e
  join players p on e.player_id = p.player_id
  where e.session_id = get_match_players_events_aggregates.session_id
  group by p.player_id, p.player_name, e.event_type

  union all

  -- Receiver perspective (who the action happened to)
  select
    p.player_id,
    p.player_name,
    e.event_type,
    'receiver' as role,
    count(*) as count
  from events e
  join players p on e.target_player_id = p.player_id
  where e.session_id = get_match_players_events_aggregates.session_id
    and e.target_player_id is not null
  group by p.player_id, p.player_name, e.event_type;
$$;