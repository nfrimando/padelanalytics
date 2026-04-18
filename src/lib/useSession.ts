import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (error) {
        setError(error.message);
        setSession(null);
      } else {
        setSession(data);
        setError(null);
      }
      setLoading(false);
    };
    fetchSession();
  }, [sessionId]);

  return { session, loading, error };
}
