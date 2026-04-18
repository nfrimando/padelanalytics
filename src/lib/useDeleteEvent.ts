import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useDeleteEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return false;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("events").delete().eq("id", id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  };

  return { deleteEvent, loading, error };
}
