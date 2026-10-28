import { Link } from 'react-router-dom'
import { Flower2, HandHeart, Trophy, Users, ArrowRight } from 'lucide-react'

export default function Tentang() {
  return (
    <div className="container-j py-10 sm:py-14">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="chip bg-brand-100 text-brand-700">Tentang Kami</span>
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900 sm:text-5xl">
            Diperkenalkan: <span className="text-brand-600 italic">Jelita Putra Florist</span>
          </h1>
          <p className="mt-5 leading-relaxed text-stone-600">
            Berlokasi di <b>Jl. Basuki Rahmat No.88, Sindangkasih, Purwakarta</b>, kami telah bertahun-tahun
            merangkai keindahan untuk momen-momen berharga warga Purwakarta dan sekitarnya — dari buket wisuda,
            anniversary, hingga karangan bunga papan untuk pernikahan dan grand opening.
          </p>
          <p className="mt-4 leading-relaxed text-stone-600">
            Setiap tangkai kami pilih segar setiap pagi, dirangkai oleh perangkai berpengalaman, dan
            diantar dengan penuh ketepatan. Bunga segar, hati yang tersentuh — itu jualan kami.
          </p>
          <Link to="/produk" className="btn-primary mt-7">Lihat Koleksi <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="relative">
          <img
            src="https://tokobungapurwakarta.com/storage/galleries/2026-02-04/01KGKG2MCJP7VWP04XS13938NJ.png"
            alt="Jelita Putra Florist"
            className="aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl"
          />
          <div className="card absolute -bottom-6 -left-6 hidden px-6 py-4 sm:block">
            <div className="font-display text-3xl font-bold text-brand-600">80+</div>
            <div className="text-xs text-stone-500">Produk & 70+ karya rangkaian</div>
          </div>
        </div>
      </div>

      <div className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          [Trophy, 'Pengalaman Bertahun-tahun', 'Ratusan acara & ribuan buket telah kami rangkai dengan penuh cinta.'],
          [HandHeart, 'Dirangkai Penuh Perhatian', 'Setiap detail — pita, kartu ucapan, pilihan warna — kami pikirkan khusus untukmu.'],
          [Users, 'Dipercaya Ribuan Pelanggan', 'Ulang-order tinggi berkat kualitas bunga & layanan yang konsisten.'],
        ].map(([Icon, t, d], i) => {
          const I = Icon as typeof Flower2
          return (
            <div key={i} className="card p-8 text-center">
              <span className="mx-auto inline-flex rounded-full bg-brand-100 p-4 text-brand-600"><I className="h-7 w-7" /></span>
              <h3 className="mt-4 font-display text-lg font-bold text-stone-900">{t as string}</h3>
              <p className="mt-2 text-sm text-stone-500">{d as string}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
