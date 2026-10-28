import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PackageSearch, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { rupiah, dateID } from '../lib/format'
import type { Order } from '../types'

const STEPS = ['pending', 'menunggu_verifikasi', 'diproses', 'dikirim', 'selesai'] as const
const STEP_LABEL: Record<string, string> = {
  pending: 'Pesanan Dibuat',
  menunggu_verifikasi: 'Bukti Diterima',
  diproses: 'Dirangkai',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
}

export default function Lacak() {
  const [params, setParams] = useSearchParams()
  const [kode, setKode] = useState(params.get('kode') ?? '')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = async (c: string) => {
    if (!c.trim()) return
    setLoading(true)
    setNotFound(false)
    const { data } = await supabase.from('orders').select('*, order_items(*), payments(*)').eq('code', c.trim().toUpperCase()).maybeSingle()
    if (data) setOrder(data as Order)
    else { setOrder(null); setNotFound(true) }
    setLoading(false)
  }

  useEffect(() => {
    const k = params.get('kode')
    if (k) load(k)
  }, [])

  const activeIdx = order ? (order.status === 'dibatalkan' ? -2 : STEPS.indexOf(order.status as typeof STEPS[number])) : -1

  return (
    <div className="container-j max-w-2xl py-10 sm:py-14">
      <div className="text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-brand-400" />
        <h1 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-4xl">Lacak Pesanan</h1>
        <p className="mt-2 text-sm text-stone-500">Masukkan kode pesananmu (contoh: <b className="font-mono">JPF-20260101-ABCD</b>)</p>
      </div>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); setParams({ kode }); load(kode) }}
      >
        <input className="input !rounded-full font-mono" placeholder="Kode pesanan..." value={kode} onChange={(e) => setKode(e.target.value)} />
        <button className="btn-primary shrink-0 !rounded-full !px-6" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {notFound && (
        <p className="mt-8 rounded-2xl bg-amber-50 px-5 py-4 text-center text-sm text-amber-700">
          Pesanan tidak ditemukan. Periksa kembali kode pesananmu 🙏
        </p>
      )}

      {order && (
        <div className="card mt-10 p-6 sm:p-8 animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono font-bold text-brand-700">{order.code}</div>
              <div className="text-xs text-stone-400">{dateID(order.created_at, true)}</div>
            </div>
            <div className="text-right">
              <b className="font-display text-xl text-brand-700">{rupiah(order.total)}</b>
              <div className="text-xs text-stone-400">{order.order_items?.length ?? 0} produk</div>
            </div>
          </div>

          {order.status !== 'dibatalkan' ? (
            <ol className="mt-8 space-y-0">
              {STEPS.map((s, i) => {
                const done = i <= activeIdx
                return (
                  <li key={s} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                    )}
                    <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      done ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                      {done ? '✓' : i + 1}
                    </span>
                    <div>
                      <div className={`text-sm font-bold ${done ? 'text-stone-800' : 'text-stone-400'}`}>{STEP_LABEL[s]}</div>
                      {s === 'menunggu_verifikasi' && order.payments?.[0]?.status === 'menunggu' && done && (
                        <div className="text-xs text-sky-600">Bukti transfer diterima — menunggu verifikasi admin</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Pesanan dibatalkan. Hubungi kami untuk bantuan.</p>
          )}

          <div className="mt-6">
            <Link to={`/bayar/${order.code}`} className="btn-outline w-full">Buka Halaman Pembayaran</Link>
          </div>
        </div>
      )}
    </div>
  )
}
