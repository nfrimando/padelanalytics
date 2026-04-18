"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function extractVideoId(url: string) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : null;
}

export default function NewSessionPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createSession = async () => {
    if (loading) return;
    setLoading(true);
    const videoId = extractVideoId(url);
    if (!videoId) {
      alert("Invalid YouTube URL");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        youtube_url: url,
        youtube_video_id: videoId,
        status: "live",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    router.push(`/session/${data.id}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Start Session</h1>

      <input
        className="border p-2 w-full"
        placeholder="Paste YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={loading}
      />

      <button
        onClick={createSession}
        className="mt-4 bg-black text-white px-4 py-2"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Session"}
      </button>
    </div>
  );
}
