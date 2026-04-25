"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import React from "react";
import Spinner from "@/app/components/Spinner";
import PlayerEventBreakdown from "@/app/components/PlayerEventBreakdown";
import MatchSummaryCard from "@/app/components/MatchSummaryCard";
import BackToSessionButton from "@/app/components/BackToSessionButton";
import PlayerContributionChart from "@/app/components/PlayerContributionChart";
import {
  useMatchAggregates,
  useMatchSetsGamesTeamsAggregates,
  useMatchPlayerEventAggregates,
  useSessionPlayersWithNames,
} from "@/lib/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessionEvents } from "@/lib/queries/supabase";
import { buildSetSummaries } from "@/lib/matchSummaryUtils";

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
    if (!isValidUuid) { setStatus("not_found"); return; }
    let cancelled = false;
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions").select("id").eq("id", session_id).single();
      if (cancelled) return;
      setStatus(error || !data ? "not_found" : "found");
    };
    fetchSession();
    return () => { cancelled = true; };
  }, [session_id, isValidUuid]);

  const [selectedSet, setSelectedSet] = useState<number | undefined>(undefined);

  // ─── Data fetching ────────────────────────────────────────────────────────
  const { data: aggregates } = useMatchAggregates(session_id);
  const { data: setsData = [] } = useMatchSetsGamesTeamsAggregates(session_id);
  const { data: playerEventAggs, isLoading: playerEventAggsLoading } = useMatchPlayerEventAggregates(session_id, selectedSet);
  const { data: sessionPlayers = [] } = useSessionPlayersWithNames(session_id);
  const { data: events = [] } = useQuery({
    queryKey: queryKeys.sessionEvents(session_id),
    queryFn: () => fetchSessionEvents(session_id),
    enabled: !!session_id,
    staleTime: 1000 * 5,
  });

  // Build set summaries once, share across components
  const sets = setsData.length > 0 ? buildSetSummaries(setsData) : [];

  if (status === "not_found") notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-end mb-4">
        <BackToSessionButton sessionId={session_id} />
      </div>

      {/* Match summary */}
      <MatchSummaryCard
        players={sessionPlayers}
        sets={sets}
        aggregates={aggregates}
      />

      {/* Player Contribution Chart */}
      {sessionPlayers.length > 0 && (
        <div className="mb-6">
          <PlayerContributionChart
            sessionId={session_id}
            players={sessionPlayers}
          />
        </div>
      )}

      {/* Player Event Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Player Event Breakdown
          </h2>
          <div className="flex items-center gap-3">
            {/* Point count */}
            <span className="text-xs text-zinc-400">
              {(selectedSet ? events.filter((e) => e.set_number === selectedSet) : events).length} points
            </span>
            {/* Set filter */}
            {sets.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSet(undefined)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedSet === undefined
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300"
                  }`}
                >
                  All sets
                </button>
                {sets.map((s) => (
                  <button
                    key={s.setNumber}
                    onClick={() => setSelectedSet(s.setNumber)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedSet === s.setNumber
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300"
                    }`}
                  >
                    Set {s.setNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {playerEventAggsLoading ? (
          <div className="flex items-center gap-2 justify-center">
            <Spinner size="md" />
            <span className="text-zinc-500">Loading player event data...</span>
          </div>
        ) : (
          <PlayerEventBreakdown data={playerEventAggs ?? []} sessionPlayers={sessionPlayers} events={selectedSet ? events.filter((e) => e.set_number === selectedSet) : events} />
        )}
      </div>
    </div>
  );
}