import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import type { Product } from '../../types'

export default function AddToCartListener() {
  const { add } = useCart()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const product = (e as CustomEvent<Product>).detail
      add(product, 1)
      setToast(product.name)
      setTimeout(() => setToast(null), 2200)
    }
    window.addEventListener('jpf_add_cart', handler)
    return () => window.removeEventListener('jpf_add_cart', handler)
  }, [add])

  if (!toast) return null
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-pop">
      <div className="flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-2xl">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <span className="max-w-52 truncate">{toast}</span> ditambahkan
      </div>
    </div>
  )
}
