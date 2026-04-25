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
      ? getDisabledPositionsForEvent(
          selectedPointType,
          selectedPlayerObj.position,
        )
      : players.map((p) => p.position);

  const allPositionsDisabled = players.every((p) =>
    disabledPositions.includes(p.position),
  );

  const isLogEnabled =
    !!selectedPlayer &&
    !!selectedPointType &&
    (allPositionsDisabled ||
      (!!involvedPlayer &&
        !disabledPositions.includes(
          players.find((p) => p.id === involvedPlayer)?.position ??
            (0 as PlayerPosition),
        )));

  return (
    <div>
      <h2 className="font-bold mb-4 mt-8">Log Event</h2>

      {locked ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 dark:text-zinc-400">
          🔒 This session is completed. Reopen it to log new events.
        </div>
      ) : (
      <>
      <div className="flex gap-4 mb-4">
        <div>
          <p className="font-semibold mb-2">Set</p>
          <select
            className="border rounded px-2 py-1"
            value={selectedSet}
            onChange={(e) => onSetChange(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="font-semibold mb-2">Game</p>
          <select
            className="border rounded px-2 py-1"
            value={selectedGame}
            onChange={(e) => onGameChange(Number(e.target.value))}
          >
            {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Player */}
      <div>
        <p className="font-semibold mb-2">Player</p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={selectedPlayer}
          onChange={onPlayerChange}
        />
      </div>

      {/* Point Type */}
      <div className="mt-4">
        <p className="font-semibold mb-2">Point Type</p>
        <EventSelector
          eventNames={EVENT_TYPES.map((t) => EVENT_TYPE_LABELS[t])}
          value={
            selectedPointType ? EVENT_TYPE_LABELS[selectedPointType] : null
          }
          onChange={(val) => {
            const eventType = EVENT_TYPES.find(
              (t) => EVENT_TYPE_LABELS[t] === val,
            );
            if (eventType) onPointTypeChange(eventType);
          }}
        />
      </div>

      {/* Involved Player */}
      <div className="mt-4">
        <p className="font-semibold mb-2">Involved Player</p>
        <SessionPlayerSelector
          players={players}
          selectedPlayer={involvedPlayer}
          onChange={onInvolvedPlayerChange}
          disabledPositions={disabledPositions}
        />
      </div>

      {/* Log Buttons */}
      <div className="flex gap-4 mt-6">
        {[
          { label: "Log Now", seconds: 0 },
          { label: "Log 10s ago", seconds: 10 },
          { label: "Log 15s ago", seconds: 15 },
        ].map(({ label, seconds }) => (
          <button
            key={label}
            onClick={() =>
              seconds === 0 ? onLogNow() : onLogSecondsAgo(seconds)
            }
            disabled={!isLogEnabled || isLogging}
            className={`px-4 py-2 rounded font-semibold transition-colors duration-150 ${
              isLogEnabled && !isLogging
                ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                : "bg-gray-300 text-gray-400 cursor-not-allowed opacity-60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}