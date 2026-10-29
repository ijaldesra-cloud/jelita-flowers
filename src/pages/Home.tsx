import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Flower2, Truck, HeartHandshake, Leaf, ArrowRight, Sparkles, MapPin, CalendarDays,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/site/ProductCard'
import type { Category, NewsItem, Product, Settings } from '../types'

const FEATURED_IMGS = [
  'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YS2QNHFASZD7KJMJHT8R8.png',
  'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YS2R3BVRH3S476A0NAGQN.png',
  'https://tokobungapurwakarta.com/storage/galleries/2026-02-04/01KGKG2MB96MZXDHZJNN8KNTAZ.png',
  'https://tokobungapurwakarta.com/storage/galleries/2026-04-10/01KNTXZQ3ECCHYHS1Z8XDFPBGP.jpg',
  'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2Y85BGTN9NMDBTHSFASFJK.png',
  'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YM6NMZA2R1KA6GJP4S8S6.png',
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setSettings(data as Settings))
    supabase.from('categories').select('*').order('id').then(({ data }) => setCategories((data as Category[]) ?? []))
    supabase.from('news').select('*').order('published_at', { ascending: false }).limit(3)
      .then(({ data }) => setNews((data as NewsItem[]) ?? []))
    supabase.from('products').select('*, categories(name, slug)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const wa = settings?.whatsapp ?? '6281234567890'

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src="/hero.webp"
          alt="Buket bunga Jelita Putra Florist"
          width={1440}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-800/60 to-brand-600/20" />
        <div className="container-j relative section-pad lg:py-28">
          <div className="max-w-2xl">
            <span className="animate-rise chip bg-white/15 text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Toko Bunga Terpercaya Purwakarta
            </span>
            <h1 className="animate-rise delay-1 mt-5 font-display text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Bunga Terindah untuk{' '}
              <span className="relative inline-block text-gold italic">
                Momen Spesial
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 9C60 2 140 2 198 9" stroke="#c9a22e" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{' '}
              Anda
            </h1>
            <p className="animate-rise delay-2 mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
              Buket segar, bunga papan, standing flower & dekorasi eksklusif — dirangkai
              dengan cinta oleh perangkai berpengalaman. Belanja mudah: pilih, transfer, kirim bukti, selesai!
            </p>
            <div className="animate-rise delay-3 mt-8 flex flex-wrap gap-3">
              <Link to="/produk" className="btn-gold !px-7 !py-3.5 text-base">
                Lihat Koleksi <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={`https://wa.me/${wa}`}
                target="_blank" rel="noreferrer"
                className="btn !border-2 !border-white/40 !px-7 !py-3.5 text-base text-white backdrop-blur-sm hover:!bg-white/10"
              >
                Pesan Custom
              </a>
            </div>
            <div className="animate-rise delay-3 mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Sindangkasih, Purwakarta</span>
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" /> Buka setiap hari · {settings?.store_hours ?? '07.00 - 21.00 WIB'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="border-b border-stone-900/5 bg-ivory">
        <div className="container-j grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[
            [Flower2, 'Bunga Segar', 'Dijamin kesegarannya setiap hari'],
            [Truck, 'Pengiriman Cepat', 'Kirim di hari yang sama'],
            [HeartHandshake, 'Layanan Ramah', 'Siap membantu kebutuhan Anda'],
            [Leaf, 'Ramah Lingkungan', 'Packaging berkelanjutan'],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Flower2
            return (
              <div key={i} className="flex items-start gap-3">
                <span className="rounded-2xl bg-brand-100 p-3 text-brand-600"><I className="h-6 w-6" /></span>
                <div>
                  <div className="font-bold text-stone-800">{t as string}</div>
                  <div className="text-xs text-stone-500">{d as string}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-j section-pad">
        <div className="mb-10 text-center">
          <span className="chip bg-brand-100 text-brand-700">Kategori Pilihan</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
            Belanja Sesuai Kebutuhanmu
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-stone-200/60" />)
            : categories.map((c) => (
              <Link
                key={c.id}
                to={`/produk?kategori=${encodeURIComponent(c.name)}`}
                className="group relative block overflow-hidden rounded-2xl"
              >
                <img src={c.image_url} alt={c.name} loading="lazy" className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/20 to-transparent" />
                <div className="absolute bottom-0 w-full p-3 text-center">
                  <span className="font-display text-sm font-bold text-white sm:text-base">{c.name}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="bg-white section-pad">
        <div className="container-j">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="chip bg-gold/20 text-forest">Produk Terlaris</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Koleksi Terbaik Kami
              </h2>
            </div>
            <Link to="/produk" className="btn-outline">Semua Produk <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-stone-100" />)
              : products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-j py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-forest to-forest-light px-8 py-14 text-center sm:px-16">
          <Flower2 className="absolute -left-8 -top-8 h-40 w-40 text-white/5" />
          <Flower2 className="absolute -bottom-10 -right-10 h-48 w-48 rotate-45 text-white/5" />
          <span className="chip bg-white/10 text-gold">Layanan Khusus</span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold text-white sm:text-4xl">
            Butuh Rangkaian Custom untuk Acara Besar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-stone-300 sm:text-base">
            Wedding, wisuda, grand opening, hingga papan duka cita — kami rangkai sesuai keinginan Anda,
            konsultasi gratis via WhatsApp.
          </p>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo Jelita Putra Florist, saya mau konsultasi pesanan custom 🌹')}`}
            target="_blank" rel="noreferrer"
            className="btn-gold mt-8 !px-8 !py-3.5"
          >
            Konsultasi Sekarang <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-white py-14">
        <div className="container-j">
          <div className="mb-8 text-center">
            <span className="chip bg-brand-100 text-brand-700">Galeri</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-stone-900">Karya Rangkaian Kami</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURED_IMGS.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl">
                <img src={src} alt={`Karya ${i + 1}`} loading="lazy"
                  className="aspect-square w-full object-cover transition duration-700 group-hover:scale-110" />
              </a>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/galeri" className="btn-outline">Galeri Lengkap <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* NEWS */}
      {news.length > 0 && (
        <section className="container-j section-pad">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="chip bg-brand-100 text-brand-700">Berita Terbaru</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-stone-900">Informasi & Tips Bunga</h2>
            </div>
            <Link to="/berita" className="btn-outline">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {news.map((n) => (
              <Link key={n.id} to={`/berita/${n.slug}`} className="card group overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img src={n.image_url} alt={n.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 font-display text-lg font-bold text-stone-900 transition group-hover:text-brand-600">{n.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-500">{n.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
