import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { queryKeys } from "@/lib/queries/keys";
import type { Session } from "@/lib/utils/types";

type SessionUpdatableFields = Partial<
  Pick<Session, "status" | "title" | "youtube_url" | "youtube_video_id">
>;

export function useUpdateSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields: SessionUpdatableFields) => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("sessions")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session(sessionId), data);
    },
  });
}