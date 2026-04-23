import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchPlayers } from "@/lib/queries/supabase";

export function usePlayers() {
  const query = useQuery({
    queryKey: queryKeys.players(),
    queryFn: fetchPlayers,
    // Players change rarely so we cache them longer than the default 5 mins
    staleTime: 1000 * 60 * 10,
  });

  return {
    players: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}