"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import React from "react";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Status = "loading" | "found" | "not_found";

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = React.use(params);
  const [status, setStatus] = useState<Status>("loading");

  const isValidUuid = UUID_V4_REGEX.test(session_id ?? "");

  useEffect(() => {
    if (!isValidUuid) {
      setStatus("not_found");
      return;
    }

    let cancelled = false;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .eq("id", session_id)
        .single();

      if (cancelled) return;
      setStatus(error || !data ? "not_found" : "found");
    };

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [session_id, isValidUuid]);

  // Trigger Next.js 404 during render — works correctly in client components
  if (status === "not_found") notFound();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg
          className="animate-spin h-10 w-10 text-blue-600"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  return <div className="p-6 max-w-5xl mx-auto">Hello World!</div>;
}
