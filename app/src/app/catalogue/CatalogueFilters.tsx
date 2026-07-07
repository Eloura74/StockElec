"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, FilterX } from "lucide-react"

export function CatalogueFilters({ 
  fournisseurs, 
  categories, 
  totalPages,
  currentPage
}: { 
  fournisseurs: string[], 
  categories: string[],
  totalPages: number,
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Si on change un filtre, on retourne à la page 1
    params.delete('p')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage > 1) {
      params.set('p', newPage.toString())
    } else {
      params.delete('p')
    }
    router.push(`?${params.toString()}`)
  }

  const currentF = searchParams.get('f') || ""
  const currentC = searchParams.get('c') || ""
  const hasFilters = currentF || currentC || searchParams.get('alert')

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('f')
    params.delete('c')
    params.delete('alert')
    params.delete('p')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-3">
        <select 
          value={currentF}
          onChange={(e) => handleFilterChange('f', e.target.value)}
          className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
        >
          <option value="">Tous les fournisseurs</option>
          {fournisseurs.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select 
          value={currentC}
          onChange={(e) => handleFilterChange('c', e.target.value)}
          className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <FilterX className="w-4 h-4" /> Réinitialiser
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-zinc-400">
            Page {currentPage} sur {totalPages}
          </span>
          <div className="flex rounded-lg shadow-sm">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 disabled:opacity-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 disabled:opacity-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
