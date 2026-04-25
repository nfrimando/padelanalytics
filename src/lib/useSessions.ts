import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessions } from "@/lib/queries/supabase";
import type { SessionStatus } from "@/lib/utils/types";

export interface SessionFilters {
  status?: SessionStatus | SessionStatus[];
  owner_id?: string;
  player_id?: number;
}

export function useSessions(filters: SessionFilters = { status: "completed" }) {
  const query = useQuery({
    queryKey: queryKeys.sessions(filters),
    queryFn: () => fetchSessions(filters),
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}