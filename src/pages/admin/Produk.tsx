import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, slugify } from '../../lib/format'
import type { Category, Product } from '../../types'

const empty = {
  name: '', slug: '', category_id: '', price: '', old_price: '', description: '', image_url: '',
  is_active: true, is_featured: false, stock: 99,
}

export default function AdminProduk() {
  const [items, setItems] = useState<Product[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('id'),
    ])
    setItems((ps as Product[]) ?? [])
    setCats((cs as Category[]) ?? [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setModal('add') }
  const openEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, slug: p.slug, category_id: p.category_id ? String(p.category_id) : '', price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : '', description: p.description, image_url: p.image_url,
      is_active: p.is_active, is_featured: p.is_featured, stock: p.stock,
    })
    setModal('edit')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const payload: any = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      category_id: form.category_id ? Number(form.category_id) : null,
      price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null,
      description: form.description, image_url: form.image_url,
      is_active: form.is_active, is_featured: form.is_featured, stock: Number(form.stock),
    }
    if (modal === 'edit' && form.id) await supabase.from('products').update(payload).eq('id', form.id)
    else await supabase.from('products').insert(payload)
    setModal(null)
    setBusy(false)
    load()
  }

  const del = async (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  const uploadImg = async (file: File) => {
    const path = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const { error } = await supabase.storage.from('products').upload(path, file)
    if (error) { window.alert('Gagal upload: ' + error.message); return }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setForm((f) => ({ ...f, image_url: data.publicUrl }))
  }

  const shown = items.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-stone-900">Kelola Produk</h1>
        <div className="flex gap-2">
          <input className="input max-w-56" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={openAdd} className="btn-primary !px-4"><Plus className="h-4 w-4" /> Produk</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3">Produk</th><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Harga</th>
              <th className="px-5 py-3">Status</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {shown.map((p) => (
              <tr key={p.id} className="hover:bg-brand-50/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url} alt={p.name} className="h-11 w-11 rounded-xl object-cover" />
                    <div>
                      <div className="font-semibold text-stone-800">{p.name}</div>
                      <div className="font-mono text-[11px] text-stone-400">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-stone-500">{p.categories?.name ?? '-'}</td>
                <td className="px-5 py-3 font-bold text-brand-700">{rupiah(p.price)}</td>
                <td className="px-5 py-3">
                  <span className={`chip ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {p.is_featured && <span className="chip ml-1 bg-gold/20 text-forest">Unggulan</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-full p-2 text-stone-400 hover:bg-brand-100 hover:text-brand-700"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(p)} className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <form onSubmit={save} className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-pop">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{modal === 'add' ? 'Produk Baru' : 'Edit Produk'}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Nama Produk *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: modal === 'add' ? slugify(e.target.value) : form.slug })} required />
              </div>
              <div>
                <label className="label">Kategori</label>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">— Pilih —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Slug (URL)</label>
                <input className="input font-mono text-xs" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <label className="label">Harga *</label>
                <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="label">Harga Sebelum Diskon (opsional)</label>
                <input type="number" className="input" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Deskripsi</label>
                <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Foto Produk</label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} className="h-14 w-14 rounded-xl object-cover" alt="prev" />}
                  <input className="input flex-1" placeholder="URL foto..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  <label className="btn-outline !px-3 !py-2 text-xs cursor-pointer">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImg(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Stok</label>
                <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-5 pb-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Aktif</label>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Unggulan</label>
              </div>
            </div>
            <button disabled={busy} className="btn-primary mt-6 w-full !py-3 disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan Produk'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
