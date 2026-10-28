import { createClient } from '@supabase/supabase-js'

const url = (import.meta as any).env?.VITE_SUPABASE_URL || __SUPA_URL__ || ''
const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || __SUPA_KEY__ || ''

export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Kredensial belum ditemukan. Pastikan file .env memuat SUPABASE_URL dan SUPABASE_ANON_KEY (atau VITE_-prefixed).'
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  }
)
