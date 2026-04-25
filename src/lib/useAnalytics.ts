import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchMatchAggregates,
  fetchMatchPlayerEventAggregates,
  fetchMatchSetsGamesTeamsAggregates,
  fetchSessionPlayersWithNames,
} from "@/lib/queries/supabase";

// Analytics data is read-only and doesn't change while you're viewing it,
// so we cache it longer than the default
// const ANALYTICS_STALE_TIME = 1000 * 60 * 10; // 10 minutes
const ANALYTICS_STALE_TIME = 1000 * 5; // 5 seconds

export function useMatchAggregates(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.matchAggregates(sessionId),
    queryFn: () => fetchMatchAggregates(sessionId),
    enabled: !!sessionId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}
export function useMatchPlayerEventAggregates(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.matchPlayerEventAggregates(sessionId),
    queryFn: () => fetchMatchPlayerEventAggregates(sessionId),
    enabled: !!sessionId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}
export function useMatchSetsGamesTeamsAggregates(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.matchSetsGamesTeamsAggregates(sessionId),
    queryFn: () => fetchMatchSetsGamesTeamsAggregates(sessionId),
    enabled: !!sessionId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useSessionPlayersWithNames(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionPlayersWithNames(sessionId),
    queryFn: () => fetchSessionPlayersWithNames(sessionId),
    enabled: !!sessionId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}