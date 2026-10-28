export const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  menunggu_verifikasi: 'Verifikasi Bukti',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

export const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  menunggu_verifikasi: 'bg-sky-100 text-sky-700',
  diproses: 'bg-violet-100 text-violet-700',
  dikirim: 'bg-indigo-100 text-indigo-700',
  selesai: 'bg-emerald-100 text-emerald-700',
  dibatalkan: 'bg-red-100 text-red-600',
}

export const ALL_STATUSES = ['pending', 'menunggu_verifikasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan']
