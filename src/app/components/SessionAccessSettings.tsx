"use client";

import { useState } from "react";
import { useUpdateSession } from "@/lib/useUpdateSession";
import { useSessionAccess } from "@/lib/useSessionAccess";
import type { EditMode, Session } from "@/lib/utils/types";
import { Lock, Globe, Users, X, Plus } from "lucide-react";

interface SessionAccessSettingsProps {
  session: Session;
}

const MODES: { value: EditMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "owner_only",
    label: "Owner only",
    description: "Only you can log events",
    icon: <Lock className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    value: "invite_only",
    label: "Invite only",
    description: "Only people you invite can log events",
    icon: <Users className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    value: "public_edit",
    label: "Public edit",
    description: "Anyone signed in can log events",
    icon: <Globe className="w-4 h-4" strokeWidth={1.5} />,
  },
];

export default function SessionAccessSettings({ session }: SessionAccessSettingsProps) {
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const { mutate: updateSession, isPending: updatingMode } = useUpdateSession(session.id);
  const { grants, grant, revoke, granting, revoking, grantError } = useSessionAccess(session.id);

  const currentMode = session.edit_mode ?? "owner_only";

  async function handleGrant() {
    const email = emailInput.trim();
    if (!email) return;
    setInputError(null);
    try {
      await grant({ email, accessLevel: "edit" });
      setEmailInput("");
    } catch (e: any) {
      setInputError(e.message ?? "Failed to grant access");
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      >
        {open ? "▴ Access" : "▾ Access"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-4">

          {/* Edit mode selector */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Who can log events
            </p>
            <div className="flex flex-col gap-1">
              {MODES.map((mode) => {
                const isSelected = currentMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => updateSession({ edit_mode: mode.value })}
                    disabled={updatingMode}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className={isSelected ? "text-indigo-500" : "text-zinc-400"}>{mode.icon}</span>
                    <div>
                      <p className="text-xs font-semibold">{mode.label}</p>
                      <p className="text-[10px] text-zinc-400">{mode.description}</p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Invite list — only shown in invite_only mode */}
          {currentMode === "invite_only" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Invited users
              </p>

              {/* Existing grants */}
              {grants.length === 0 ? (
                <p className="text-xs text-zinc-400">No one invited yet.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {grants.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg"
                    >
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                        {g.email ?? g.user_id}
                      </span>
                      <button
                        onClick={() => revoke(g.id)}
                        disabled={revoking}
                        className="ml-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add by email */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setInputError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleGrant()}
                  placeholder="Invite by email..."
                  className="flex-1 text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleGrant}
                  disabled={granting || !emailInput.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
              {(inputError || grantError) && (
                <p className="text-xs text-red-500">{inputError ?? grantError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}