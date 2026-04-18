import React from "react";
import { useCreatePlayer } from "@/lib/useCreatePlayer";

export default function PlayerCreate() {
  const {
    playerName,
    setPlayerName,
    nickname,
    setNickname,
    email,
    setEmail,
    loading,
    error,
    success,
    handleSubmit,
  } = useCreatePlayer();

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow p-8 flex flex-col gap-4"
    >
      <h2 className="text-2xl font-bold mb-2 text-center">Create Player</h2>
      <label className="font-semibold">Full Name</label>
      <input
        className="border p-2 rounded w-full"
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Player Name"
        disabled={loading}
      />
      <label className="font-semibold">
        Nickname <span className="text-zinc-400 font-normal">(optional)</span>
      </label>
      <input
        className="border p-2 rounded w-full"
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname (optional)"
        disabled={loading}
      />
      <label className="font-semibold">
        Email <span className="text-zinc-400 font-normal">(optional)</span>
      </label>
      <input
        className="border p-2 rounded w-full"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        disabled={loading}
      />
      <button
        type="submit"
        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded font-bold disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Player"}
      </button>
      {error && <div className="text-red-600 text-center mt-2">{error}</div>}
      {success && (
        <div className="text-green-600 text-center mt-2">Player created!</div>
      )}
    </form>
  );
}
