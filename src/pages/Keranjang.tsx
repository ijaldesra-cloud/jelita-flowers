import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { rupiah } from '../lib/format'

export default function Keranjang() {
  const { items, setQty, remove, subtotal, clear } = useCart()
  const nav = useNavigate()

  if (items.length === 0) {
    return (
      <div className="container-j py-24 text-center">
        <span className="mx-auto inline-flex rounded-full bg-brand-100 p-5 text-brand-600"><ShoppingBag className="h-10 w-10" /></span>
        <h1 className="mt-5 font-display text-2xl font-bold text-stone-800">Keranjang masih kosong</h1>
        <p className="mt-2 text-stone-500">Yuk, temukan buket terindah untuk momen spesialmu 🌸</p>
        <Link to="/produk" className="btn-primary mt-7">Lihat Produk <ArrowRight className="h-4 w-4" /></Link>
      </div>
    )
  }

  return (
    <div className="container-j py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-stone-900">Keranjang Belanja</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map(({ product, qty }) => (
            <div key={product.id} className="card flex items-center gap-4 p-4">
              <img src={product.image_url} alt={product.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1">
                <Link to={`/produk/${product.slug}`} className="line-clamp-1 font-semibold text-stone-800 hover:text-brand-600">{product.name}</Link>
                <div className="mt-1 text-sm text-stone-500">{rupiah(product.price)}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full ring-1 ring-stone-200">
                    <button className="p-2 text-stone-500 hover:text-brand-600 disabled:opacity-40" disabled={qty <= 1}
                      onClick={() => setQty(product.id, qty - 1)}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-bold">{qty}</span>
                    <button className="p-2 text-stone-500 hover:text-brand-600" onClick={() => setQty(product.id, qty + 1)}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button className="rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-500" onClick={() => remove(product.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="hidden font-display text-lg font-bold text-brand-700 sm:block">{rupiah(Number(product.price) * qty)}</div>
            </div>
          ))}
          <button onClick={clear} className="text-sm font-semibold text-stone-400 transition hover:text-red-500">Kosongkan keranjang</button>
        </div>

        <aside className="card sticky top-24 h-fit p-6">
          <h2 className="font-display text-xl font-bold text-stone-900">Ringkasan</h2>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Subtotal ({items.length} produk)</span><b>{rupiah(subtotal)}</b></div>
            <div className="flex justify-between"><span className="text-stone-500">Biaya kirim</span><span className="text-stone-400">Ditentukan saat checkout</span></div>
            <hr />
            <div className="flex justify-between text-base"><b>Total</b><b className="font-display text-xl text-brand-700">{rupiah(subtotal)}</b></div>
          </div>
          <button className="btn-primary mt-6 w-full !py-3.5" onClick={() => nav('/checkout')}>
            Lanjut ke Pembayaran <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-400">
            Pembayaran via transfer bank — kirim bukti transfer setelah checkout, verifikasi cepat oleh tim kami ✅
          </p>
        </aside>
      </div>
    </div>
  )
}
