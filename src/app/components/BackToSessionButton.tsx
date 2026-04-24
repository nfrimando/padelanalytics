import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

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
      className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow"
    >
      ← Back to Session
    </Link>
  );
}
