import { useState } from "react";
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function useCreatePlayer() {
  const [playerName, setPlayerName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!playerName.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("players").insert({
      player_name: playerName,
      nickname: nickname.trim() ? nickname : null,
      email: email.trim() ? email : null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setPlayerName("");
      setNickname("");
      setEmail("");
    }
  };

  return {
    playerName,
    setPlayerName,
    nickname,
    setNickname,
    email,
    setEmail,
    loading,
    error,
    success,
    handleSubmit,
  };
}
