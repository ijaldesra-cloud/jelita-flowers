import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { orderCode, rupiah } from '../lib/format'
import { useCart } from '../context/CartContext'
import type { Order } from '../types'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const nav = useNavigate()
  const [form, setForm] = useState({
    name: '', phone: '', address: '', date: new Date().toISOString().slice(0, 10), note: '', shipping: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div className="container-j py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-800">Belum ada yang di-checkout</h1>
        <button onClick={() => nav('/produk')} className="btn-primary mt-6">Belanja Dulu</button>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Nama, nomor HP & alamat wajib diisi ya 🙏')
      return
    }
    setSubmitting(true)
    const code = orderCode()
    const total = subtotal + Number(form.shipping || 0)
    const { data: order, error: errOrder } = await supabase
      .from('orders')
      .insert({
        code,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_address: form.address.trim(),
        delivery_date: form.date,
        delivery_note: form.note.trim(),
        subtotal,
        shipping_fee: Number(form.shipping || 0),
        total,
        status: 'pending',
      })
      .select()
      .single()

    if (errOrder || !order) {
      setError('Gagal membuat pesanan: ' + (errOrder?.message ?? 'coba lagi'))
      setSubmitting(false)
      return
    }

    const rows = items.map((i) => ({
      order_id: (order as Order).id,
      product_id: i.product.id,
      product_name: i.product.name,
      price: i.product.price,
      qty: i.qty,
    }))
    const { error: errItems } = await supabase.from('order_items').insert(rows)
    if (errItems) console.warn('items insert warn', errItems.message)

    clear()
    nav(`/bayar/${code}`)
  }

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="container-j py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">Isi data pengiriman, lalu lakukan pembayaran via transfer & unggah buktinya.</p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card space-y-5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Nama Penerima *</label>
              <input className="input" placeholder="cth. Rina Kartika" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">No. WhatsApp *</label>
              <input className="input" placeholder="cth. 0812xxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Alamat Pengiriman *</label>
            <textarea className="input min-h-24" placeholder="Jalan, no rumah, kecamatan, kota..." value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-600" /> Tanggal Kirim</label>
              <input type="date" className="input" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><ShoppingBag className="h-4 w-4 text-brand-600" /> Biaya Kirim (opsional)</label>
              <input type="number" className="input" placeholder="0" value={form.shipping || ''} onChange={(e) => set('shipping', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="label">Catatan (kartu ucapan, warna, dsb)</label>
            <textarea className="input min-h-20" placeholder="cth. Tulis 'Happy Birthday Rara' di kartu..." value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <aside className="card sticky top-24 h-fit p-6">
          <h2 className="font-display text-xl font-bold text-stone-900">Pesananmu</h2>
          <div className="mt-4 space-y-3">
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3 text-sm">
                <img src={product.image_url} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-semibold">{product.name}</div>
                  <div className="text-xs text-stone-400">{qty} × {rupiah(product.price)}</div>
                </div>
                <b>{rupiah(Number(product.price) * qty)}</b>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><b>{rupiah(subtotal)}</b></div>
            <div className="flex justify-between"><span className="text-stone-500">Kirim</span><b>{rupiah(Number(form.shipping || 0))}</b></div>
            <div className="flex justify-between text-base"><b>Total Bayar</b><b className="font-display text-xl text-brand-700">{rupiah(subtotal + Number(form.shipping || 0))}</b></div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full !py-3.5 disabled:opacity-60">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Buat Pesanan <ChevronRight className="h-4 w-4" /></>}
          </button>
        </aside>
      </form>
    </div>
  )
}
