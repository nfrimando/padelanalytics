"use client";

import { useState } from "react";
import type { Event, EventType, SessionPlayerOption } from "@/lib/utils/types";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  formatTimestamp,
  getPlayerLabel,
} from "@/lib/utils/session";
import { useUpdateEvent } from "@/lib/useUpdateEvent";
import { useDeleteEvent } from "@/lib/useDeleteEvent";

interface EventsTableProps {
  sessionId: string;
  events: Event[];
  players: SessionPlayerOption[];
  onSeek: (seconds: number) => void;
}

function EditRow({
  event,
  players,
  onSave,
  onCancel,
  saving,
}: {
  event: Event;
  players: SessionPlayerOption[];
  onSave: (fields: Partial<Event>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [fields, setFields] = useState<Partial<Event>>({
    player_id: event.player_id,
    event_type: event.event_type,
    target_player_id: event.target_player_id,
    set_number: event.set_number,
    game_number: event.game_number,
    timestamp_seconds: event.timestamp_seconds,
  });

  const inputCls = "border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full";

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Time (s)</label>
        <input
          type="number"
          className={inputCls}
          value={fields.timestamp_seconds}
          onChange={(e) => setFields((f) => ({ ...f, timestamp_seconds: Number(e.target.value) }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Set</label>
        <select className={inputCls} value={fields.set_number} onChange={(e) => setFields((f) => ({ ...f, set_number: Number(e.target.value) }))}>
          {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Game</label>
        <select className={inputCls} value={fields.game_number} onChange={(e) => setFields((f) => ({ ...f, game_number: Number(e.target.value) }))}>
          {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Event Type</label>
        <select className={inputCls} value={fields.event_type} onChange={(e) => setFields((f) => ({ ...f, event_type: e.target.value as EventType }))}>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Player</label>
        <select className={inputCls} value={fields.player_id} onChange={(e) => setFields((f) => ({ ...f, player_id: Number(e.target.value) }))}>
          {players.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Involved</label>
        <select className={inputCls} value={fields.target_player_id ?? ""} onChange={(e) => setFields((f) => ({ ...f, target_player_id: e.target.value ? Number(e.target.value) : null }))}>
          <option value="">—</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      <div className="col-span-2 flex gap-2 mt-1">
        <button
          onClick={() => onSave(fields)}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function EventsTable({
  sessionId,
  events,
  players,
  onSeek,
}: EventsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { updateEvent, loading: updatingEvent } = useUpdateEvent(sessionId);
  const { deleteEvent, loading: deletingEvent } = useDeleteEvent(sessionId);

  const saveEdit = async (id: string, fields: Partial<Event>) => {
    await updateEvent({ id, ...fields });
    setEditingId(null);
  };

  const reversed = [...events].reverse();

  return (
    <div className="mt-4">
      <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        Points ({events.length})
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-6">No events logged yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
          {reversed.map((e) => {
            if (editingId === e.id) {
              return (
                <EditRow
                  key={e.id}
                  event={e}
                  players={players}
                  saving={updatingEvent}
                  onSave={(fields) => saveEdit(e.id, fields)}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div
                key={e.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors group"
              >
                {/* Timestamp */}
                <button
                  onClick={() => onSeek(e.timestamp_seconds)}
                  className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 shrink-0 w-10"
                >
                  {formatTimestamp(e.timestamp_seconds)}
                </button>

                {/* Set / Game badge */}
                <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                  S{e.set_number}G{e.game_number}
                </span>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {EVENT_TYPE_LABELS[e.event_type]}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {getPlayerLabel(e.player_id, players)}
                    {e.target_player_id && (
                      <> → {getPlayerLabel(e.target_player_id, players)}</>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditingId(e.id)}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(e.id)}
                    disabled={deletingEvent}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}