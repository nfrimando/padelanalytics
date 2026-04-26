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
import { Lock } from "lucide-react";

interface EventLoggerProps {
  players: SessionPlayerOption[];
  selectedSet: number;
  selectedGame: number;
  selectedPlayer: number | null;
  selectedPointType: EventType | null;
  involvedPlayer: number | null;
  isLogging: boolean;
  locked?: boolean;
  compact?: boolean;
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
  compact,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-medium text-zinc-500 dark:text-zinc-400 ${compact ? "text-xs" : "text-xs"}`}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${compact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"}`}
        >−</button>
        <span className={`text-center font-bold text-zinc-900 dark:text-white ${compact ? "w-4 text-xs" : "w-5 text-sm"}`}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={`rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${compact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"}`}
        >+</button>
      </div>
    </div>
  );
}

const LOG_BUTTONS = [
  { label: "−15s", seconds: 15 },
  { label: "−10s", seconds: 10 },
  { label: "−5s", seconds: 5 },
];

export default function EventLogger({
  players,
  selectedSet,
  selectedGame,
  selectedPlayer,
  selectedPointType,
  involvedPlayer,
  isLogging,
  locked = false,
  compact = false,
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
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
        <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        This session is locked. You don't have permission to log events.
      </div>
    );
  }

  const gap = compact ? "gap-2" : "gap-3";
  const labelCls = "text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide";

  return (
    <div className={`flex flex-col ${gap}`}>

      {/* Row 1: Set + Game + divider */}
      <div className="flex items-center gap-3">
        <Stepper label="Set" value={selectedSet} min={1} max={5} onChange={onSetChange} compact={compact} />
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
        <Stepper label="Game" value={selectedGame} min={1} max={13} onChange={onGameChange} compact={compact} />
      </div>

      {/* Row 2: Player */}
      <div>
        <p className={`${labelCls} mb-1`}>Player</p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={selectedPlayer}
          onChange={onPlayerChange}
          compact={compact}
        />
      </div>

      {/* Row 3: Point Type */}
      <div>
        <p className={`${labelCls} mb-1`}>Point Type</p>
        <EventSelector
          eventNames={EVENT_TYPES.map((t) => EVENT_TYPE_LABELS[t])}
          value={selectedPointType ? EVENT_TYPE_LABELS[selectedPointType] : null}
          onChange={(val) => {
            const eventType = EVENT_TYPES.find((t) => EVENT_TYPE_LABELS[t] === val);
            if (eventType) onPointTypeChange(eventType);
          }}
          compact={compact}
        />
      </div>

      {/* Row 4: Involved Player */}
      <div>
        <p className={`${labelCls} mb-1`}>Involved Player</p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={involvedPlayer}
          onChange={onInvolvedPlayerChange}
          disabledPositions={disabledPositions}
          compact={compact}
        />
      </div>

      {/* Row 5: Log buttons */}
      <div className="flex flex-col gap-1">
        <p className={labelCls}>Log Event</p>
        <div className="flex gap-1.5">
          {LOG_BUTTONS.map(({ label, seconds }) => (
            <button
              key={label}
              onClick={() => seconds === 0 ? onLogNow() : onLogSecondsAgo(seconds)}
              disabled={!isLogEnabled || isLogging}
              className={`flex-1 font-semibold rounded-xl transition-colors duration-150 ${
                compact ? "py-1.5 text-xs" : "py-2 text-sm"
              } ${
                isLogEnabled && !isLogging
                  ? seconds !== 0
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50"
              }`}
            >
              {isLogging && seconds === 0 ? "..." : label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}