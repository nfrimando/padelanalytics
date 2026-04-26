import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchSessionAccess,
  grantSessionAccess,
  revokeSessionAccess,
  fetchUserEditAccess,
} from "@/lib/queries/supabase";
import { useAuth } from "@/lib/useAuth";

export function useSessionAccess(sessionId: string) {
  const queryClient = useQueryClient();

  const { data: grants = [], isLoading } = useQuery({
    queryKey: queryKeys.sessionAccess(sessionId),
    queryFn: () => fetchSessionAccess(sessionId),
    enabled: !!sessionId,
  });

  const grantMutation = useMutation({
    mutationFn: ({ email, accessLevel }: { email: string; accessLevel: "view" | "edit" }) =>
      grantSessionAccess(sessionId, email, accessLevel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessionAccess(sessionId) }),
  });

  const revokeMutation = useMutation({
    mutationFn: (accessId: string) => revokeSessionAccess(accessId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessionAccess(sessionId) }),
  });

  return {
    grants,
    isLoading,
    grant: grantMutation.mutateAsync,
    revoke: revokeMutation.mutate,
    granting: grantMutation.isPending,
    revoking: revokeMutation.isPending,
    grantError: grantMutation.error?.message ?? null,
  };
}

export function useCanEdit(sessionId: string, ownerId: string | null | undefined, editMode: string | null | undefined) {
  const { user } = useAuth();
  const isOwner = !!user && user.id === ownerId;

  const { data: hasInvite = false } = useQuery({
    queryKey: ["canEdit", sessionId, user?.id],
    queryFn: () => fetchUserEditAccess(sessionId, user!.id),
    enabled: !!user && !isOwner && !!sessionId && editMode !== "public_edit",
  });

  const canEdit =
    editMode === "public_edit" ||
    isOwner ||
    hasInvite;

  return { isOwner, hasInvite, canEdit };
}