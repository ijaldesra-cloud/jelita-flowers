export type StaffRole = 'admin' | 'owner'

export interface Profile {
  id: string
  full_name: string
  role: StaffRole
  created_at?: string
}

export interface Category {
  id: number
  slug: string
  name: string
  image_url: string
}

export interface Product {
  id: string
  name: string
  slug: string
  category_id: number | null
  price: number
  old_price: number | null
  description: string
  image_url: string
  is_active: boolean
  is_featured: boolean
  stock: number
  created_at?: string
  categories?: { name: string; slug: string } | null
}

export interface CartItem {
  product: Product
  qty: number
}

export type OrderStatus =
  | 'pending'
  | 'menunggu_verifikasi'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'dibatalkan'

export interface Order {
  id: string
  code: string
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_date: string
  delivery_note: string
  subtotal: number
  shipping_fee: number
  total: number
  status: OrderStatus
  created_at: string
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  price: number
  qty: number
}

export interface Payment {
  id: string
  order_id: string
  bank_pengirim: string
  nama_pengirim: string
  transfer_time: string | null
  transfer_amount: number
  proof_url: string
  status: 'menunggu' | 'terverifikasi' | 'ditolak'
  note: string
  created_at: string
}

export interface Notification {
  id: string
  type: 'order' | 'bukti_transfer' | 'verifikasi' | 'produk' | 'sistem'
  title: string
  message: string
  order_code: string | null
  is_read: boolean
  created_at: string
}

export interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image_url: string
  published_at: string
}

export interface Rekening {
  bank: string
  number: string
  name: string
}

export interface Settings {
  id: number
  rekening: Rekening[]
  whatsapp: string
  store_hours: string
  store_address: string
}
