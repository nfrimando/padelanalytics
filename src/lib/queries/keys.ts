export const queryKeys = {
  session: (id: string) => ["session", id] as const,
  sessionPlayers: (sessionId: string) => ["sessionPlayers", sessionId] as const,
  sessionEvents: (sessionId: string) => ["sessionEvents", sessionId] as const,
  players: () => ["players"] as const,
};