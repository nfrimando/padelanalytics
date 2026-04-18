import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function useCreateSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createSession = async (url: string, videoId: string) => {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        youtube_url: url,
        youtube_video_id: videoId,
        status: "live",
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    router.push(`/session/${data.id}`);
    return data;
  };

  return { createSession, loading, error };
}
