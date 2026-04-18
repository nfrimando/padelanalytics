"use client";

import { useState } from "react";
import { useCreateSession } from "@/lib/useCreateSession";

function extractVideoId(url: string) {
  const regExp = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^#&?]*)/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function NewSessionPage() {
  const [url, setUrl] = useState("");
  const { createSession, loading, error } = useCreateSession();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [titleLoading, setTitleLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  const handleCreateSession = async () => {
    if (loading) return;
    const videoId = extractVideoId(url);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }
    await createSession(url, videoId);
  };

  const fetchVideoTitle = async (url: string) => {
    setTitleLoading(true);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${url}&format=json`,
      );
      const data = await res.json();
      setVideoTitle(data.title);
    } catch (err) {
      setVideoTitle(null);
    }
    setTitleLoading(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);

    const id = extractVideoId(value);
    setVideoId(id);

    if (id) {
      fetchVideoTitle(value);
    } else {
      setVideoTitle(null);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto" style={{ minWidth: "40vw" }}>
      <h1 className="text-2xl font-bold mb-4">Start Session</h1>

      <div className="flex w-full gap-2 mb-2">
        <input
          className="border p-2 rounded-l flex-grow min-w-0"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        <button
          disabled={!videoId || loading}
          onClick={handleCreateSession}
          className={`px-4 py-2 rounded-r whitespace-nowrap border font-semibold transition-colors duration-150 ${
            videoId && !loading
              ? "bg-black text-white border-black cursor-pointer hover:bg-gray-900"
              : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
          }`}
        >
          {loading ? "Creating..." : "Create Session"}
        </button>
      </div>

      {titleLoading ? (
        <div className="mt-2 flex items-center gap-2 justify-center text-center w-full">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Loading title...</span>
        </div>
      ) : (
        videoTitle && (
          <p className="mt-2 font-medium text-center w-full">{videoTitle}</p>
        )
      )}
      {videoId && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2 text-center">Preview</p>
          <div className="relative flex justify-center">
            {thumbLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 z-10">
                <svg
                  className="animate-spin h-8 w-8 text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              </div>
            )}
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="rounded border"
              onLoad={() => setThumbLoading(false)}
              onError={() => setThumbLoading(false)}
              style={{ display: thumbLoading ? "none" : "block" }}
              onLoadStart={() => setThumbLoading(true)}
            />
          </div>
        </div>
      )}

      {url && !videoId && (
        <p className="text-red-500 mt-2 text-sm">Invalid YouTube link</p>
      )}
    </div>
  );
}
