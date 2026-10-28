import { useEffect, useState } from 'react'
import { Eye, Check, X, Loader2, Image as ImageIcon, Bike, Undo2, Ban } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, dateID } from '../../lib/format'
import { ALL_STATUSES, STATUS_LABEL, STATUS_COLOR } from '../../lib/status'
import type { Order, OrderStatus, Payment } from '../../types'
import { useAuth } from '../../context/AuthContext'

export default function AdminPesanan() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('semua')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders').select('*, order_items(*), payments(*)')
      .order('created_at', { ascending: false }).limit(300)
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const shown = orders.filter((o) =>
    (filter === 'semua' || o.status === filter) &&
    (!q || o.code.toLowerCase().includes(q.toLowerCase()) || o.customer_name.toLowerCase().includes(q.toLowerCase()) || o.customer_phone.includes(q))
  )

  const refreshDetail = async (code: string) => {
    const { data } = await supabase.from('orders').select('*, order_items(*), payments(*)').eq('code', code).maybeSingle()
    if (data) setDetail(data as Order)
  }

  const setStatus = async (o: Order, s: OrderStatus) => {
    await supabase.from('orders').update({ status: s }).eq('id', o.id)
    if (detail?.code === o.code) await refreshDetail(o.code)
    load()
  }

  const verifyPayment = async (p: Payment, status: 'terverifikasi' | 'ditolak', note = '') => {
    await supabase.from('payments').update({ status, note }).eq('id', p.id)
    if (detail) await refreshDetail(detail.code)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-stone-900">Kelola Pesanan</h1>
        <input className="input max-w-xs" placeholder="Cari kode / nama / no. HP..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['semua', ...ALL_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`chip !px-4 !py-2 capitalize transition ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-brand-50'}`}>
            {s === 'semua' ? 'Semua' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3">Kode</th><th className="px-5 py-3">Pelanggan</th><th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading && <tr><td colSpan={6} className="px-5 py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-400" /></td></tr>}
            {!loading && shown.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-stone-400">Tidak ada pesanan 🌷</td></tr>}
            {shown.map((o) => (
              <tr key={o.id} className="transition hover:bg-brand-50/40">
                <td className="px-5 py-3 font-mono font-bold text-brand-700">{o.code}</td>
                <td className="px-5 py-3">
                  <div className="font-semibold text-stone-800">{o.customer_name}</div>
                  <div className="text-xs text-stone-400">{o.customer_phone}</div>
                </td>
                <td className="px-5 py-3 font-bold">{rupiah(o.total)}</td>
                <td className="px-5 py-3"><span className={`chip ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="px-5 py-3 text-stone-500">{dateID(o.created_at)}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setDetail(o)} className="rounded-full p-2 text-stone-400 transition hover:bg-brand-100 hover:text-brand-700" aria-label="Detail">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative z-10 h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl animate-pop">
            <div className="sticky top-0 glass border-b border-stone-100 flex items-center justify-between px-6 py-4">
              <div>
                <div className="font-mono font-bold text-brand-700">{detail.code}</div>
                <div className="text-xs text-stone-400">{dateID(detail.created_at, true)}</div>
              </div>
              <span className={`chip ${STATUS_COLOR[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
            </div>

            <div className="space-y-6 p-6">
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Pelanggan & Pengiriman</h3>
                <div className="rounded-2xl bg-cream p-4 text-sm leading-relaxed">
                  <b>{detail.customer_name}</b> · {detail.customer_phone}<br />
                  {detail.customer_address}<br />
                  Target kirim: <b>{dateID(detail.delivery_date)}</b>
                  {detail.delivery_note && <><br /><i className="text-stone-500">Catatan: {detail.delivery_note}</i></>}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Item</h3>
                <div className="space-y-1.5 text-sm">
                  {detail.order_items?.map((it) => (
                    <div key={it.id} className="flex justify-between"><span>{it.qty}× {it.product_name}</span><b>{rupiah(Number(it.price) * it.qty)}</b></div>
                  ))}
                  <hr /><div className="flex justify-between text-base"><b>Total</b><b className="text-brand-700">{rupiah(detail.total)}</b></div>
                </div>
              </section>

              {detail.payments?.map((p) => (
                <section key={p.id} className="rounded-2xl p-4 ring-1 ring-stone-200">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Bukti Transfer</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-stone-400">Bank:</span> <b>{p.bank_pengirim}</b></div>
                    <div><span className="text-stone-400">Nama:</span> <b>{p.nama_pengirim}</b></div>
                    <div><span className="text-stone-400">Tgl/Jam:</span> <b>{p.transfer_time ? dateID(p.transfer_time, true) : '-'}</b></div>
                    <div><span className="text-stone-400">Nominal:</span> <b>{rupiah(p.transfer_amount)}</b></div>
                  </div>
                  {p.proof_url && (
                    <a href={p.proof_url} target="_blank" rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-50 py-3 text-sm font-bold text-brand-700 hover:bg-brand-100">
                      <ImageIcon className="h-4 w-4" /> Lihat Foto Bukti
                    </a>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`chip ${p.status === 'terverifikasi' ? 'bg-emerald-100 text-emerald-700' : p.status === 'ditolak' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                    {p.status === 'menunggu' && (
                      <div className="flex gap-2">
                        <button onClick={() => verifyPayment(p, 'terverifikasi')}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                          <Check className="h-3.5 w-3.5" /> Verifikasi
                        </button>
                        <button onClick={() => { const n = window.prompt('Alasan penolakan (opsional):') ?? ''; verifyPayment(p, 'ditolak', n) }}
                          className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">
                          <X className="h-3.5 w-3.5" /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              ))}

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Ubah Status</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.status === 'menunggu_verifikasi' && (
                    <button onClick={() => setStatus(detail, 'diproses')} className="btn-outline !py-2 text-xs"><Undo2 className="h-3.5 w-3.5" /> Tandai Diproses</button>
                  )}
                  {detail.status === 'diproses' && (
                    <button onClick={() => setStatus(detail, 'dikirim')} className="btn-primary !py-2 text-xs"><Bike className="h-3.5 w-3.5" /> Kirim Pesanan</button>
                  )}
                  {detail.status === 'dikirim' && (
                    <button onClick={() => setStatus(detail, 'selesai')} className="btn-primary !py-2 text-xs"><Check className="h-3.5 w-3.5" /> Selesaikan</button>
                  )}
                  {!['dibatalkan', 'selesai'].includes(detail.status) && (
                    <button onClick={() => { if (window.confirm('Batalkan pesanan ini?')) setStatus(detail, 'dibatalkan') }}
                      className="btn !bg-red-50 !py-2 text-xs text-red-600 hover:!bg-red-100"><Ban className="h-3.5 w-3.5" /> Batalkan</button>
                  )}
                </div>
                {profile?.role === 'owner' && <p className="mt-2 text-[11px] text-stone-400">Kamu login sebagai <b>owner</b> — akses penuh termasuk laporan & pengaturan.</p>}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
