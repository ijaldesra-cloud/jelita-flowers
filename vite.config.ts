import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Ambil kredensial Supabase dari file .env apa pun di root proyek
// (mendukung berbagai penamaan: VITE_SUPABASE_URL, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, dst)
function readDotFiles() {
  const aliases: Record<string, string[]> = {
    url: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_PROJECT_URL'],
    key: ['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_KEY'],
    serviceKey: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'],
  }
  const found: Record<string, string> = {}
  for (const file of ['.env', '.env.local', '.env.akses-supabase']) {
    const p = path.resolve(__dirname, file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/)
      if (!m) continue
      for (const [k, list] of Object.entries(aliases)) {
        if (list.includes(m[1]) && !found[k]) found[k] = m[2]
      }
    }
  }
  return found
}

const env = readDotFiles()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    '__SUPA_URL__': JSON.stringify(env.url ?? ''),
    '__SUPA_KEY__': JSON.stringify(env.key ?? ''),
    '__SUPA_SERVICE_KEY__': JSON.stringify(env.serviceKey ?? ''),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('node_modules/react-router')) return 'router'
        },
      },
    },
  },
})
