// ================================================================
// UJI E2E ALUR PEMBELIAN JELITA PUTRA FLORIST
// Meniru tepat operasi yang dilakukan aplikasi di browser:
//  1. Pelanggan: lihat produk -> insert orders (anon) + items
//  2. Trigger DB: notifikasi ke staff (realtime)
//  3. Pelanggan: upload foto bukti ke Storage + insert payments (anon)
//  4. Trigger: status pesanan -> menunggu_verifikasi + notifikasi
//  5. Admin: verifikasi bukti -> status diproses + notifikasi
// Lalu dibersihkan (hapus data uji + file storage).
// Jalankan:  node scripts/e2e-check.mjs
// ================================================================
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

let url = '', anon = '', serviceKey = ''
for (const file of ['.env', '.env.local', '.env.akses-supabase']) {
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/)
    if (!m) continue
    if (!url && /^(SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL|VITE_SUPABASE_URL)$/i.test(m[1])) url = m[2]
    if (!anon && /^(SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|VITE_SUPABASE_ANON_KEY|SUPABASE_KEY)$/i.test(m[1])) anon = m[2]
    if (!serviceKey && /^(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY)$/i.test(m[1])) serviceKey = m[2]
  }
}
if (!url || !anon) { console.error('❌ .env tidak memuat kredensial'); process.exit(1) }

const guest = createClient(url, anon)
const svc = serviceKey ? createClient(url, serviceKey) : null
const CODE = `JPF-E2E-${Date.now().toString().slice(-6)}`
const results = []
const ok = (step, pass, info = '') => {
  results.push(pass)
  console.log(`${pass ? '✅' : '❌'} ${step}${info ? ' — ' + info : ''}`)
}

// ---------- 1. Pelanggan melihat produk & pengaturan ----------
const { data: products } = await guest.from('products').select('id, name, price').eq('is_active', true).limit(1)
ok('Katalog produk terbaca (anon)', Array.isArray(products) && products.length > 0, products?.[0]?.name)
const product = products?.[0]

const { data: settings } = await guest.from('settings').select('rekening').eq('id', 1).maybeSingle()
ok('Rekening transfer tampil (anon)', !!settings?.rekening?.length, `${settings?.rekening?.length} rekening`)

// ---------- 2. Realtime notifikasi (channel staff) ----------
let gotRealtime = false
let unsub = () => {}
if (svc) {
  await new Promise((resolve) => {
    const ch = svc.channel('e2e-test').on(
      'postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
      () => { gotRealtime = true; resolve() }
    ).subscribe((s) => { if (s === 'SUBSCRIBED') resolve() })
    unsub = () => ch.unsubscribe()
  })
}

// ---------- 3. Checkout: insert pesanan + item (anon) ----------
const total = Number(product.price) * 2
const ins = await guest.from('orders').insert({
  code: CODE, customer_name: 'Uji Alur', customer_phone: '081234567890',
  customer_address: 'Jl. E2E Test No.1, Purwakarta', delivery_date: new Date().toISOString().slice(0, 10),
  delivery_note: 'kartu: Selamat Uji Coba', subtotal: total, shipping_fee: 0, total, status: 'pending',
}).select().single()
ok('Checkout: pesanan dibuat (anon)', !ins.error, `${CODE} — total Rp ${total.toLocaleString('id-ID')}`)
const orderId = ins.data?.id

const put = await guest.from('order_items').insert({
  order_id: orderId, product_id: product.id, product_name: product.name, price: product.price, qty: 2,
})
ok('Item pesanan tersimpan', !put.error)

// ---------- 4. Notifikasi "Pesanan baru" ----------
await new Promise((r) => setTimeout(r, 1500))
const { data: notifOrder } = await svc.from('notifications').select('*').eq('order_code', CODE)
ok('🔔 Notifikasi "Pesanan baru masuk" dibuat trigger', !!notifOrder?.length, notifOrder?.[0]?.message)
ok('📡 Realtime menerima notifikasi (persis seperti di dashboard admin)', gotRealtime)
unsub()

// ---------- 5. Pelanggan upload bukti transfer (tanpa login!) ----------
const png = await (async () => {
  // buat gambar bukti transfer lewat sharp (sudah terpasang)
  const sharp = (await import('sharp')).default
  return sharp({ create: { width: 420, height: 260, channels: 3, background: '#f5f0e8' } })
    .composite([{ input: Buffer.from(`<svg width="420" height="260"><text x="30" y="120" font-size="26" font-weight="bold" fill="#8e1537">BUKTI TRANSFER (img uji)</text><text x="30" y="160" font-size="18" fill="#333">${CODE} — Rp ${total.toLocaleString('id-ID')}</text></svg>`), top: 0, left: 0 }])
    .png().toBuffer()
})()
const proofPath = `${CODE}/bukti_uji.png`
const up = await guest.storage.from('payments').upload(proofPath, png, { contentType: 'image/png' })
ok('Upload foto bukti ke Storage anonim', !up.error, up.error ? up.error.message : proofPath)
const { data: pub } = guest.storage.from('payments').getPublicUrl(proofPath)

const pay = await guest.from('payments').insert({
  order_id: orderId, bank_pengirim: 'BANK-UJI', nama_pengirim: 'Fraud Test Bro',
  transfer_time: new Date().toISOString(), transfer_amount: total, proof_url: pub.publicUrl, status: 'menunggu',
}).select().single()
ok('Form bukti transfer tersimpan (bank, nama, jam, nominal)', !pay.error)

// ---------- 6. Trigger ubah status otomatis ----------
await new Promise((r) => setTimeout(r, 1500))
const { data: o1 } = await guest.from('orders').select('status').eq('code', CODE).maybeSingle()
ok('Status pesanan otomatis → menunggu_verifikasi', o1?.status === 'menunggu_verifikasi', `status: ${o1?.status}`)

const { data: notifProof } = await svc.from('notifications').select('*').eq('order_code', CODE).order('created_at')
ok('🔔 Notifikasi "Bukti transfer diterima"', (notifProof ?? []).some((n) => n.type === 'bukti_transfer'))

// ---------- 7. Admin memverifikasi bukti ----------
if (svc) {
  const upd = await svc.from('payments').update({ status: 'terverifikasi', note: 'Sesuai, terverifikasi' }).eq('id', pay.data.id)
  ok('Admin verifikasi bukti', !upd.error)
  await new Promise((r) => setTimeout(r, 1500))
  const { data: o2 } = await guest.from('orders').select('status').eq('code', CODE).maybeSingle()
  ok('Status pesanan otomatis → diproses', o2?.status === 'diproses', `status: ${o2?.status}`)
  const { data: nv } = await svc.from('notifications').select('*').eq('order_code', CODE)
  ok('🔔 Notifikasi "Transfer diverifikasi"', (nv ?? []).some((n) => n.type === 'verifikasi'))
}

// ---------- 8. PEMBERSIHAN data uji ----------
if (svc) {
  await svc.from('orders').delete().eq('id', orderId)
  await svc.from('notifications').delete().eq('order_code', CODE)
  const rm = await svc.storage.from('payments').remove([proofPath])
  console.log(`🧹 Dibersihkan: pesanan, notifikasi, file bukti (${rm.error ? 'file: ' + rm.error.message : 'terhapus'})`)
}

const totalFail = results.filter((r) => !r).length
console.log(`\n${totalFail === 0 ? '🎉 E2E LULUS SEMUA (' + results.length + ' langkah)' : '⚠️ ' + totalFail + ' langkah gagal dari ' + results.length}`)
process.exit(totalFail === 0 ? 0 : 1)
