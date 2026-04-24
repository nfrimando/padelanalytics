"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Suspense } from "react";
import Spinner from "@/app/components/Spinner";

function LoginRedirect() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }, [next]);

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500">
        <Spinner size="md" />
        <span>Redirecting to Google sign in...</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginRedirect />
    </Suspense>
  );
}
