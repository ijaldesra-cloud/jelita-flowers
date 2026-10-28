import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, FolderTree, Newspaper, Settings, LogOut,
  Bell, Menu, X, TrendingUp, Loader2, Store,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeStaffNotifications } from '../../lib/hooks'
import { supabase } from '../../lib/supabase'
import { dateID } from '../../lib/format'
import type { Notification } from '../../types'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/produk', label: 'Produk', icon: Package },
  { to: '/admin/kategori', label: 'Kategori', icon: FolderTree },
  { to: '/admin/berita', label: 'Berita', icon: Newspaper },
  { to: '/admin/laporan', label: 'Laporan', icon: TrendingUp, ownerOnly: true },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, ownerOnly: true },
]

export default function AdminLayout() {
  const { profile, isAdmin, loading, signOut } = useAuth()
  const nav_ = useNavigate()
  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const { unread, latest, markAllRead, requestPermission } = useRealtimeStaffNotifications(Boolean(isAdmin))
  const [toast, setToast] = useState<Notification | null>(null)

  useEffect(() => {
    Notification.requestPermission?.()
    if (isAdmin) requestPermission()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifs((data as Notification[]) ?? []))
  }, [isAdmin])

  useEffect(() => {
    if (latest) {
      setNotifs((n) => [latest, ...n].slice(0, 20))
      setToast(latest)
      const t = setTimeout(() => setToast(null), 5000)
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setNotifs((data as Notification[]) ?? []))
      return () => clearTimeout(t)
    }
  }, [latest])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const openBell = async () => {
    setBellOpen(!bellOpen)
    if (!bellOpen) {
      await markAllRead()
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setNotifs((data as Notification[]) ?? []))
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <LinkSidebar to="/admin" onClick={() => setOpen(false)}>
        <img src="/logo.png" alt="Jelita" className="h-8 w-auto" />
      </LinkSidebar>
      <nav className="mt-8 flex-1 space-y-1 px-3">
        {nav.filter((n) => !n.ownerOnly || profile?.role === 'owner').map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-stone-600 hover:bg-white hover:text-brand-700'
              }`
            }
          >
            <n.icon className="h-4.5 w-4.5" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/50 p-4">
        <div className="mb-3 text-sm">
          <div className="font-bold text-stone-800">{profile?.full_name}</div>
          <span className="chip mt-1 bg-gold/20 capitalize text-forest">{profile?.role}</span>
        </div>
        <button onClick={async () => { await signOut(); nav_('/admin/login') }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[260px_1fr]">
      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen border-r border-stone-900/5 bg-brand-50/60 lg:block">{sidebar}</aside>

      {/* sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-brand-50 shadow-2xl animate-pop">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 glass flex h-16 items-center justify-between gap-3 border-b border-stone-900/5 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 hover:bg-brand-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-sm font-semibold text-stone-500 hover:text-brand-600 sm:flex">
              <Store className="h-4 w-4" /> Lihat Toko
            </a>
          </div>

          <div className="relative">
            <button onClick={openBell} className="relative rounded-full p-2.5 text-stone-600 transition hover:bg-brand-50" aria-label="Notifikasi">
              <Bell className={`h-5 w-5 ${latest ? 'animate-bounce' : ''}`} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-14 z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-900/10 animate-pop">
                <div className="border-b border-stone-100 px-4 py-3 font-bold text-stone-800">Notifikasi</div>
                <div className="max-h-96 divide-y divide-stone-50 overflow-y-auto">
                  {notifs.length === 0 && <p className="p-6 text-center text-sm text-stone-400">Belum ada notifikasi 🌷</p>}
                  {notifs.map((n) => (
                    <div key={n.id} className={`px-4 py-3 ${n.is_read ? '' : 'bg-brand-50/60'}`}>
                      <div className="text-sm font-bold text-stone-800">{n.title}</div>
                      <div className="mt-0.5 text-xs text-stone-500">{n.message}</div>
                      <div className="mt-1 text-[10px] text-stone-400">{dateID(n.created_at, true)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>

      {/* toast realtime */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-pop cursor-pointer rounded-2xl bg-forest p-4 pr-5 text-white shadow-2xl"
          onClick={() => setToast(null)}>
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <div className="text-sm font-bold">{toast.title}</div>
              <div className="mt-0.5 text-xs text-stone-300">{toast.message}</div>
            </div>
            <X className="h-4 w-4 shrink-0 cursor-pointer text-stone-400 hover:text-white" onClick={() => setToast(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

function LinkSidebar({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return <NavLink to={to} onClick={onClick} className="block px-6 pt-6">{children}</NavLink>
}
