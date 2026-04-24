"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  type?: "success" | "error";
}

export default function Toast({
  message,
  show,
  onHide,
  type = "success",
}: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
    </div>
  );
}
