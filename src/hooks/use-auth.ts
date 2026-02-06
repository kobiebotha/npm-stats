import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/db'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: error?.message ?? null,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
      return { error }
    }

    setState({
      user: data.user,
      session: data.session,
      loading: false,
      error: null,
    })

    return { data }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const allowedDomains = ['powersync.com', 'journeyapps.com']
    const emailDomain = email.split('@')[1]?.toLowerCase()
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      const errorMsg = 'Signups are restricted to @powersync.com and @journeyapps.com email addresses'
      setState((s) => ({ ...s, loading: false, error: errorMsg }))
      return { error: { message: errorMsg } }
    }

    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
      return { error }
    }

    setState({
      user: data.user,
      session: data.session,
      loading: false,
      error: null,
    })

    return { data }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, loading: true }))

    const { error } = await supabase.auth.signOut()

    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
      return { error }
    }

    setState({
      user: null,
      session: null,
      loading: false,
      error: null,
    })

    return {}
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!state.user,
  }
}
