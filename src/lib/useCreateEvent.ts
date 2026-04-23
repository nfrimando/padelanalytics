import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { createEventMutation } from "@/lib/queries/supabase";

export function useCreateEvent(sessionId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEventMutation,
    onSuccess: (newEvent) => {
      // Instead of calling setEvents in the component,
      // we add the new event directly to the cache here.
      // Every component reading sessionEvents will update automatically.
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