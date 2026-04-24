"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const authRequired = searchParams.get("auth_required") === "true";
  const authError = searchParams.get("auth_error") === "true";

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 font-sans px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4 text-center">
          Padel Analytics
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 mb-8 text-center">
          Padel Analytics helps you analyze and review your padel matches using
          YouTube videos. Log every point, error, and highlight as you watch,
          then review detailed stats and event timelines to improve your game.
        </p>

        {authRequired && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            Please sign in using the button in the top right to continue.
          </p>
        )}
        {authError && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Something went wrong during sign in. Please try again.
          </p>
        )}
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
