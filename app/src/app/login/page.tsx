"use client"

import { useState } from 'react'
import { Lock, User, Zap, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await login(formData)
    if (res?.error) {
      setError(res.error)
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-50 dark:bg-[#0b0f17] selection:bg-blue-600/15 selection:text-blue-900 dark:selection:text-blue-200">
      
      {/* Sélecteur de mode en haut à droite */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <ThemeToggle variant="segmented" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Haut de Gamme */}
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md mx-auto mb-4">
          <Zap className="h-7 w-7 fill-white" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            StockElec
          </h1>
          <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            Pro
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Plateforme de pilotage et gestion • Quentin Électricité
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-xl dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <form className="space-y-4.5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Identifiant
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  required
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="ex: quentin ou cedricelec"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-[#161d2d] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe
                </label>
                <Link 
                  href="/mot-de-passe-oublie"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  Oublié ?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  required
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-[#161d2d] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white dark:text-slate-950 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 shadow-sm disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Accès réservé et protégé • Quentin Électricité</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
