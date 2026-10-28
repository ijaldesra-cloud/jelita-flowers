import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/site/Navbar'
import Footer from './components/site/Footer'
import FloatingWA from './components/site/FloatingWA'
import AddToCartListener from './components/site/AddToCartListener'
import { isSupabaseConfigured } from './lib/supabase'

// ---- Code splitting: tiap halaman hanya dimuat saat dibuka ----
const Home = lazy(() => import('./pages/Home'))
const Produk = lazy(() => import('./pages/Produk'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Keranjang = lazy(() => import('./pages/Keranjang'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Bayar = lazy(() => import('./pages/Bayar'))
const Lacak = lazy(() => import('./pages/Lacak'))
const Galeri = lazy(() => import('./pages/Galeri'))
const Tentang = lazy(() => import('./pages/Tentang'))
const Kontak = lazy(() => import('./pages/Kontak'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminPesanan = lazy(() => import('./pages/admin/Pesanan'))
const AdminProduk = lazy(() => import('./pages/admin/Produk'))
const AdminKategori = lazy(() => import('./pages/admin/Kategori'))
const AdminBerita = lazy(() => import('./pages/admin/Berita'))
const AdminLaporan = lazy(() => import('./pages/admin/Laporan'))
const AdminPengaturan = lazy(() => import('./pages/admin/Pengaturan'))

// Berita list+detail dalam 1 chunk
const BeritaList = lazy(() => import('./pages/Berita').then((m) => ({ default: m.BeritaList })))
const BeritaDetail = lazy(() => import('./pages/Berita').then((m) => ({ default: m.BeritaDetail })))

/** Skeleton halaman yang halus, muncul saat chunk dimuat */
function PageFallback() {
  return (
    <div className="container-j py-16">
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <div className="mx-auto h-8 w-52 animate-pulse rounded-full bg-stone-200/70" />
        <div className="mx-auto h-4 w-72 animate-pulse rounded-full bg-stone-200/50" />
      </div>
      <div className="mt-10 mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-stone-200/60" />
        ))}
      </div>
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]"><Outlet /></main>
      <Footer />
      <FloatingWA />
      <AddToCartListener />
    </>
  )
}

function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="bg-amber-100 px-4 py-2.5 text-center text-xs font-semibold text-amber-800">
      ⚠️ Kredensial Supabase belum terbaca — jalankan <b>npm run dev</b> dan pastikan .env memuat SUPABASE_URL &amp; SUPABASE_ANON_KEY.
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ConfigBanner />
          <Routes>
            {/* PUBLIC */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Lazy><Home /></Lazy>} />
              <Route path="/produk" element={<Lazy><Produk /></Lazy>} />
              <Route path="/produk/:slug" element={<Lazy><ProductDetail /></Lazy>} />
              <Route path="/keranjang" element={<Lazy><Keranjang /></Lazy>} />
              <Route path="/checkout" element={<Lazy><Checkout /></Lazy>} />
              <Route path="/berita" element={<Lazy><BeritaList /></Lazy>} />
              <Route path="/berita/:slug" element={<Lazy><BeritaDetail /></Lazy>} />
              <Route path="/galeri" element={<Lazy><Galeri /></Lazy>} />
              <Route path="/tentang" element={<Lazy><Tentang /></Lazy>} />
              <Route path="/kontak" element={<Lazy><Kontak /></Lazy>} />
              <Route path="*" element={<Lazy><NotFound /></Lazy>} />
            </Route>
            {/* luar layout publik */}
            <Route path="/bayar/:code" element={<Lazy><><Navbar /><Bayar /><Footer /></></Lazy>} />
            <Route path="/lacak" element={<Lazy><><Navbar /><Lacak /><Footer /></></Lazy>} />
            {/* ADMIN */}
            <Route path="/admin/login" element={<Lazy><><Navbar /><AdminLogin /><Footer /></></Lazy>} />
            <Route path="/admin" element={<Lazy><AdminLayout /></Lazy>}>
              <Route index element={<Lazy><AdminDashboard /></Lazy>} />
              <Route path="pesanan" element={<Lazy><AdminPesanan /></Lazy>} />
              <Route path="produk" element={<Lazy><AdminProduk /></Lazy>} />
              <Route path="kategori" element={<Lazy><AdminKategori /></Lazy>} />
              <Route path="berita" element={<Lazy><AdminBerita /></Lazy>} />
              <Route path="laporan" element={<Lazy><AdminLaporan /></Lazy>} />
              <Route path="pengaturan" element={<Lazy><AdminPengaturan /></Lazy>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
