import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { ArrowLeft } from "lucide-react";

export default function BackToSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <Link
      href={`/session/${sessionId}`}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
      Session
    </Link>
  );
}