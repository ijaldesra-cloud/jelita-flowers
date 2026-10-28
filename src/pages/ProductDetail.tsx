import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, ArrowLeft, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { rupiah } from '../lib/format'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/site/ProductCard'
import type { Product } from '../types'

export default function ProductDetail() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug!)
      .maybeSingle()
      .then(async ({ data }) => {
        setP((data as Product) ?? null)
        if (data) {
          let r = supabase.from('products').select('*, categories(name, slug)').eq('is_active', true).neq('id', (data as Product).id).limit(4)
          if ((data as Product).category_id) r = r.eq('category_id', (data as Product).category_id)
          const { data: rel } = await r
          setRelated((rel as Product[]) ?? [])
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return <div className="container-j grid gap-10 py-24 lg:grid-cols-2"><div className="aspect-square animate-pulse rounded-3xl bg-stone-200/60" /><div className="animate-pulse rounded-3xl bg-stone-200/60" /></div>
  }
  if (!p) {
    return (
      <div className="container-j py-24 text-center">
        <p className="font-display text-2xl text-stone-700">Produk tidak ditemukan</p>
        <Link to="/produk" className="btn-primary mt-6"><ArrowLeft className="h-4 w-4" /> Kembali ke Produk</Link>
      </div>
    )
  }

  const buyViaWA = () => {
    const waNum = '6281234567890'
    const text = `Halo Jelita Putra Florist! Saya mau pesan:%0A%0A🌹 *${p.name}*%0AJumlah: ${qty}%0A%0A${location.origin}/produk/${p.slug}`
    window.open(`https://wa.me/${waNum}?text=${text}`, '_blank')
  }

  return (
    <div className="container-j py-8 sm:py-12">
      <button onClick={() => nav(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-50 shadow-xl">
          <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" />
          {p.old_price && Number(p.old_price) > Number(p.price) && (
            <span className="absolute left-4 top-4 chip bg-brand-600 text-white shadow-lg">
              Hemat {rupiah(Number(p.old_price) - Number(p.price))}
            </span>
          )}
        </div>

        <div>
          {p.categories?.name && <span className="chip bg-brand-100 text-brand-700">{p.categories.name}</span>}
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-4xl">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-brand-700">{rupiah(p.price)}</span>
            {p.old_price && Number(p.old_price) > Number(p.price) && (
              <span className="text-lg text-stone-400 line-through">{rupiah(p.old_price)}</span>
            )}
          </div>
          <p className="mt-5 leading-relaxed text-stone-600">{p.description}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-stone-500">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Freshness tersangkut dijamin</span>
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-emerald-600" /> Kirim se-Purwakarta hari yang sama</span>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full ring-1 ring-stone-300">
              <button className="p-3 text-stone-600 hover:text-brand-600 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-9 text-center font-bold">{qty}</span>
              <button className="p-3 text-stone-600 hover:text-brand-600" onClick={() => setQty(qty + 1)}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-stone-400">Total: <b className="text-stone-700">{rupiah(Number(p.price) * qty)}</b></span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="btn-primary !px-7 !py-3"
              onClick={() => { add(p, qty); nav('/keranjang') }}
            >
              <ShoppingBag className="h-5 w-5" /> Beli Sekarang
            </button>
            <button className="btn-outline !px-6 !py-3" onClick={() => add(p, qty)}>
              <Plus className="h-4 w-4" /> Tambah Keranjang
            </button>
            <button onClick={buyViaWA} className="btn !bg-[#25d366] !px-6 !py-3 text-white hover:brightness-105">
              <MessageCircle className="h-4 w-4" /> Tanya via WA
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-2xl font-bold text-stone-900">Kamu Juga Mungkin Suka</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  )
}
