import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchSession } from "@/lib/queries/supabase";

export function useSession(sessionId: string | null) {
  // enabled: false means "don't fetch until sessionId exists"
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ""),
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId,
  });
}