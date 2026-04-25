import type { MatchSetsGamesTeamsAggregates, SessionPlayerWithName } from "@/lib/utils/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameSummary {
  gameNumber: number;
  t1Points: number;
  t2Points: number;
  winner: 1 | 2 | null;
}

export interface SetSummary {
  setNumber: number;
  t1Games: number;
  t2Games: number;
  t1Points: number;
  t2Points: number;
  winner: 1 | 2 | null;
  games: GameSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTeamLabel(
  team: 1 | 2,
  players: SessionPlayerWithName[]
): string {
  const teamPlayers = players.filter((p) =>
    team === 1 ? p.position <= 2 : p.position >= 3
  );
  return teamPlayers
    .map((p) => p.nickname ?? p.player_name ?? `Player ${p.player_id}`)
    .join(" & ");
}

export function buildSetSummaries(
  data: MatchSetsGamesTeamsAggregates[]
): SetSummary[] {
  const setsMap: Record<number, SetSummary> = {};

  for (const row of data) {
    if (!setsMap[row.set_number]) {
      setsMap[row.set_number] = {
        setNumber: row.set_number,
        t1Games: 0,
        t2Games: 0,
        t1Points: 0,
        t2Points: 0,
        winner: null,
        games: [],
      };
    }
    const set = setsMap[row.set_number];

    if (row.team === 1) set.t1Points += row.points_won;
    if (row.team === 2) set.t2Points += row.points_won;

    let game = set.games.find((g) => g.gameNumber === row.game_number);
    if (!game) {
      game = { gameNumber: row.game_number, t1Points: 0, t2Points: 0, winner: null };
      set.games.push(game);
    }
    if (row.team === 1) game.t1Points += row.points_won;
    if (row.team === 2) game.t2Points += row.points_won;
  }

  for (const set of Object.values(setsMap)) {
    set.games.sort((a, b) => a.gameNumber - b.gameNumber);
    for (const game of set.games) {
      if (game.t1Points > game.t2Points) { game.winner = 1; set.t1Games++; }
      else if (game.t2Points > game.t1Points) { game.winner = 2; set.t2Games++; }
    }
    if (set.t1Games > set.t2Games) set.winner = 1;
    else if (set.t2Games > set.t1Games) set.winner = 2;
  }

  return Object.values(setsMap).sort((a, b) => a.setNumber - b.setNumber);
}