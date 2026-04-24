"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
