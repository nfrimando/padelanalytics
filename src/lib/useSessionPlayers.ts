import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SessionPlayerOption, SessionPlayerWithName } from "@/lib/utils/types";

export function useSessionPlayers(session_id: string | null) {
  const [sessionPlayers, setSessionPlayers] = useState<SessionPlayerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) {
      setSessionPlayers([]);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from("session_players")
      .select("id, session_id, player_id, position, created_at, players(player_name, nickname)")
      .eq("session_id", session_id)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setSessionPlayers([]);
        } else {
          const options: SessionPlayerOption[] = (data ?? [])
            .sort((a, b) => a.position - b.position)
            .map((sp) => {
              const player = sp.players as unknown as { player_name: string; nickname: string | null } | null;
              return {
                id: sp.player_id,
                label: player?.nickname ?? player?.player_name ?? `Player ${sp.player_id}`,
                position: sp.position,
              };
            });
          setSessionPlayers(options);
        }
        setLoading(false);
      });
  }, [session_id]);

  return { sessionPlayers, loading, error };
}