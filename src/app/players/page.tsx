"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { usePlayers } from "@/lib/usePlayers";
import PlayerCreate from "@/app/components/PlayerCreate";
import Modal from "@/app/components/Modal";
import Toast from "@/app/components/Toast";
import Spinner from "@/app/components/Spinner";

export default function PlayersPage() {
  const { players, loading } = usePlayers();
  const [modalOpen, setModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = useCallback(() => {
    setModalOpen(false);
    setShowToast(true);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Players
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Player
        </button>
      </div>

      {/* Player list */}
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Spinner size="sm" />
          <span>Loading players...</span>
        </div>
      ) : players.length === 0 ? (
        <p className="text-zinc-400 text-sm">
          No players yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          {[...players]
            .sort((a, b) =>
              (a.nickname ?? a.player_name).localeCompare(b.nickname ?? b.player_name)
            )
            .map((player) => (
            <li
              key={player.player_id}
              className="px-4 py-3 flex items-center gap-3 bg-white dark:bg-zinc-900"
            >
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.nickname ?? player.player_name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300 font-semibold text-sm">
                  {(player.nickname ?? player.player_name).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {player.nickname ?? player.player_name}
                </p>
                {player.nickname && (
                  <p className="text-xs text-zinc-400">{player.player_name}</p>
                )}
              </div>
              <Link
  href={`/analyses?player=${player.player_id}`}
  className="ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 border border-indigo-200 dark:border-indigo-700 rounded-full px-3 py-1 transition-colors shrink-0"
>
  Explore Matches →
</Link>
            </li>
          ))}
        </ul>
      )}

      {/* Create player modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Player"
      >
        <PlayerCreate onSuccess={handleSuccess} />
      </Modal>

      {/* Success toast */}
      <Toast
        message="Player created successfully"
        show={showToast}
        onHide={() => setShowToast(false)}
      />
    </div>
  );
}