"use client";

import { useCreatePlayer } from "@/lib/useCreatePlayer";

interface PlayerCreateProps {
  onSuccess: () => void;
}

export default function PlayerCreate({ onSuccess }: PlayerCreateProps) {
  const {
    playerName,
    setPlayerName,
    nickname,
    setNickname,
    email,
    setEmail,
    loading,
    error,
    handleSubmit,
  } = useCreatePlayer(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="e.g. Nigel Chingago"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Nickname <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Nignig"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Email <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. nigel@email.com"
          disabled={loading}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !playerName.trim()}
        className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
      >
        {loading ? "Creating..." : "Create Player"}
      </button>
    </form>
  );
}
