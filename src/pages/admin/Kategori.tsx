import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { slugify } from '../../lib/format'
import type { Category } from '../../types'

export default function AdminKategori() {
  const [cats, setCats] = useState<Category[]>([])
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', image_url: '' })
  const [open, setOpen] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('id')
    setCats((data as Category[]) ?? [])
  }
  useEffect(() => { load() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await supabase.from('categories').insert({ name: form.name, slug: slugify(form.name), image_url: form.image_url })
    setForm({ name: '', image_url: '' })
    setOpen(false)
    setBusy(false)
    load()
  }

  const del = async (c: Category) => {
    if (!window.confirm(`Hapus kategori "${c.name}"?`)) return
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-stone-900">Kategori</h1>
        <button onClick={() => setOpen(true)} className="btn-primary !px-4"><Plus className="h-4 w-4" /> Kategori</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <div key={c.id} className="card group relative overflow-hidden">
            <img src={c.image_url} alt={c.name} className="aspect-video w-full object-cover" />
            <div className="p-4">
              <div className="font-bold text-stone-800">{c.name}</div>
              <div className="font-mono text-[11px] text-stone-400">/{c.slug}</div>
            </div>
            <button onClick={() => del(c)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-500 opacity-0 shadow transition group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={add} className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-pop">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Kategori Baru</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nama *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">URL Foto</label>
                <input className="input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
            </div>
            <button disabled={busy} className="btn-primary mt-6 w-full !py-3">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
