import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { deleteEventMutation } from "@/lib/queries/supabase";

export function useDeleteEvent(sessionId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteEventMutation,
    onSuccess: (deletedId) => {
      // Remove the deleted event from the cache
      queryClient.setQueryData(
        queryKeys.sessionEvents(sessionId),
        (old: any[] = []) => old.filter((e) => e.id !== deletedId)
      );
    },
  });

  return {
    deleteEvent: async (id: string) => {
      if (!confirm("Delete this event?")) return false;
      await mutation.mutateAsync(id);
      return true;
    },
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}