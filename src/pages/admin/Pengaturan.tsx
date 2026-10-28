import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/hooks'
import type { Rekening, Settings } from '../../types'

export default function AdminPengaturan() {
  const s = useSettings()
  const [form, setForm] = useState<Settings | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (s && !form) setForm({ ...s }) }, [s])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    await supabase.from('settings').update({
      rekening: form.rekening, whatsapp: form.whatsapp.replace(/\D/g, ''),
      store_hours: form.store_hours, store_address: form.store_address, updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!form) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-400" /></div>

  const setRek = (i: number, r: Partial<Rekening>) => {
    const next = [...form.rekening]; next[i] = { ...next[i], ...r }
    setForm({ ...form, rekening: next })
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900">Pengaturan Toko</h1>
        <p className="mt-1 text-sm text-stone-500">Rekening tujuan pembayaran & info kontak tampil di halaman publik.</p>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Rekening Transfer</h2>
        {form.rekening.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.3fr_auto] gap-2">
            <input className="input" placeholder="Bank" value={r.bank} onChange={(e) => setRek(i, { bank: e.target.value })} />
            <input className="input font-mono" placeholder="Nomor" value={r.number} onChange={(e) => setRek(i, { number: e.target.value })} />
            <button type="button" onClick={() => setForm({ ...form, rekening: form.rekening.filter((_, j) => j !== i) })}
              className="rounded-xl p-3 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            <div className="col-span-2"><input className="input" placeholder="a.n. Pemilik" value={r.name} onChange={(e) => setRek(i, { name: e.target.value })} /></div>
          </div>
        ))}
        <button type="button" onClick={() => setForm({ ...form, rekening: [...form.rekening, { bank: '', number: '', name: '' }] })}
          className="btn-outline !py-2 text-xs"><Plus className="h-4 w-4" /> Tambah Rekening</button>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Info Toko</h2>
        <div>
          <label className="label">WhatsApp (format 62xxx)</label>
          <input className="input font-mono" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <div>
          <label className="label">Jam Buka</label>
          <input className="input" value={form.store_hours} onChange={(e) => setForm({ ...form, store_hours: e.target.value })} />
        </div>
        <div>
          <label className="label">Alamat</label>
          <input className="input" value={form.store_address} onChange={(e) => setForm({ ...form, store_address: e.target.value })} />
        </div>
      </div>

      <button disabled={busy} className="btn-primary w-full !py-3 sm:w-auto sm:!px-10">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4" /> {saved ? 'Tersimpan ✓' : 'Simpan Pengaturan'}</>}
      </button>
    </form>
  )
}
