import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { slugify, dateID } from '../../lib/format'
import type { NewsItem } from '../../types'

const empty = { title: '', excerpt: '', content: '', image_url: '' }

export default function AdminBerita() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    setItems((data as NewsItem[]) ?? [])
  }
  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    if (modal === 'edit' && form.id) {
      await supabase.from('news').update({ title: form.title, excerpt: form.excerpt, content: form.content, image_url: form.image_url }).eq('id', form.id)
    } else {
      await supabase.from('news').insert({ ...form, slug: slugify(form.title) })
    }
    setModal(null)
    setBusy(false)
    load()
  }

  const del = async (n: NewsItem) => {
    if (!window.confirm(`Hapus berita "${n.title}"?`)) return
    await supabase.from('news').delete().eq('id', n.id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-stone-900">Berita & Tips</h1>
        <button onClick={() => { setForm(empty); setModal('add') }} className="btn-primary !px-4"><Plus className="h-4 w-4" /> Berita</button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="card flex items-center gap-4 p-4">
            <img src={n.image_url} alt={n.title} className="h-14 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 font-semibold text-stone-800">{n.title}</div>
              <div className="text-xs text-stone-400">{dateID(n.published_at)} · /{n.slug}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setForm({ id: n.id, title: n.title, excerpt: n.excerpt, content: n.content, image_url: n.image_url }); setModal('edit') }}
                className="rounded-full p-2 text-stone-400 hover:bg-brand-100 hover:text-brand-700"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del(n)} className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="card p-8 text-center text-sm text-stone-400">Belum ada berita 🌷</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <form onSubmit={save} className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-pop">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{modal === 'add' ? 'Berita Baru' : 'Edit Berita'}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Judul *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Ringkasan (excerpt)</label>
                <textarea className="input min-h-20" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </div>
              <div>
                <label className="label">Isi</label>
                <textarea className="input min-h-40" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="label">URL Foto</label>
                <input className="input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
            </div>
            <button disabled={busy} className="btn-primary mt-6 w-full !py-3">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan Berita'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
