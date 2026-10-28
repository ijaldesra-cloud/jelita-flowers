import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Wallet, PackageCheck, Clock, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, dateID } from '../../lib/format'
import { STATUS_LABEL, STATUS_COLOR } from '../../lib/status'
import type { Order } from '../../types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, verify: 0, omzet: 0 })

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => {
        const os = (data as Order[]) ?? []
        setOrders(os)
        const done = os.filter((o) => o.status === 'diproses' || o.status === 'dikirim' || o.status === 'selesai')
        setStats({
          total: os.length,
          pending: os.filter((o) => o.status === 'pending').length,
          verify: os.filter((o) => o.status === 'menunggu_verifikasi').length,
          omzet: done.reduce((s, o) => s + Number(o.total), 0),
        })
      })
  }, [])

  const cards = [
    { label: 'Total Pesanan', value: String(stats.total), icon: ShoppingBag, cls: 'bg-brand-100 text-brand-700' },
    { label: 'Omzet Diproses+', value: rupiah(stats.omzet), icon: Wallet, cls: 'bg-emerald-100 text-emerald-700' },
    { label: 'Perlu Verifikasi', value: String(stats.verify), icon: Clock, cls: 'bg-sky-100 text-sky-700' },
    { label: 'Belum Bayar', value: String(stats.pending), icon: PackageCheck, cls: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Selamat bekerja! Pantau pesanan & notifikasi bukti transfer di sini 🌸</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4 p-5">
            <span className={`rounded-2xl p-3.5 ${c.cls}`}><c.icon className="h-6 w-6" /></span>
            <div>
              <div className="text-sm text-stone-500">{c.label}</div>
              <div className="font-display text-2xl font-bold text-stone-900">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-stone-900">Pesanan Terbaru</h2>
          <Link to="/admin/pesanan" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            Semua Pesanan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-stone-50">
          {orders.slice(0, 8).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5 text-sm">
              <span className="font-mono font-bold text-brand-700">{o.code}</span>
              <span className="text-stone-600">{o.customer_name}</span>
              <span className={`chip ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              <span className="ml-auto text-stone-400">{dateID(o.created_at)}</span>
              <b>{rupiah(o.total)}</b>
            </div>
          ))}
          {orders.length === 0 && <p className="p-8 text-center text-sm text-stone-400">Belum ada pesanan masuk 🌷</p>}
        </div>
      </div>
    </div>
  )
}
