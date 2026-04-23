import Link from "next/link";

export default function BackToSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  return (
    <Link
      href={`/session/${sessionId}`}
      className="fixed top-6 right-6 z-50 inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow"
      style={{ pointerEvents: "auto" }}
    >
      ← Back to Session
    </Link>
  );
}
