"use client"

import { useState, Suspense } from 'react'
import { Lock, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resetPasswordWithToken } from '@/app/actions/auth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setIsPending(true)

    const res = await resetPasswordWithToken(token, password)
    if (res?.error) {
      setError(res.error)
    } else if (res?.message) {
      setMessage(res.message)
    }
    setIsPending(false)
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-4 rounded-lg text-sm font-medium mb-6">
          Lien de réinitialisation invalide. Veuillez en demander un nouveau.
        </div>
        <Link 
          href="/mot-de-passe-oublie"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  return (
    <>
      {message ? (
        <div className="text-center">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-4 rounded-lg text-sm font-medium mb-6 flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            {message}
          </div>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Se connecter
          </Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Nouveau mot de passe</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={3}
                className="block w-full pl-10 rounded-lg border-gray-300 dark:border-zinc-700 px-4 py-3 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Confirmer le mot de passe</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
              </div>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={3}
                className="block w-full pl-10 rounded-lg border-gray-300 dark:border-zinc-700 px-4 py-3 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            {isPending ? 'Mise à jour...' : 'Définir le nouveau mot de passe'}
          </button>

          <div className="text-center">
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
          <span className="text-white text-3xl font-black transform -rotate-3">QE</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-zinc-50">
          Nouveau mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-300">
          Définissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-zinc-800">
          <Suspense fallback={
            <div className="text-center text-gray-500 dark:text-zinc-400 py-4">
              Chargement...
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
