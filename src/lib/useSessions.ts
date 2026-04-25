import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessions } from "@/lib/queries/supabase";
import type { SessionStatus, Session } from "@/lib/utils/types";

export interface SessionFilters {
  status?: SessionStatus | SessionStatus[];
  owner_id?: string;
  player_id?: number;
}

export type SessionWithOwner = Session & { owner_email: string | null; owner_nickname: string | null };

export function useSessions(filters: SessionFilters = { status: "completed" }) {
  const fetchFilters = {
    ...filters,
    player_ids: filters.player_id !== undefined ? [filters.player_id] : undefined,
    player_id: undefined,
  };

  const query = useQuery({
    queryKey: queryKeys.sessions(filters),
    queryFn: () => fetchSessions(fetchFilters),
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}