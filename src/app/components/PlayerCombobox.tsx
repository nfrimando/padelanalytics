"use client";

import { useState, useRef, useEffect } from "react";
import type { Player } from "@/lib/utils/types";

interface PlayerComboboxProps {
  players: Player[];
  value: number | null;
  onChange: (playerId: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

function getDisplayName(player: Player) {
  if (player.nickname && player.player_name) {
    return `${player.nickname} (${player.player_name})`;
  }
  return player.nickname || player.player_name || `Player ${player.player_id}`;
}

function matchesSearch(player: Player, query: string) {
  const q = query.toLowerCase();
  return (
    player.player_name?.toLowerCase().includes(q) ||
    player.nickname?.toLowerCase().includes(q)
  );
}

export default function PlayerCombobox({
  players,
  value,
  onChange,
  placeholder = "Search player...",
  disabled = false,
}: PlayerComboboxProps) {
  const selected = players.find((p) => p.player_id === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? players.filter((p) => matchesSearch(p, query))
    : players;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(player: Player) {
    onChange(player.player_id);
    setOpen(false);
    setQuery("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function handleFocus() {
    if (!disabled) setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center border rounded px-2 transition-colors duration-150 ${
          disabled
            ? "bg-gray-200 border-gray-300 cursor-not-allowed"
            : "bg-white border-black cursor-text hover:bg-gray-50"
        }`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {!open && selected ? (
          <span className="py-2 text-sm flex-1 truncate text-black">
            {getDisplayName(selected)}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 py-2 text-sm bg-transparent outline-none text-black placeholder-gray-400 disabled:cursor-not-allowed"
            placeholder={open ? "Search..." : placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={disabled}
          />
        )}
        <button
          type="button"
          tabIndex={-1}
          className="ml-1 text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setOpen((v) => !v);
              if (!open) inputRef.current?.focus();
            }
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && !disabled && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No players found</li>
          ) : (
            filtered.map((player) => (
              <li
                key={player.player_id}
                onMouseDown={() => handleSelect(player)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 ${
                  player.player_id === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-zinc-800"
                }`}
              >
                {player.nickname && (
                  <span className="font-medium">{player.nickname}</span>
                )}
                {player.nickname && player.player_name && (
                  <span className="text-zinc-400 ml-1 text-xs">{player.player_name}</span>
                )}
                {!player.nickname && (
                  <span>{player.player_name}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}