'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

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
    if (error) setError(error.message)
    else location.href = '/dashboard'
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[620px] flex-col justify-between bg-slate-950 p-10 lg:flex">
          <Image src="/mimos-academy-logo-white.svg" alt="MIMOS Academy" width={360} height={84} priority className="h-auto w-[280px]" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-fuchsia-300">Program Management System</p>
            <h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight text-white">Urus keseluruhan lifecycle program dalam satu pandangan.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">Platform bersepadu MIMOS Academy untuk R1 kewangan, R2 latihan dan R3 pipeline jualan.</p>
          </div>
          <p className="text-xs text-slate-500">MIMOS Academy PMS · R1 / R2 / R3</p>
        </section>

        <section className="flex min-h-[620px] items-center bg-slate-50 p-7 sm:p-10">
          <form onSubmit={submit} className="w-full max-w-md mx-auto">
            <div className="lg:hidden mb-8">
              <Image src="/mimos-academy-logo.svg" alt="MIMOS Academy" width={360} height={84} priority className="h-auto w-[230px]" />
            </div>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700">Secure access</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Selamat datang</h2>
              <p className="mt-2 text-sm text-slate-500">Log masuk ke Sistem Pengurusan Program MIMOS Academy.</p>
            </div>

            <label className="text-sm font-semibold text-slate-700">
              Email
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 mb-5 w-full rounded-xl border border-slate-300 bg-white p-3.5 outline-none transition focus:border-fuchsia-600 focus:ring-4 focus:ring-fuchsia-100" autoComplete="email" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Password
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 mb-5 w-full rounded-xl border border-slate-300 bg-white p-3.5 outline-none transition focus:border-fuchsia-600 focus:ring-4 focus:ring-fuchsia-100" autoComplete="current-password" />
            </label>
            {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            <button disabled={loading} className="w-full rounded-xl bg-[#8E1B84] p-3.5 font-semibold text-white shadow-sm transition hover:bg-[#74166c] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="mt-6 text-center text-xs text-slate-400">Akses dikawal oleh Supabase Auth dan RBAC.</p>
          </form>
        </section>
      </div>
    </main>
  )
}
