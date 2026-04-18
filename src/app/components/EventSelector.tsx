"use client";

import React from "react";

interface EventSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  eventTypes: string[];
  className?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export default function EventSelector({
  value,
  onChange,
  eventTypes,
  className = "",
  onValidityChange,
}: EventSelectorProps) {
  const isWinner =
    value === "winner" ||
    value === "winner_pure" ||
    value === "winner_assisted" ||
    value === "winner_fed";
  const isValidSelection =
    value === "winner_assisted" ||
    value === "winner_fed" ||
    value === "winner_pure";
  // Notify parent of validity changes
  React.useEffect(() => {
    if (onValidityChange) onValidityChange(isValidSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSelection]);
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`px-3 py-1 rounded border font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-150 ${
              value === type || (isWinner && type === "winner")
                ? "bg-green-700 text-white border-green-700 hover:bg-green-800"
                : "bg-white text-black border-gray-400 hover:bg-green-100"
            }`}
          >
            {type
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </button>
        ))}
      </div>
      {/* Subset for winner */}
      {isWinner && (
        <div className="flex flex-wrap gap-2 mt-2 ml-2">
          <button
            onClick={() => onChange("winner_assisted")}
            className={`px-2 py-1 rounded border font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 ${
              value === "winner_assisted"
                ? "bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
                : "bg-white text-black border-gray-400 hover:bg-blue-100"
            }`}
          >
            Assisted
          </button>
          <button
            onClick={() => onChange("winner_fed")}
            className={`px-2 py-1 rounded border font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 ${
              value === "winner_fed"
                ? "bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
                : "bg-white text-black border-gray-400 hover:bg-blue-100"
            }`}
          >
            Fed
          </button>
          <button
            onClick={() => onChange("winner_pure")}
            className={`px-2 py-1 rounded border font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 ${
              value === "winner_pure"
                ? "bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
                : "bg-white text-black border-gray-400 hover:bg-blue-100"
            }`}
          >
            Pure
          </button>
        </div>
      )}
      <div className="mt-2 text-sm text-gray-600">
        {value ? <span>Hello World</span> : <span>No point type selected</span>}
        {/* For demonstration: show isValidSelection */}
        {/* <span>isValidSelection: {isValidSelection ? 'true' : 'false'}</span> */}
      </div>
    </div>
  );
}
