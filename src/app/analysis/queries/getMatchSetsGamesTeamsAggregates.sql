create or replace function get_match_set_game_team_aggregates(session_id uuid)
returns table (
  set_number integer,
  game_number integer,
  team integer,
  points_won integer
)
language sql
as $$
    with team_map as (
    select
      sp.player_id,
      case
        when sp.position in (1, 2) then 1
        when sp.position in (3, 4) then 2
      end as team
    from session_players sp
    where sp.session_id = session_id
  ),
  points as (
    select
      e.set_number,
      e.game_number,
      case
        when e.event_type in ('winner', 'winner_fed', 'winner_assisted', 'forced_error') then tm.team
        when e.event_type in ('unforced_error_attack', 'unforced_error_defense') then
          case when tm.team = 1 then 2 else 1 end
      end as point_team
    from events e
    join team_map tm on e.player_id = tm.player_id
    where e.session_id = session_id
      and e.event_type in ('winner', 'winner_fed', 'winner_assisted', 'forced_error', 'unforced_error_attack', 'unforced_error_defense')
  )
  select
    p.set_number,
    p.game_number,
    p.point_team as team,
    count(*) as points_won
  from points p
  group by p.set_number, p.game_number, p.point_team
  order by p.set_number, p.game_number, p.point_team;
  $$;