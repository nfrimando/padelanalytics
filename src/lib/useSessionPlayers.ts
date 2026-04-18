import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useSessionPlayers(session_id: string | null) {
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
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
      .select("*")
      .eq("session_id", session_id)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setSessionPlayers(data || []);
        setLoading(false);
      });
  }, [session_id]);

  return { sessionPlayers, loading, error };
}
