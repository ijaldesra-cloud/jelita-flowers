// Buat akun login admin & owner secara otomatis.
// Butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di file .env (service key ditemukan di Supabase > Settings > API).
// Jalankan:  node scripts/create-users.mjs owner@jelitaputra.id OwnerJelita123! admin@jelitaputra.id AdminJelita123!
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

let url = '', serviceKey = ''
for (const file of ['.env', '.env.local', '.env.akses-supabase']) {
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/)
    if (!m) continue
    if (!url && /^(SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL|VITE_SUPABASE_URL|SUPABASE_PROJECT_URL)$/i.test(m[1])) url = m[2]
    if (!serviceKey && /^(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY)$/i.test(m[1])) serviceKey = m[2]
  }
}
if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di file .env.')
  console.error('   Alternatif manual: Dashboard Supabase > Authentication > Add user, lalu jalankan di SQL Editor:')
  console.error("   update public.profiles set role='owner' where id='<USER_ID>';")
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const [ownerEmail, ownerPass, adminEmail, adminPass] = process.argv.slice(2)
const accounts = [
  [ownerEmail || 'owner@jelitaputra.id', ownerPass || 'OwnerJelita123!', 'owner'],
  [adminEmail || 'admin@jelitaputra.id', adminPass || 'AdminJelita123!', 'admin'],
]

for (const [email, password, role] of accounts) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) {
    console.error(`❌ ${email}: ${error.message}`)
    continue
  }
  await sb.from('profiles').upsert({ id: data.user.id, full_name: role === 'owner' ? 'Owner Jelita' : 'Admin Jelita', role })
  console.log(`✅ ${email} dibuat sebagai ${role} — password: ${password}`)
}
