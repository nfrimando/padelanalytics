import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSessionPlayers } from "@/lib/queries/supabase";

export function useSessionPlayers(sessionId: string | null) {
  const query = useQuery({
    queryKey: queryKeys.sessionPlayers(sessionId ?? ""),
    queryFn: () => fetchSessionPlayers(sessionId!),
    enabled: !!sessionId,
  });

  // We keep the same return shape as before so existing code doesn't break
  return {
    sessionPlayers: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}