import { useEffect, useState } from 'react'
import { TrendingUp, Wallet, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah } from '../../lib/format'
import type { Order, OrderItem } from '../../types'

export default function AdminLaporan() {
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    supabase.from('orders').select('*').limit(1000).then(({ data }) => setOrders((data as Order[]) ?? []))
    supabase.from('order_items').select('*').limit(2000).then(({ data }) => setItems((data as OrderItem[]) ?? []))
  }, [])

  const valid = orders.filter((o) => ['diproses', 'dikirim', 'selesai'].includes(o.status))
  const omzet = valid.reduce((s, o) => s + Number(o.total), 0)

  const byMonth = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - idx))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const total = valid.filter((o) => o.created_at.startsWith(key)).reduce((s, o) => s + Number(o.total), 0)
    return { key, label: d.toLocaleDateString('id-ID', { month: 'short' }), total }
  })
  const maxM = Math.max(1, ...byMonth.map((m) => m.total))

  const best = Object.entries(
    items.reduce<Record<string, { name: string; qty: number; omz: number }>>((acc, it) => {
      const ord = orders.find((o) => o.id === it.order_id)
      if (!ord || !['diproses', 'dikirim', 'selesai'].includes(ord.status)) return acc
      acc[it.product_name] = acc[it.product_name] || { name: it.product_name, qty: 0, omz: 0 }
      acc[it.product_name].qty += it.qty
      acc[it.product_name].omz += Number(it.price) * it.qty
      return acc
    }, {})
  ).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900">Laporan Owner 📊</h1>
        <p className="mt-1 text-sm text-stone-500">Khusus owner — ringkasan performa penjualan toko.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-6">
          <span className="rounded-2xl bg-emerald-100 p-3.5 text-emerald-700"><Wallet className="h-6 w-6" /></span>
          <div><div className="text-sm text-stone-500">Total Omzet</div><div className="font-display text-2xl font-bold">{rupiah(omzet)}</div></div>
        </div>
        <div className="card flex items-center gap-4 p-6">
          <span className="rounded-2xl bg-brand-100 p-3.5 text-brand-700"><TrendingUp className="h-6 w-6" /></span>
          <div><div className="text-sm text-stone-500">Pesanan Diproses+</div><div className="font-display text-2xl font-bold">{valid.length}</div></div>
        </div>
        <div className="card flex items-center gap-4 p-6">
          <span className="rounded-2xl bg-gold/20 p-3.5 text-forest"><Trophy className="h-6 w-6" /></span>
          <div><div className="text-sm text-stone-500">Rata-rata / Order</div><div className="font-display text-2xl font-bold">{rupiah(valid.length ? omzet / valid.length : 0)}</div></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-stone-900">Omzet 6 Bulan Terakhir</h2>
        <div className="mt-6 flex h-48 items-end gap-3">
          {byMonth.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-[11px] font-bold text-brand-700">{m.total > 0 ? rupiah(m.total).replace('Rp ', '') : '0'}</div>
              <div className="w-full rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-400 transition-all" style={{ height: `${(m.total / maxM) * 100}%`, minHeight: 4 }} />
              <div className="text-xs text-stone-500">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-stone-100 px-6 py-4"><h2 className="font-display text-lg font-bold">Produk Terlaris</h2></div>
        <div className="divide-y divide-stone-50">
          {best.length === 0 && <p className="p-8 text-center text-sm text-stone-400">Belum ada penjualan 🌷</p>}
          {best.map(([_, b], i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{i + 1}</span>
              <span className="flex-1 font-semibold text-stone-800">{b.name}</span>
              <span className="text-stone-400">{b.qty} terjual</span>
              <b>{rupiah(b.omz)}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
