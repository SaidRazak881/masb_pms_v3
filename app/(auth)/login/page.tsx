'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, LogIn, Loader2, AlertCircle, ShieldCheck, BarChart3, GraduationCap } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      location.href = '/dashboard'
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-950">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-700/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-700/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative">
          <img src="/mimos-academy-logo-white.svg" alt="MIMOS Academy" className="h-14 w-auto" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Sistem Pengurusan Program
          </p>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
            Kawalan Eksekutif <span className="text-blue-400">R1 · R2 · R3</span> dalam satu platform.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Pengurusan korporat bertaraf enterprise untuk penyata pendapatan (R1), pelaksanaan
            latihan (R2), dan corong peluang jualan (R3) MIMOS Academy.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: BarChart3, label: 'Bento Executive Dashboard bersepadu' },
              { icon: ShieldCheck, label: 'Kawalan akses berasaskan peranan (RBAC)' },
              { icon: GraduationCap, label: 'Garis masa Program 360° interaktif' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-blue-300 ring-1 ring-slate-700/60">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-slate-300">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© 2026 MIMOS Academy · Enterprise PMS v1.0.3</p>
      </aside>

      <section className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex items-center gap-3 lg:hidden">
              <img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-10 w-10 rounded-lg shadow-md" />
              <div>
                <p className="text-sm font-bold text-slate-900">MIMOS Academy</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">PMS · Enterprise R1/R2/R3</p>
              </div>
            </div>

            <img src="/mimos-academy-logo.svg" alt="MIMOS Academy" className="hidden h-12 w-auto lg:block" />
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Log Masuk</h2>
            <p className="mt-1 text-sm text-slate-500">Akses sistem pengurusan R1/R2/R3 dengan akaun rasmi anda.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Alamat E-mel</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@mimos.my"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Kata Laluan</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
                </div>
              </label>

              {error ? (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Log Masuk…</span></> : <><LogIn className="h-4 w-4" /><span>Log Masuk</span></>}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 lg:text-slate-400">
            Akses tertakluk kepada dasar keselamatan &amp; kawalan peranan (RBAC) MIMOS Academy.
          </p>
        </div>
      </section>
    </main>
  )
}
