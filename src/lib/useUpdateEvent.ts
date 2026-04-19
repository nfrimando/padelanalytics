import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export interface UpdateEventParams {
  id: string;
  // Only include fields that can be updated
  player_id?: number;
  event_type?: string;
  target_player_id?: number | null;
  set_number?: number;
  game_number?: number;
  timestamp_seconds?: number;
}

export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEvent = async (params: UpdateEventParams) => {
    setLoading(true);
    setError(null);
    const { id, ...fields } = params;
    const { data, error } = await supabase
      .from("events")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(typeof error === "string" ? error : error.message);
      return null;
    }
    return data;
  };

  return { updateEvent, loading, error };
}
