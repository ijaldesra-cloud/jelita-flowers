import { MessageCircle } from 'lucide-react'
import { useSettings } from '../../lib/hooks'

export default function FloatingWA() {
  const phone = useSettings()?.whatsapp ?? '6281234567890'
  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent('Halo Jelita Putra Florist, saya mau tanya-tanya 🌹')}`}
      target="_blank"
      rel="noreferrer"
      className="floating-wa fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3.5 font-bold text-white shadow-2xl shadow-emerald-900/30 transition hover:scale-105"
      aria-label="Chat WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-white/20" />
      <span className="hidden text-sm sm:inline">Chat Kami</span>
    </a>
  )
}
