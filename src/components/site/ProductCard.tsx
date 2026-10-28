import { Link } from 'react-router-dom'
import { ShoppingBag, Plus } from 'lucide-react'
import { rupiah } from '../../lib/format'
import SmartImage from './SmartImage'
import type { Product } from '../../types'

export default function ProductCard({ p }: { p: Product }) {
  return (
    <div className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-900/10">
      <Link to={`/produk/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-t-3xl bg-brand-50">
        <SmartImage
          src={p.image_url}
          alt={p.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {p.old_price && Number(p.old_price) > Number(p.price) && (
          <span className="absolute left-3 top-3 chip bg-brand-600 text-white">Diskon {Math.round((1 - p.price / p.old_price) * 100)}%</span>
        )}
        {p.categories?.name && (
          <span className="absolute bottom-3 left-3 chip bg-white/90 text-brand-700">{p.categories.name}</span>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/produk/${p.slug}`} className="line-clamp-1 font-semibold text-stone-800 transition hover:text-brand-600">
          {p.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-brand-700">{rupiah(p.price)}</span>
          {p.old_price && Number(p.old_price) > Number(p.price) && (
            <span className="text-xs text-stone-400 line-through">{rupiah(p.old_price)}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="btn-primary flex-1 !px-3 !py-2 text-xs"
            onClick={() => window.dispatchEvent(new CustomEvent('jpf_add_cart', { detail: p }))}
          >
            <Plus className="h-4 w-4" /> Keranjang
          </button>
          <Link to={`/produk/${p.slug}`} className="btn-outline !px-3 !py-2" aria-label="Detail">
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
