import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface CreateEventParams {
  session_id: string;
  timestamp_seconds: number;
  player_id: number;
  event_type: string;
  target_player_id?: number | null;
}

export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async ({
    session_id,
    timestamp_seconds,
    player_id,
    event_type,
    target_player_id = null,
  }: CreateEventParams) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("events")
      .insert({
        session_id,
        timestamp_seconds,
        player_id,
        event_type,
        target_player_id,
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    return data;
  };

  return { createEvent, loading, error };
}
