

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function useSessionEvents(sessionId: string | null) {
  const [events, setEvents] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      setPlayers([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const supabase = createSupabaseBrowserClient()
      // Fetch both in parallel
      const [eventsRes, playersRes] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("session_id", sessionId)
          .order("timestamp_seconds", { ascending: true }),

        supabase
          .from("session_players")
          .select("player_id, position, players(player_name, nickname)")
          .eq("session_id", sessionId)
      ]);

      if (eventsRes.error) {
        setError(eventsRes.error.message);
        setEvents([]);
      } else {
        setEvents(eventsRes.data || []);
      }

      if (playersRes.error) {
        setError(playersRes.error.message);
        setPlayers([]);
      } else {
        // Flatten player_name and nickname from joined players relation
        const playersWithName = (playersRes.data || []).map((sp: any) => ({
          ...sp,
          player_name: sp.players?.player_name || null,
          nickname: sp.players?.nickname || null,
        }));
        setPlayers(playersWithName);
      }

      setLoading(false);
    };

    fetchData();
  }, [sessionId]);

  return { events, players, loading, error };
}