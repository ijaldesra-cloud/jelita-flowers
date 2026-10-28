import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/site/ProductCard'
import type { Category, Product } from '../types'

export default function Produk() {
  const [params, setParams] = useSearchParams()
  const active = params.get('kategori') ?? 'Semua Produk'
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('id'),
      supabase.from('products').select('*, categories(name, slug)').eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(([cats, prods]) => {
      setCategories((cats.data as Category[]) ?? [])
      setProducts((prods.data as Product[]) ?? [])
      setLoading(false)
    })
  }, [])

  const shown = useMemo(() => {
    return products.filter((p) => {
      const matchCat = active === 'Semua Produk' || p.categories?.name === active
      const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase())
      return matchCat && matchQ
    })
  }, [products, active, q])

  return (
    <div className="container-j py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-5xl">Koleksi Kami</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500 sm:text-base">
          Temukan rangkaian terbaik untuk setiap momen spesial Anda — segar setiap hari, dirangkai dengan cinta.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input !rounded-full !pl-11" placeholder="Cari buket, bunga papan..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['Semua Produk', ...categories.map((c) => c.name)].map((c) => (
          <button
            key={c}
            onClick={() => setParams(c === 'Semua Produk' ? {} : { kategori: c })}
            className={`chip !px-4 !py-2 transition ${
              active === c ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-brand-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-stone-200/60" />)
          : shown.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {!loading && shown.length === 0 && (
        <p className="py-16 text-center text-stone-400">Tidak ada produk yang cocok 🌷</p>
      )}
    </div>
  )
}
