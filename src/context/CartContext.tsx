import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'

interface CartState {
  items: CartItem[]
  count: number
  subtotal: number
  add: (p: Product, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const CartCtx = createContext<CartState>({
  items: [],
  count: 0,
  subtotal: 0,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
})

export const useCart = () => useContext(CartCtx)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('jpf_cart') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('jpf_cart', JSON.stringify(items))
  }, [items])

  const add = (p: Product, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === p.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      return [...prev, { product: p, qty }]
    })
  }

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id))
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)))
  const clear = () => setItems([])

  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartCtx.Provider value={{ items, count, subtotal, add, remove, setQty, clear }}>
      {children}
    </CartCtx.Provider>
  )
}
