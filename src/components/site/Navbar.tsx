import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, Flower2, Lock, Speaker } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/produk', label: 'Produk' },
  { to: '/berita', label: 'Berita' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/tentang', label: 'Tentang' },
  { to: '/kontak', label: 'Kontak' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { count } = useCart()
  const nav = useNavigate()
  const logoTaps = useRef<number[]>([])

  // Pintu rahasia: klik logo 3x < 1.5 detik → ke admin
  const logoClick = () => {
    const now = Date.now()
    logoTaps.current = [...logoTaps.current, now].filter((t) => now - t < 1500)
    if (logoTaps.current.length >= 3) {
      logoTaps.current = []
      nav('/admin')
    }
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-stone-900/5">
      <div className="container-j flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={logoClick} className="flex items-center gap-3 select-none" onKeyDown={e => { if (e.key === 'Enter' && e.shiftKey) nav('/admin') }}>
          <img src="/logo.png" alt="Jelita Putra Florist" className="h-9 w-auto cursor-pointer" />
          <span
            aria-label="Akses admin"
            title="Akses admin"
            className="hidden opacity-0 transition-opacity duration-300 hover:opacity-100 sm:block"
          >
            <Link to="/admin" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200/60 text-stone-500">
              <Lock className="h-4 w-4" />
            </Link>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-brand-50 hover:text-brand-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Keranjang"
            onClick={() => nav('/keranjang')}
            className="relative rounded-full p-2.5 text-stone-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            id="sound-toggle"
            aria-label="Aktifkan suara notifikasi"
            data-on="on"
            onClick={() => {
              const sb = document.getElementById('sound-toggle') as HTMLButtonElement
              const next = sb!.getAttribute('data-on') !== 'off'
              sb!.setAttribute('data-on', next ? 'on' : 'off')
              sb!.setAttribute('aria-label', next ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi')
              localStorage.setItem('jpf_sound', next ? 'on' : 'off')
            }}
            className="relative rounded-full p-2.5 text-stone-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Speaker className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            id="sound-toggle-mobile"
            aria-label="Aktifkan suara notifikasi"
            data-on="on"
            onClick={() => {
              const sb = document.getElementById('sound-toggle-mobile') as HTMLButtonElement
              const next = sb!.getAttribute('data-on') !== 'off'
              sb!.setAttribute('data-on', next ? 'on' : 'off')
              sb!.setAttribute('aria-label', next ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi')
              localStorage.setItem('jpf_sound', next ? 'on' : 'off')
            }}
            className="rounded-full p-2.5 text-stone-700 hover:bg-brand-50 lg:hidden"
          >
            <Speaker className="h-5 w-5" />
          </button>

          <button
            className="rounded-full p-2.5 text-stone-700 hover:bg-brand-50 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-stone-900/5 bg-ivory px-4 py-3 lg:hidden animate-pop">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  isActive ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-brand-50'
                }`
              }
            >
              <span className="inline-flex items-center gap-2"><Flower2 className="h-4 w-4 opacity-60" />{l.label}</span>
            </NavLink>
          ))}

        </nav>
      )}
    </header>
  )
}
