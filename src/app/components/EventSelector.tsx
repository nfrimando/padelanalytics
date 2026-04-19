"use client";

interface EventSelectorProps {
  eventNames?: string[];
  value: string | null;
  onChange: (eventName: string) => void;
  className?: string;
}

export default function EventSelector({
  eventNames = ["serve", "return", "rally"],
  value,
  onChange,
  className = "",
}: EventSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {eventNames.map((name) => (
        <button
          key={name}
          onClick={() => onChange(name)}
          className={`px-3 py-1 rounded border font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-150 ${
            value === name
              ? "bg-green-700 text-white border-green-700 hover:bg-green-800"
              : "bg-white text-black border-gray-400 hover:bg-green-100"
          }`}
        >
          {name.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}
