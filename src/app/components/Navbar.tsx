"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/useAuth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyses", label: "Analyses" },
  { href: "/session/new", label: "New Session" },
  { href: "/players", label: "Players" },
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    router.push("/");
    supabase.auth.signOut();
  };

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <nav className="w-full border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center justify-between">
      {/* Left — logo + nav links */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-lg font-bold text-indigo-700 dark:text-indigo-300 hover:opacity-80 transition-opacity shrink-0"
        >
          Padel Analytics
        </Link>

        <div className="hidden sm:flex items-center gap-4">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right — auth */}
      {!loading && (
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden md:block truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="text-sm font-medium px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </nav>
  );
}