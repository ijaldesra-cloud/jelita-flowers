import { Clock, MapPin, Phone, Wallet, MessageCircle } from 'lucide-react'
import { useSettings } from '../lib/hooks'

export default function Kontak() {
  const s = useSettings()
  const wa = s?.whatsapp ?? '6281234567890'
  return (
    <div className="container-j py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-5xl">Hubungi Kami</h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-500">Siap membantu kebutuhan bunga Anda setiap hari. Datang langsung atau chat saja!</p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            [MapPin, 'Alamat Toko', s?.store_address ?? 'Jl. Basuki Rahmat No.88, Sindangkasih, Purwakarta'],
            [Clock, 'Jam Buka', `Setiap hari, ${s?.store_hours ?? '07.00 - 21.00 WIB'}`],
            [Phone, 'WhatsApp / Telepon', `+${wa}`],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof MapPin
            return (
              <div key={i} className="card flex items-start gap-4 p-6">
                <span className="rounded-2xl bg-brand-100 p-3 text-brand-600"><I className="h-6 w-6" /></span>
                <div>
                  <div className="font-bold text-stone-800">{t as string}</div>
                  <div className="mt-1 text-sm text-stone-500">{d as string}</div>
                </div>
              </div>
            )
          })}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-gold/20 p-3 text-forest"><Wallet className="h-6 w-6" /></span>
              <div className="w-full">
                <div className="font-bold text-stone-800">Rekening Transfer Resmi</div>
                <p className="mt-1 text-xs text-stone-400">Hanya transfer ke rekening di bawah ya, hati-hati penipuan 🙏</p>
                <div className="mt-3 space-y-2">
                  {(s?.rekening ?? []).map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                      <b className="text-stone-700">{r.bank}</b>
                      <span className="font-mono">{r.number}</span>
                      <span className="text-stone-500">{r.name}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-stone-400">Pembayaran dilakukan via transfer bank, lalu unggah foto bukti transfer langsung dari halaman checkout.</p>
              </div>
            </div>
          </div>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo Jelita Putra Florist 🌹')}`}
            target="_blank" rel="noreferrer"
            className="btn flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-4 font-bold text-white hover:brightness-105"
          >
            <MessageCircle className="h-5 w-5" /> Chat WhatsApp Sekarang
          </a>
        </div>
        <div className="min-h-[420px] overflow-hidden rounded-[2rem] shadow-lg ring-1 ring-stone-900/5">
          <iframe
            title="Lokasi Jelita Putra Florist"
            src="https://www.google.com/maps?q=Jl.%20Basuki%20Rahmat%20No.88%20Sindangkasih%20Purwakarta&output=embed"
            className="h-full w-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
