/* Jelita Putra Florist — Service Worker */
const CACHE = 'jpf-v2'
const PRECACHE = [
  '/',
  '/index.html',
  '/hero.webp',
  '/manifest.webmanifest',
  '/logo.png',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // satu file gagal jangan sampai membatalkan seluruh instalasi
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Hanya simpan respons yang benar-benar sukses (jangan cache 404/500)
function putIfOk(request, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
  }
}

self.addEventListener('fetch', (e) => {
  const request = e.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Navigasi halaman (termasuk refresh di /produk/xxx): network-first,
  // fallback ke index.html yang tersimpan supaya tidak muncul 404/blank.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          putIfOk(request, res)
          return res
        })
        .catch(async () => {
          const hit = await caches.match(request)
          if (hit) return hit
          const shell = await caches.match('/index.html')
          if (shell) return shell
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font-family:system-ui;padding:40px;text-align:center">Kamu sedang offline. Sambungkan internet lalu muat ulang halaman ini.</body>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        })
    )
    return
  }

  // API Supabase & data dinamis: selalu ambil terbaru, tanpa cache
  if (url.hostname.includes('supabase')) return

  // Aset statis & gambar: cache-first
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          putIfOk(request, res)
          return res
        })
    )
  )
})

// Notifikasi Web Push (opsional, dipakai saat tab berjalan)
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/admin'))
})
