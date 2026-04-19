import React from "react";

interface SessionPlayerSelectorProps {
  players: Array<{
    id: number;
    label: string;
    position: number;
  }>;
  selectedPlayer: number | null;
  onChange: (id: number) => void;
  disabledPositions?: number[];
  className?: string;
}

export default function SessionPlayerSelector({
  players,
  selectedPlayer,
  onChange,
  disabledPositions = [],
  className = "",
}: SessionPlayerSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {players.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-3 py-1 rounded border font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 ${
            selectedPlayer === p.id
              ? "bg-indigo-700 text-white border-indigo-700 hover:bg-indigo-800"
              : "bg-white text-black border-gray-400 hover:bg-indigo-100"
          } ${disabledPositions.includes(p.position) ? "opacity-50 cursor-not-allowed" : ""}`}
          title={`Position ${p.position}`}
          disabled={disabledPositions.includes(p.position)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
