import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { dateID } from '../lib/format'
import type { NewsItem } from '../types'
import NotFound from './NotFound'

export function BeritaList() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('news').select('*').order('published_at', { ascending: false }).then(({ data }) => {
      setItems((data as NewsItem[]) ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="container-j py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-5xl">Berita & Tips Bunga</h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-500">Dapatkan tips merawat bunga dan informasi terbaru dari kami.</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-stone-200/60" />)
          : items.map((n) => (
              <Link key={n.id} to={`/berita/${n.slug}`} className="card group overflow-hidden transition hover:shadow-xl">
                <div className="aspect-video overflow-hidden">
                  <img src={n.image_url} alt={n.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <span className="chip bg-brand-100 text-brand-700"><Tag className="h-3 w-3" /> Berita</span>
                  <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold text-stone-900 group-hover:text-brand-600">{n.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-stone-500">{n.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-400"><CalendarDays className="h-3.5 w-3.5" />{dateID(n.published_at)}</div>
                </div>
              </Link>
            ))}
      </div>
      {!loading && items.length === 0 && <p className="py-16 text-center text-stone-400">Belum ada berita 🌷</p>}
    </div>
  )
}

export function BeritaDetail() {
  const { slug } = useParams()
  const [n, setN] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    supabase.from('news').select('*').eq('slug', slug!).maybeSingle().then(({ data }) => {
      setN((data as NewsItem) ?? null)
      setLoading(false)
    })
  }, [slug])

  if (loading) return <div className="container-j py-24"><div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-stone-200/60" /></div>
  if (!n) return <NotFound />

  return (
    <article className="container-j max-w-3xl py-10 sm:py-14">
      <Link to="/berita" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Semua Berita</Link>
      <span className="mt-6 block chip bg-brand-100 text-brand-700 w-fit"><Tag className="h-3 w-3" /> Berita</span>
      <h1 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-4xl">{n.title}</h1>
      <div className="mt-3 flex items-center gap-1.5 text-sm text-stone-400"><CalendarDays className="h-4 w-4" />{dateID(n.published_at)}</div>
      <img src={n.image_url} alt={n.title} className="mt-8 w-full rounded-3xl object-cover shadow-lg" style={{ aspectRatio: '16/9' }} />
      <div className="prose-j mt-8 space-y-4 text-[15px] leading-relaxed text-stone-700">
        <p className="text-lg font-medium text-stone-800">{n.excerpt}</p>
        <p className="whitespace-pre-line">{n.content}</p>
      </div>
    </article>
  )
}
