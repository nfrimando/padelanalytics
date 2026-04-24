import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'


export function usePlayer(player_id: number | null) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player_id) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const supabase = createSupabaseBrowserClient()
    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("player_id", player_id)
        .single();
      if (error) {
        setError(error.message);
        setPlayer(null);
      } else {
        setPlayer(data);
        setError(null);
      }
      setLoading(false);
    };
    fetchPlayer();
  }, [player_id]);

  return { player, loading, error };
}
