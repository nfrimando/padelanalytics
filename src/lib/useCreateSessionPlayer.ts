import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

interface CreateSessionPlayerParams {
  session_id: string;
  player_id: number;
  position: number;
}

export function useCreateSessionPlayer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createSessionPlayer({ session_id, player_id, position }: CreateSessionPlayerParams) {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('session_players')
      .insert([
        { session_id, player_id, position }
      ])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    return data;
  }

  return { createSessionPlayer, loading, error };
}
