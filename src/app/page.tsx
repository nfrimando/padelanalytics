"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { BarChart2, PlusCircle } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error") === "true";

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 px-4">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-3">
            Padel Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-md mx-auto">
            Log every point as you watch match footage, then explore stats and player contribution scores to improve your game.
          </p>
          {authError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
              Something went wrong during sign in. Please try again.
            </p>
          )}
        </div>

        {/* CTA cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <Link
            href="/analyses"
            className="group flex flex-col gap-3 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
          >
            <BarChart2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Browse Analyses
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Explore completed match analyses. Filter by player or status to find the matches that matter.
              </p>
            </div>
            <span className="text-xs font-medium text-indigo-500 mt-1 group-hover:translate-x-0.5 transition-transform inline-block">
              View analyses →
            </span>
          </Link>

          <Link
            href="/session/new"
            className="group flex flex-col gap-3 bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-6 border border-indigo-600 dark:border-indigo-700 shadow-sm hover:shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
          >
            <PlusCircle className="w-6 h-6 text-white/80" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-white">
                Start New Analysis
              </p>
              <p className="text-sm text-indigo-200 mt-1">
                Link a YouTube match, assign players, and start logging events in real time as you watch.
              </p>
            </div>
            <span className="text-xs font-medium text-indigo-200 mt-1 group-hover:translate-x-0.5 transition-transform inline-block">
              Create session →
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}