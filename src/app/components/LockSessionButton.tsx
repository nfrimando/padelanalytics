"use client";

import { Lock, LockOpen } from "lucide-react";
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
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        isLocked
          ? "text-amber-500 hover:text-amber-600"
          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      }`}
    >
      {isPending ? (
        <span className="text-xs">Saving...</span>
      ) : isLocked ? (
        <>
          <LockOpen className="w-3.5 h-3.5" strokeWidth={2} />
          Reopen
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5" strokeWidth={2} />
          Complete
        </>
      )}
    </button>
  );
}