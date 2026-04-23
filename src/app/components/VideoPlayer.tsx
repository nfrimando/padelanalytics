"use client";

import { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import Spinner from "@/app/components/Spinner";

interface VideoPlayerProps {
  videoId: string;
  videoLoading: boolean;
  onReady: (player: any) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function VideoPlayer({
  videoId,
  videoLoading,
  onReady,
  onLoadingChange,
}: VideoPlayerProps) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // handled by parent via player ref — keyboard logic lives here
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="relative min-h-[200px]">
      {videoLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/70 dark:bg-black/70">
          <Spinner size="lg" />
        </div>
      )}
      <YouTube
        videoId={videoId}
        onReady={(e) => {
          onReady(e.target);
          onLoadingChange(false);
        }}
        onStateChange={(e) => {
          if (e.data === 1) onLoadingChange(false);
        }}
        opts={{ width: "100%", height: "432" }}
      />
    </div>
  );
}
