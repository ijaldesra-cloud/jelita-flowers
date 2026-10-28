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

export function useRealtimeStaffNotifications(enabled: boolean) {
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState<Notification | null>(null)
  const [tick, setTick] = useState(0)
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem('jpf_sound') !== 'off')
  const soundOnRef = useRef(soundOn)
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 🔊Suara notifikasi 'ding-ding' — diputar 2× biar benar-benar kedengaran
  const playAlert = () => {
    if (!soundOnRef.current) return
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
        snd.onended = () => setTimeout(() => { snd.currentTime = 0; snd.play().catch(() => {}) }, 350)
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

  const toggleSound = () => {
    const next = !soundOnRef.current
    setSoundOn(next)
    localStorage.setItem('jpf_sound', next ? 'on' : 'off')
    if (next) soundOnRef.current = true
    if (next) {
      // putar sekali sebagai konfirmasi
      try {
        if (!audioRef.current) audioRef.current = new Audio('/sounds/notify.wav')
        const s = audioRef.current
        s.currentTime = 0
        s.volume = 1
        s.play().catch(() => {})
      } catch { /* noop */ }
    }
    return next
  }

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return { unread, latest, markAllRead, requestPermission, tick }
}

export const rekeningOfSettings = (s: Settings | null): Rekening[] => s?.rekening ?? []
