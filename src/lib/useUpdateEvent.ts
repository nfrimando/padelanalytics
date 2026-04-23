import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { updateEventMutation } from "@/lib/queries/supabase";

export function useUpdateEvent(sessionId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateEventMutation,
    onSuccess: (updatedEvent) => {
      // Swap the old version of the event for the updated one in the cache
      queryClient.setQueryData(
        queryKeys.sessionEvents(sessionId),
        (old: any[] = []) =>
          old.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );
    },
  });

  return {
    updateEvent: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}