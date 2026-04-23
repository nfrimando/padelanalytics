"use client";

import { useState } from "react";
import type { Event, EventType, SessionPlayerOption } from "@/lib/utils/types";
import {
  EVENT_TYPES,
  formatTimestamp,
  getPlayerLabel,
} from "@/lib/utils/session";
import { useUpdateEvent } from "@/lib/useUpdateEvent";
import { useDeleteEvent } from "@/lib/useDeleteEvent";

interface EventsTableProps {
  events: Event[];
  players: SessionPlayerOption[];
  onSeek: (seconds: number) => void;
  onEventUpdated: (updated: Event) => void;
  onEventDeleted: (id: string) => void;
}

export default function EventsTable({
  events,
  players,
  onSeek,
  onEventUpdated,
  onEventDeleted,
}: EventsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Event>>({});
  const { updateEvent, loading: updatingEvent } = useUpdateEvent();
  const { deleteEvent, loading: deletingEvent } = useDeleteEvent();

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setEditFields({
      player_id: event.player_id,
      event_type: event.event_type,
      target_player_id: event.target_player_id,
      set_number: event.set_number,
      game_number: event.game_number,
      timestamp_seconds: event.timestamp_seconds,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };

  const saveEdit = async (id: string) => {
    const updated = await updateEvent({ id, ...editFields });
    if (updated) {
      onEventUpdated(updated);
      setEditingId(null);
      setEditFields({});
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteEvent(id);
    if (success) onEventDeleted(id);
  };

  return (
    <div className="mt-6">
      <h2 className="font-bold mb-2">Points Table</h2>
      <table className="w-full text-sm text-center">
        <thead>
          <tr>
            <th>Time</th>
            <th>Set</th>
            <th>Game</th>
            <th>Type</th>
            <th>Player</th>
            <th>Involved Player</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {[...events].reverse().map((e) => {
            const isEditing = editingId === e.id;
            return (
              <tr key={e.id} className="border-t">
                {/* Timestamp */}
                <td
                  onClick={() => onSeek(e.timestamp_seconds)}
                  className="text-blue-700 underline cursor-pointer hover:text-blue-900 font-semibold"
                >
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-16 border rounded px-1"
                      value={editFields.timestamp_seconds}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          timestamp_seconds: Number(ev.target.value),
                        }))
                      }
                    />
                  ) : (
                    formatTimestamp(e.timestamp_seconds)
                  )}
                </td>

                {/* Set */}
                <td>
                  {isEditing ? (
                    <select
                      value={editFields.set_number}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          set_number: Number(ev.target.value),
                        }))
                      }
                      className="border rounded px-1"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (e.set_number ?? "—")
                  )}
                </td>

                {/* Game */}
                <td>
                  {isEditing ? (
                    <select
                      value={editFields.game_number}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          game_number: Number(ev.target.value),
                        }))
                      }
                      className="border rounded px-1"
                    >
                      {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (e.game_number ?? "—")
                  )}
                </td>

                {/* Event Type */}
                <td>
                  {isEditing ? (
                    <select
                      value={editFields.event_type}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          event_type: ev.target.value as EventType,
                        }))
                      }
                      className="border rounded px-1"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    e.event_type
                  )}
                </td>

                {/* Player */}
                <td>
                  {isEditing ? (
                    <select
                      value={editFields.player_id}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          player_id: Number(ev.target.value),
                        }))
                      }
                      className="border rounded px-1"
                    >
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    getPlayerLabel(e.player_id, players)
                  )}
                </td>

                {/* Involved Player */}
                <td>
                  {isEditing ? (
                    <select
                      value={editFields.target_player_id ?? ""}
                      onChange={(ev) =>
                        setEditFields((f) => ({
                          ...f,
                          target_player_id: ev.target.value
                            ? Number(ev.target.value)
                            : null,
                        }))
                      }
                      className="border rounded px-1"
                    >
                      <option value="">—</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  ) : e.target_player_id ? (
                    getPlayerLabel(e.target_player_id, players)
                  ) : (
                    "—"
                  )}
                </td>

                {/* Actions */}
                <td className="space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(e.id)}
                        className="text-green-600"
                        disabled={updatingEvent}
                      >
                        {updatingEvent ? "Saving..." : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="text-gray-600">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(e)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-600"
                        disabled={deletingEvent}
                      >
                        {deletingEvent ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
