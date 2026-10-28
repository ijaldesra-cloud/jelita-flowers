import { Link } from 'react-router-dom'
import { Flower2, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-j py-28 text-center">
      <Flower2 className="mx-auto h-14 w-14 text-brand-300" />
      <h1 className="mt-4 font-display text-5xl font-bold text-stone-800">404</h1>
      <p className="mt-2 text-stone-500">Halaman yang kamu cari tidak ditemukan 🌷</p>
      <Link to="/" className="btn-primary mt-8"><ArrowLeft className="h-4 w-4" /> Kembali ke Beranda</Link>
    </div>
  )
}
