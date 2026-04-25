import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

async function createPlayerMutation(params: {
  player_name: string
  nickname: string | null
  email: string | null
  image_url: string | null
  created_by: string | null
}) {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('players')
    .insert(params)
    .select()
    .single()
  if (error) throw error
  return data
}

export function useCreatePlayer(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const [playerName, setPlayerName] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const mutation = useMutation({
    mutationFn: createPlayerMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players() })
      setPlayerName('')
      setNickname('')
      setEmail('')
      setImageUrl('')
      onSuccess?.()
    },
  })

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!playerName.trim()) return

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    mutation.mutate({
      player_name: playerName.trim(),
      nickname: nickname.trim() || null,
      email: email.trim() || null,
      image_url: imageUrl.trim() || null,
      created_by: user?.email ?? null,
    })
  }

  return {
    playerName,
    setPlayerName,
    nickname,
    setNickname,
    email,
    setEmail,
    imageUrl,
    setImageUrl,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    handleSubmit,
  }
}