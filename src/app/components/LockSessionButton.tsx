"use client";

import { useUpdateSession } from "@/lib/useUpdateSession";
import type { SessionStatus } from "@/lib/utils/types";

interface LockSessionButtonProps {
  sessionId: string;
  status: SessionStatus;
  isOwner: boolean;
}

export default function LockSessionButton({
  sessionId,
  status,
  isOwner,
}: LockSessionButtonProps) {
  const { mutate, isPending } = useUpdateSession(sessionId);

  if (!isOwner) return null;

  const isLocked = status === "completed";

  return (
    <button
      onClick={() => mutate({ status: isLocked ? "live" : "completed" })}
      disabled={isPending}
      className={`px-4 py-2 rounded font-semibold transition-colors duration-150 ${
        isLocked
          ? "bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer"
          : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {isPending
        ? "Saving..."
        : isLocked
          ? "🔓 Reopen Session"
          : "🔒 Mark as Complete"}
    </button>
  );
}