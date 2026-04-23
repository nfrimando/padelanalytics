export const queryKeys = {
  session: (id: string) => ["session", id] as const,
  sessionPlayers: (sessionId: string) => ["sessionPlayers", sessionId] as const,
  sessionEvents: (sessionId: string) => ["sessionEvents", sessionId] as const,
  players: () => ["players"] as const,

// Analytics — scoped under "analytics" so they're easy to invalidate together
  matchAggregates: (sessionId: string) => ["analytics", "matchAggregates", sessionId] as const,
  matchPlayerEventAggregates: (sessionId: string) => ["analytics", "matchPlayerEventAggregates", sessionId] as const,
  matchSetsGamesTeamsAggregates: (sessionId: string) => ["analytics", "matchSetGamesTeamAggregates", sessionId] as const,
};