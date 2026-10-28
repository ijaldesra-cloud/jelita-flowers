import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Wallet, Upload, CheckCircle2, Clock3, Copy, Check, Loader2, PartyPopper, Banknote, AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { rupiah, dateID } from '../lib/format'
import { useSettings, rekeningOfSettings } from '../lib/hooks'
import type { Order, Payment } from '../types'

export default function Bayar() {
  const { code } = useParams()
  const settings = useSettings()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ bankPengirim: '', namaPengirim: '', tgl: '', jam: '', jumlah: '' })

  useEffect(() => {
    window.scrollTo(0, 0)
    supabase.from('orders').select('*, order_items(*), payments(*)')
      .eq('code', code!).maybeSingle()
      .then(({ data }) => { setOrder((data as Order) ?? null); setLoading(false) })
  }, [code])

  if (loading) return <div className="container-j py-28 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" /></div>
  if (!order) {
    return (
      <div className="container-j py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Pesanan tidak ditemukan</h1>
        <Link to="/lacak" className="btn-primary mt-6">Cek Kode Pesananmu</Link>
      </div>
    )
  }

  const payment: Payment | undefined = order.payments?.[0]
  const paid = order.status !== 'pending'

  const copy = (t: string) => {
    navigator.clipboard?.writeText(t)
    setCopied(t)
    setTimeout(() => setCopied(''), 1500)
  }

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrMsg('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setErrMsg('Pilih foto bukti transfer ya 🙏'); return }
    if (file.size > 5 * 1024 * 1024) { setErrMsg('Ukuran foto maksimal 5 MB'); return }
    if (!form.bankPengirim || !form.namaPengirim || !form.tgl || !form.jam || !form.jumlah) {
      setErrMsg('Lengkapi semua data transfer 🙏')
      return
    }
    if (Number(form.jumlah) < Number(order.total)) {
      setErrMsg(`Nominal transfer minimal ${rupiah(order.total)}`)
      return
    }
    setUploading(true)
    const transfer_time = new Date(`${form.tgl}T${form.jam}:00`).toISOString()
    const path = `${order.code}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const up = await supabase.storage.from('payments').upload(path, file, { cacheControl: '3600', upsert: false })
    if (up.error) {
      setErrMsg('Gagal mengunggah bukti: ' + up.error.message)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from('payments').getPublicUrl(path)
    const ins = await supabase.from('payments').insert({
      order_id: order.id,
      bank_pengirim: form.bankPengirim,
      nama_pengirim: form.namaPengirim,
      transfer_time,
      transfer_amount: Number(form.jumlah),
      proof_url: pub.publicUrl,
      status: 'menunggu',
    })
    if (ins.error) { setErrMsg('Gagal simpan data bukti: ' + ins.error.message); setUploading(false); return }
    setDone(true)
    setUploading(false)
  }

  const statusBadge: Record<string, [string, string]> = {
    pending: ['Menunggu Pembayaran', 'bg-amber-100 text-amber-700'],
    menunggu_verifikasi: ['Bukti Diterima — Verifikasi', 'bg-sky-100 text-sky-700'],
    diproses: ['Pembayaran OK — Diproses', 'bg-emerald-100 text-emerald-700'],
    dikiram: ['Dikirim', 'bg-indigo-100 text-indigo-700'],
    dikirim: ['Sedang Dikirim', 'bg-indigo-100 text-indigo-700'],
    selesai: ['Selesai', 'bg-stone-200 text-stone-700'],
    dibatalkan: ['Dibatalkan', 'bg-red-100 text-red-600'],
  }
  const [badgeText, badgeCls] = statusBadge[order.status] ?? [order.status, 'bg-stone-100 text-stone-600']

  return (
    <div className="container-j max-w-4xl py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">Pembayaran</h1>
          <p className="mt-1 text-sm text-stone-500">Kode Pesanan: <b className="font-mono text-brand-700">{order.code}</b></p>
        </div>
        <span className={`chip !px-4 !py-2 ${badgeCls}`}>{badgeText}</span>
      </div>

      {/* ringkasan pesanan */}
      <div className="card mt-6 divide-y divide-stone-100 p-6">
        {order.order_items?.map((it) => (
          <div key={it.id} className="flex justify-between gap-4 py-2 text-sm">
            <span><b>{it.qty}×</b> {it.product_name}</span>
            <b>{rupiah(Number(it.price) * it.qty)}</b>
          </div>
        ))}
        <div className="flex justify-between py-2 text-sm text-stone-500"><span>Biaya kirim</span><span>{rupiah(order.shipping_fee)}</span></div>
        <div className="flex justify-between pt-2 text-base"><b>Total</b><b className="font-display text-xl text-brand-700">{rupiah(order.total)}</b></div>
        <div className="pt-4 text-xs text-stone-400">Dikirim ke {order.customer_name} · {order.customer_address || 'alamat di WA'} · target {dateID(order.delivery_date)}</div>
      </div>

      {done || paid ? (
        <div className="card mt-8 p-10 text-center">
          <PartyPopper className="mx-auto h-14 w-14 text-emerald-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-stone-900">Terima kasih! 🌹</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            {done || order.status === 'menunggu_verifikasi'
              ? 'Bukti transfermu sudah kami terima. Tim kami akan verifikasi secepatnya — konfirmasi dikirim via WhatsApp.'
              : 'Pembayaranmu sudah terverifikasi & pesanan diproses.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/lacak?kode=${order.code}`} className="btn-primary">Lacak Pesanan</Link>
            <Link to="/produk" className="btn-outline">Belanja Lagi</Link>
          </div>
        </div>
      ) : (
        <>
          {/* rekening */}
          <div className="card mt-8 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-stone-900">
              <Wallet className="h-5 w-5 text-brand-600" /> 1. Transfer ke Rekening Berikut
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {rekeningOfSettings(settings).map((r, i) => (
                <button key={i} onClick={() => copy(r.number)}
                  className="group rounded-2xl bg-cream p-4 text-left ring-1 ring-stone-200 transition hover:ring-brand-400">
                  <div className="text-xs font-bold uppercase tracking-wide text-brand-700">{r.bank}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-stone-800">{r.number}</span>
                    {copied === r.number ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-stone-400 group-hover:text-brand-600" />}
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500">a.n. {r.name}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <Banknote className="h-4 w-4 shrink-0" /> Transfer <b>tepat {rupiah(order.total)}</b> (nominal sama mempermudah verifikasi)
            </p>
          </div>

          {/* form bukti */}
          <form onSubmit={submitProof} className="card mt-8 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-stone-900">
              <Upload className="h-5 w-5 text-brand-600" /> 2. Kirim Bukti Transfer
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Bank Pengirim *</label>
                <input className="input" placeholder="cth. BCA" value={form.bankPengirim} onChange={(e) => setForm({ ...form, bankPengirim: e.target.value })} />
              </div>
              <div>
                <label className="label">Nama Pengirim *</label>
                <input className="input" placeholder="sesuai m-banking" value={form.namaPengirim} onChange={(e) => setForm({ ...form, namaPengirim: e.target.value })} />
              </div>
              <div>
                <label className="label">Tanggal Transfer *</label>
                <input type="date" className="input" value={form.tgl} onChange={(e) => setForm({ ...form, tgl: e.target.value })} />
              </div>
              <div>
                <label className="label">Jam Transfer *</label>
                <input type="time" className="input" value={form.jam} onChange={(e) => setForm({ ...form, jam: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Nominal Transfer *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">Rp</span>
                  <input type="number" className="input !pl-10" placeholder={String(order.total)} value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Foto Bukti Transfer (screenshot m-banking) * · maks 5 MB</label>
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                  <Upload className="h-5 w-5" /> Pilih / Jepret Screenshot
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" />
                  <Clock3 className="h-4 w-4 text-brand-300" />
                </label>
              </div>
            </div>
            {errMsg && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle className="h-4 w-4" /> {errMsg}
              </p>
            )}
            <button type="submit" disabled={uploading} className="btn-primary mt-6 w-full !py-3.5 disabled:opacity-60">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Kirim Bukti Transfer</>}
            </button>
          </form>
        </>
      )}

      {/* riwayat bukti jika ditolak */}
      {payment && payment.status === 'ditolak' && (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700 ring-1 ring-red-100">
          <b>Bukti sebelumnya ditolak.</b> {payment.note || 'Silakan unggah ulang bukti yang benar.'}
        </div>
      )}
    </div>
  )
}
