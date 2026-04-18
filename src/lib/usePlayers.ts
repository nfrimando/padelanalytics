import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function usePlayers() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*");
      if (error) {
        setError(error.message);
        setPlayers([]);
      } else {
        setPlayers(data || []);
        setError(null);
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  return { players, loading, error };
}
