"use client";

interface EventSelectorProps {
  eventNames?: string[];
  value: string | null;
  onChange: (eventName: string) => void;
  className?: string;
}

export default function EventSelector({
  eventNames = [],
  value,
  onChange,
  className = "",
}: EventSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {eventNames.map((name) => {
        const isSelected = value === name;
        return (
          <button
            key={name}
            onClick={() => onChange(name)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isSelected
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}