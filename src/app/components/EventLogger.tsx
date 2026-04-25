"use client";

import SessionPlayerSelector from "@/app/components/SessionPlayerSelector";
import EventSelector from "@/app/components/EventSelector";
import type {
  EventType,
  SessionPlayerOption,
  PlayerPosition,
} from "@/lib/utils/types";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  getDisabledPositionsForEvent,
} from "@/lib/utils/session";

interface EventLoggerProps {
  players: SessionPlayerOption[];
  selectedSet: number;
  selectedGame: number;
  selectedPlayer: number | null;
  selectedPointType: EventType | null;
  involvedPlayer: number | null;
  isLogging: boolean;
  locked?: boolean;
  onSetChange: (set: number) => void;
  onGameChange: (game: number) => void;
  onPlayerChange: (id: number) => void;
  onPointTypeChange: (type: EventType) => void;
  onInvolvedPlayerChange: (id: number) => void;
  onLogNow: () => void;
  onLogSecondsAgo: (seconds: number) => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
        >
          −
        </button>
        <span className="w-6 text-center font-bold text-zinc-900 dark:text-white text-lg">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function EventLogger({
  players,
  selectedSet,
  selectedGame,
  selectedPlayer,
  selectedPointType,
  involvedPlayer,
  isLogging,
  locked = false,
  onSetChange,
  onGameChange,
  onPlayerChange,
  onPointTypeChange,
  onInvolvedPlayerChange,
  onLogNow,
  onLogSecondsAgo,
}: EventLoggerProps) {
  const selectedPlayerObj = players.find((p) => p.id === selectedPlayer);

  const disabledPositions: PlayerPosition[] =
    selectedPlayer && selectedPointType && selectedPlayerObj
      ? getDisabledPositionsForEvent(selectedPointType, selectedPlayerObj.position)
      : players.map((p) => p.position);

  const allPositionsDisabled = players.every((p) =>
    disabledPositions.includes(p.position)
  );

  const isLogEnabled =
    !!selectedPlayer &&
    !!selectedPointType &&
    (allPositionsDisabled ||
      (!!involvedPlayer &&
        !disabledPositions.includes(
          players.find((p) => p.id === involvedPlayer)?.position ??
            (0 as PlayerPosition)
        )));

  if (locked) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-500 dark:text-zinc-400">
        🔒 This session is completed. Reopen it to log new events.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Set & Game */}
      <div className="flex items-center gap-6 px-1">
        <Stepper label="Set" value={selectedSet} min={1} max={5} onChange={onSetChange} />
        <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700" />
        <Stepper label="Game" value={selectedGame} min={1} max={13} onChange={onGameChange} />
      </div>

      {/* Player */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
          Player
        </p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={selectedPlayer}
          onChange={onPlayerChange}
        />
      </div>

      {/* Point Type */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
          Point Type
        </p>
        <EventSelector
          eventNames={EVENT_TYPES.map((t) => EVENT_TYPE_LABELS[t])}
          value={selectedPointType ? EVENT_TYPE_LABELS[selectedPointType] : null}
          onChange={(val) => {
            const eventType = EVENT_TYPES.find((t) => EVENT_TYPE_LABELS[t] === val);
            if (eventType) onPointTypeChange(eventType);
          }}
        />
      </div>

      {/* Involved Player */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
          Involved Player
        </p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={involvedPlayer}
          onChange={onInvolvedPlayerChange}
          disabledPositions={disabledPositions}
        />
      </div>

      {/* Log Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Log Event
        </p>
        <div className="flex gap-2">
        {[
          { label: "−15s", seconds: 15 },
          { label: "−10s", seconds: 10 },
          { label: "Now", seconds: 0 },
        ].map(({ label, seconds }) => (
          <button
            key={label}
            onClick={() => (seconds === 0 ? onLogNow() : onLogSecondsAgo(seconds))}
            disabled={!isLogEnabled || isLogging}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors duration-150 ${
              isLogEnabled && !isLogging
                ? seconds === 10 || seconds === 15
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50"
            }`}
          >
            {isLogging ? "..." : label}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}