import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, Instagram, Facebook, Youtube, ShoppingBag, Heart } from 'lucide-react'
import { useSettings } from '../../lib/hooks'

export default function Footer() {
  const s = useSettings()
  const wa = s?.whatsapp ?? '6281234567890'
  return (
    <footer className="bg-forest text-stone-300">
      <div className="container-j grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 inline-flex rounded-2xl bg-white px-4 py-2.5">
            <img src="/logo.png" alt="Jelita Putra Florist" className="h-8 w-auto" />
          </div>
          <p className="text-sm leading-relaxed text-stone-400">
            Toko bunga terpercaya di Purwakarta sejak bertahun-tahun. Melayani buket segar,
            bunga papan, standing flower & dekorasi acara dengan pengiriman se-Indonesia.
          </p>
          <div className="mt-4 flex gap-2">
            {[Instagram, Facebook, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="rounded-full bg-white/10 p-2.5 transition hover:bg-brand-600 hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg text-white">Jelajahi</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['/', 'Beranda'], ['/produk', 'Produk'], ['/berita', 'Berita'],
              ['/', 'Keranjang'], ['/lacak', 'Lacak Pesanan'], ['/tentang', 'Tentang Kami'],
            ].map(([to, label], i) => (
              <li key={i}>
                <Link to={to} className="transition hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg text-white">Kategori</h4>
          <ul className="space-y-2.5 text-sm">
            {['Fresh Flower Bouquet', 'Artificial Bouquet', 'Bunga Papan', 'Bunga Meja', 'Custom Bouquet', 'Standing Flower'].map((c) => (
              <li key={c}>
                <Link to={`/produk?kategori=${encodeURIComponent(c)}`} className="transition hover:text-white">{c}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-lg text-white">Hubungi Kami</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s?.store_address ?? 'Jl. Basuki Rahmat No.88, Sindangkasih, Purwakarta'}</li>
            <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Setiap hari, {s?.store_hours ?? '07.00 - 21.00 WIB'}</li>
            <li><a href={`https://wa.me/${wa}`} className="flex gap-3 transition hover:text-white"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />WhatsApp: +{wa}</a></li>
          </ul>
          <Link to="/produk" className="btn-gold mt-5 !py-2 text-xs">
            <ShoppingBag className="h-4 w-4" /> Mulai Belanja
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Jelita Putra Florist — Dibuat dengan <Heart className="inline h-3.5 w-3.5 text-brand-400" /> di Purwakarta
      </div>
    </footer>
  )
}
