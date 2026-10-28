import { useState } from 'react'
import { Flower2 } from 'lucide-react'

const IMAGES = [
  '2026-02-10/01KH2YS2QNHFASZD7KJMJHT8R8','2026-02-10/01KH2YS2QV5ZGT0W1HNM0M51AP','2026-02-10/01KH2YS2QY5BWDDS65HK4W5NNF',
  '2026-02-10/01KH2YS2R3BVRH3S476A0NAGQN','2026-02-10/01KH2YS2R9EKVX8V80PM6XWVY1','2026-02-10/01KH2YPGD3YT0KZHB97RQ5T59V',
  '2026-02-10/01KH2YPGD9G4NBJ46NPT88HA83','2026-02-10/01KH2YPGDCAPTYK67MBQ5FF4T4','2026-02-10/01KH2YPGE6PY68AQE8YDZ4DNZ4',
  '2026-02-04/01KGKG2MB96MZXDHZJNN8KNTAZ','2026-02-04/01KGKG2MBQXJSNS5V8JQH1P2C3','2026-02-04/01KGKG2MCJP7VWP04XS13938NJ',
  '2026-02-10/01KH2Y85BGTN9NMDBTHSFASFJK','2026-02-10/01KH2Y85CDWH7JXZQR4R292GGP','2026-02-02/01KGEFZ71M4T0E3QKV5K9QZSJV',
  '2026-02-02/01KGEFZ71T6VDRHVYFRAREMP8B','2026-02-02/01KGEFZ71Y5E04R77FSNTVAZ8D','2026-02-10/01KH2YJNJ6R24H6WD4TP6NEH4F',
  '2026-02-10/01KH2YJNJCB035S5AB6WAJDF32','2026-02-02/01KGEFX9FDKSSVB3N38VMHH27J','2026-02-02/01KGEFX9G1D4R9F0X8YFK42DE',
  '2026-02-02/01KGEFX9GY329JP98SMFKP15TV','2026-02-10/01KH2YH93X765K5KSMH95CJY1C','2026-02-10/01KH2YH942VTQQKXBQH9MFRTPH',
  '2026-01-29/01KG3XF5AHBXQWFQRBDZJ9GQZS','2026-01-29/01KG3XF5BR2MCY0DRHK3XFW0VH','2026-01-29/01KG3XF5C826T8ZWSHSR1MW8MS',
  '2026-02-10/01KH2YM6NEE604CN2100MKJE8G','2026-02-10/01KH2YM6NMZA2R1KA6GJP4S8S6','2026-02-10/01KH2YM6PE1P3YCM8NC8KR5GMV',
  '2026-04-10/01KNTXZQ2ZT49K35HV12FAWSXM','2026-04-10/01KNTXZQ3ECCHYHS1Z8XDFPBGP','2026-04-10/01KNTXZQ3YV9Z4MJF3DB2WXZ6V',
  '2026-02-10/01KH2YF1TP58DVH8FKQS5HYQ4R','2026-02-10/01KH2YF1VKKS985FWBC370PG5N','2026-02-10/01KH2YF1W4Q2M4KKB292QD57WM',
].map((p) => `https://tokobungapurwakarta.com/storage/galleries/${p}.png`)

export default function Galeri() {
  const [zoom, setZoom] = useState<string | null>(null)
  return (
    <div className="container-j py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-5xl">Galeri Karya</h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-500">Percayakan momen spesial Anda pada tangan yang tepat — lihat galeri rangkaian kami.</p>
      </div>
      <div className="mt-12 columns-2 gap-4 sm:columns-3 lg:columns-4">
        {IMAGES.map((src, i) => (
          <button key={i} onClick={() => setZoom(src)} className="group mb-4 block w-full overflow-hidden rounded-2xl">
            <img src={src} alt={`Karya ${i + 1}`} loading="lazy"
              className="w-full object-cover transition duration-700 group-hover:scale-110" />
          </button>
        ))}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Zoom" className="max-h-full max-w-full rounded-2xl shadow-2xl animate-pop" />
          <button className="absolute right-6 top-6 text-2xl text-white/80 hover:text-white" onClick={() => setZoom(null)}>✕</button>
        </div>
      )}
      <div className="mt-12 text-center text-stone-400">
        <Flower2 className="mx-auto h-8 w-8 text-brand-300" />
        <p className="mt-2 text-sm">Ikuti Instagram kami untuk karya terbaru setiap hari.</p>
      </div>
    </div>
  )
}
