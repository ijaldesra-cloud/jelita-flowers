import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flower2, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { signIn, isAdmin } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const error = await signIn(email.trim(), password)
    if (error) setErr(error)
    setBusy(false)
  }

  useEffect(() => { if (isAdmin) nav('/admin', { replace: true }) }, [isAdmin])

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Toko
        </Link>
        <div className="card animate-pop p-8">
          <div className="text-center">
            <span className="mx-auto inline-flex rounded-full bg-brand-100 p-4 text-brand-600"><Flower2 className="h-8 w-8" /></span>
            <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Login Staff</h1>
            <p className="mt-1 text-sm text-stone-500">Panel Admin & Owner Jelita Putra Florist</p>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input className="input !pl-11" type="email" placeholder="email@jelitaflorist.id" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input className="input !pl-11" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{err}</p>}
            <button className="btn-primary w-full !py-3" disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
