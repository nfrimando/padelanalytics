"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import React from "react";
import Spinner from "@/app/components/Spinner";
import AnalyticsPlayerEventTable from "@/app/components/AnalyticsPlayerEventTable";
import AnalyticsMatchSummary from "@/app/components/AnalyticsMatchSummary";
import BackToSessionButton from "@/app/components/BackToSessionButton";
import SetGamePointsTable from "@/app/components/SetGamePointsTable";
import {
  useMatchAggregates,
  useMatchPlayerEventAggregates,
} from "@/lib/useAnalytics";

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

  const supabase = createSupabaseBrowserClient();

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

  // Match Aggregates
  const { data: aggregates, isLoading: aggregatesLoading } =
    useMatchAggregates(session_id);

  // Player-Event Aggregates
  const { data: playerEventAggs, isLoading: playerEventAggsLoading } =
    useMatchPlayerEventAggregates(session_id);

  // Trigger Next.js 404 during render — works correctly in client components
  if (status === "not_found") notFound();

  if (status === "loading") {
    <div className="mt-2 flex items-center gap-2 justify-center">
      <Spinner size="lg" />
      <span>Loading title...</span>
    </div>;
  }

  // Helper: Pivot data to { [event_type]: { [player_id]: count } }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-end mb-2">
        <BackToSessionButton sessionId={session_id} />
      </div>
      {/* Match Aggregates */}
      {aggregatesLoading ? (
        <div className="mt-8 flex items-center gap-2 justify-center">
          <Spinner size="lg" />
          <span className="text-lg font-medium text-gray-600">
            Loading match summary...
          </span>
        </div>
      ) : (
        <AnalyticsMatchSummary
          num_sets={aggregates?.num_sets}
          num_games={aggregates?.num_games}
          num_points={aggregates?.num_points}
        />
      )}

      {/* Set/Game Points Table */}
      <SetGamePointsTable sessionId={session_id} />

      {/* Player-Event Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Player Event Breakdown
        </h2>
        {playerEventAggsLoading ? (
          <div className="flex items-center gap-2 justify-center">
            <Spinner size="md" />
            <span className="text-gray-600">Loading player event data...</span>
          </div>
        ) : playerEventAggs && playerEventAggs.length > 0 ? (
          <AnalyticsPlayerEventTable data={playerEventAggs} />
        ) : (
          <div className="text-gray-500 text-center">
            No player event data available.
          </div>
        )}
      </div>
    </div>
  );
}
