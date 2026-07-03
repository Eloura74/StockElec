"use client"

import { useState } from 'react'
import { Lock, User } from 'lucide-react'
import { login } from '@/app/actions/auth'

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
          <span className="text-white text-3xl font-black transform -rotate-3">QE</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Quentin Elec
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Identifiez-vous pour accéder à la plateforme.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Identifiant</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  required
                  name="username"
                  type="text"
                  placeholder="ex: cedricelec ou max"
                  className="block w-full pl-10 rounded-lg border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  required
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="block w-full pl-10 rounded-lg border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Connexion en cours...' : 'Se Connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
