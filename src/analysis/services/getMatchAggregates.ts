import { SupabaseClient } from "@supabase/supabase-js";

export async function getMatchAggregates(
  supabase: SupabaseClient,
  session_id: string
) {
  const { data, error } = await supabase.rpc("get_match_aggregates", {
    session_id,
  });

  if (error) throw error;

  return data?.[0];
}