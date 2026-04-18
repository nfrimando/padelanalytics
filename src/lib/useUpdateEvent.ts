import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface UpdateEventParams {
  id: string;
  player_id: number;
  event_type: string;
  target_player_id?: number | null;
}

export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEvent = async ({
    id,
    player_id,
    event_type,
    target_player_id = null,
  }: UpdateEventParams) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("events")
      .update({
        player_id,
        event_type,
        target_player_id,
      })
      .eq("id", id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    return data;
  };

  return { updateEvent, loading, error };
}
