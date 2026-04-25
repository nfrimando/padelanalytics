"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessions } from "@/lib/queries/supabase";
import { useAuth } from "@/lib/useAuth";
import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import type { SessionStatus } from "@/lib/utils/types";

const STATUSES: { value: SessionStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "live", label: "Live" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AnalysesPage() {
  const { user } = useAuth();
  const [selectedStatuses, setSelectedStatuses] = useState<SessionStatus[]>(["completed"]);

  function toggleStatus(status: SessionStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.length === 1
          ? prev // always keep at least one selected
          : prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }

  const filters = { status: selectedStatuses };
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.sessions(filters),
    queryFn: () => fetchSessions(filters),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Analyses
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse match analyses
          </p>
        </div>
        <Link
          href="/session/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Session
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 mb-6">
        {STATUSES.map(({ value, label }) => {
          const active = selectedStatuses.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg font-medium mb-1">No matches found</p>
          <p className="text-sm">Try selecting a different filter above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => {
            const isOwner = !!user && session.owner_id === user.id;
            const isLive = session.status === "live";
            return (
              <li key={session.id}>
                <Link
                  href={`/analysis/${session.id}`}
                  className="flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {session.title ?? "Untitled Match"}
                      </p>
                      {isLive && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded text-[10px] font-medium">
                          live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {session.owner_email ?? "Unknown"}
                      {isOwner && (
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded text-[10px] font-medium">
                          you
                        </span>
                      )}
                      {" · "}
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <span className="ml-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors text-lg shrink-0">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}