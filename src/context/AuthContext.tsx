import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, StaffRole } from '../types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  role: StaffRole | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({
  profile: null,
  loading: true,
  isAdmin: false,
  role: null,
  signIn: async () => null,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id
      if (uid && mounted) await loadProfile(uid)
      if (mounted) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.id) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id
    if (uid) await loadProfile(uid)
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthCtx.Provider value={{
      profile,
      loading,
      isAdmin: profile?.role === 'admin' || profile?.role === 'owner',
      role: profile?.role ?? null,
      signIn,
      signOut,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}
