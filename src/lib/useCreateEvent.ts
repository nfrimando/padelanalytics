import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { createEventMutation } from "@/lib/queries/supabase";
import { useAuth } from "@/lib/useAuth";

export function useCreateEvent(sessionId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: (params: Omit<Parameters<typeof createEventMutation>[0], "logged_by">) =>
      createEventMutation({ ...params, logged_by: user?.email ?? null }),
    onSuccess: (newEvent) => {
      queryClient.setQueryData(
        queryKeys.sessionEvents(sessionId),
        (old: any[] = []) => [...old, newEvent]
      );
    },
  });

  return {
    createEvent: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}