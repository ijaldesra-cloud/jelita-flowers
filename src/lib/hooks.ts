import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Notification, Rekening, Settings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => setSettings((data as Settings) ?? null))
  }, [])
  return settings
}

const SOUND_KEY = 'jpf_sound'
const SOUND_EVENT = 'jpf-sound'

/** Preferensi suara notifikasi (default: aktif) */
export const isSoundOn = () => {
  try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true }
}

/** Simpan preferensi + beri tahu semua komponen yang sedang tampil */
export const setSoundPref = (on: boolean) => {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off') } catch { /* noop */ }
  window.dispatchEvent(new CustomEvent<boolean>(SOUND_EVENT, { detail: on }))
}

/** Tombol on/off suara yang tersinkron antar halaman */
export function useSoundPref() {
  const [soundOn, setSoundOn] = useState(isSoundOn)
  useEffect(() => {
    const onChange = (e: Event) => setSoundOn(Boolean((e as CustomEvent<boolean>).detail))
    window.addEventListener(SOUND_EVENT, onChange)
    return () => window.removeEventListener(SOUND_EVENT, onChange)
  }, [])
  const toggleSound = () => {
    const next = !isSoundOn()
    setSoundPref(next)
    return next
  }
  return { soundOn, toggleSound }
}

export function useRealtimeStaffNotifications(enabled: boolean) {
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState<Notification | null>(null)
  const [tick, setTick] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const repeatRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Matikan suara → hentikan audio yang sedang berbunyi
  useEffect(() => {
    const onChange = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) return
      if (repeatRef.current) clearTimeout(repeatRef.current)
      const snd = audioRef.current
      if (snd) { snd.onended = null; snd.pause(); snd.currentTime = 0 }
    }
    window.addEventListener(SOUND_EVENT, onChange)
    return () => window.removeEventListener(SOUND_EVENT, onChange)
  }, [])

  // 🔊Suara notifikasi 'ding-ding' — diputar 2× biar benar-benar kedengaran
  const playAlert = () => {
    if (!isSoundOn()) return
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notify.wav')
        audioRef.current.volume = 1
        audioRef.current.preload = 'auto'
      }
      const snd = audioRef.current
      snd.currentTime = 0
      const p = snd.play()
      if (p) p.then(() => {
        snd.onended = () => {
          if (!isSoundOn()) return
          repeatRef.current = setTimeout(() => {
            if (!isSoundOn()) return
            snd.currentTime = 0
            snd.play().catch(() => {})
          }, 350)
        }
      }).catch(() => {})
    } catch { /* autoplay diblokir sebelum interaksi user */ }
  }

  useEffect(() => {
    if (!enabled) return
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      setUnread(count ?? 0)

      channel = supabase
        .channel('staff-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const n = payload.new as Notification
            setLatest(n)
            setUnread((u) => u + 1)
            setTick((t) => t + 1)
            playAlert()
            if ('Notification' in window && Notification.permission === 'granted') {
              try { new Notification(n.title, { body: n.message, icon: '/icons/icon-192.png' }) } catch { /* noop */ }
            }
          })
        .subscribe()
    }
    setup()
    return () => { channel?.unsubscribe() }
  }, [enabled])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setUnread(0)
    setTick((t) => t + 1)
  }

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return { unread, latest, markAllRead, requestPermission, tick }
}

export const rekeningOfSettings = (s: Settings | null): Rekening[] => s?.rekening ?? []
