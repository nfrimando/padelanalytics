"use client";

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
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {players.map((p) => {
        const isSelected = selectedPlayer === p.id;
        const isDisabled = disabledPositions.includes(p.position);
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            disabled={isDisabled}
            title={`Position ${p.position}`}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isSelected
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : isDisabled
                ? "bg-zinc-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}