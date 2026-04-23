import type { SessionPlayer, Player, SessionPlayerOption, PlayerPosition } from "@/lib/utils/types";

/**
 * Maps raw session_players + players data into the flat
 * SessionPlayerOption shape used by UI selectors.
 */
export function toSessionPlayerOptions(
  sessionPlayers: SessionPlayer[],
  players: Player[]
): SessionPlayerOption[] {
  return [...sessionPlayers]
    .sort((a, b) => a.position - b.position)
    .map((sp) => {
      const player = players.find((p) => p.player_id === sp.player_id);
      return {
        id: sp.player_id,
        label: player?.nickname ?? player?.player_name ?? `Player ${sp.player_id}`,
        position: sp.position as PlayerPosition,
      };
    });
}