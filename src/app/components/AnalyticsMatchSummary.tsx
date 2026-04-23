import React from "react";

interface AnalyticsMatchSummaryProps {
  num_sets?: number;
  num_games?: number;
  num_points?: number;
}

export default function AnalyticsMatchSummary({
  num_sets = 0,
  num_games = 0,
  num_points = 0,
}: AnalyticsMatchSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 max-w-md mx-auto border border-gray-100 dark:border-gray-800 mb-10">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Match Summary
      </h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Sets</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {num_sets}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Games</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {num_games}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Points</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {num_points}
          </span>
        </div>
      </div>
    </div>
  );
}
