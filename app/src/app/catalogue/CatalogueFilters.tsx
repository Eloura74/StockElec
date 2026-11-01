"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, FilterX } from "lucide-react"

export function CatalogueFilters({ 
  fournisseurs, 
  categories, 
  totalPages,
  currentPage,
  totalCatalogue,
  totalEnStock,
  totalAlertes,
}: { 
  fournisseurs: string[], 
  categories: string[],
  totalPages: number,
  currentPage: number,
  totalCatalogue?: number,
  totalEnStock?: number,
  totalAlertes?: number,
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

  const setStatusFilter = (status: 'all' | 'in_stock' | 'alert') => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('p')
    if (status === 'in_stock') {
      params.set('stock', 'in_stock')
      params.delete('alert')
    } else if (status === 'alert') {
      params.set('alert', 'true')
      params.delete('stock')
    } else {
      params.delete('stock')
      params.delete('alert')
    }
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
  const currentStock = searchParams.get('stock') || ""
  const currentAlert = searchParams.get('alert') || ""
  const hasFilters = currentF || currentC || currentAlert || currentStock

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('f')
    params.delete('c')
    params.delete('alert')
    params.delete('stock')
    params.delete('p')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border dark:border-zinc-800">
      {/* Filtres rapides par état de stock */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !currentStock && !currentAlert
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
          }`}
        >
          Tous les articles {totalCatalogue !== undefined && `(${totalCatalogue.toLocaleString('fr-FR')})`}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in_stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentStock === 'in_stock'
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/40"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          En stock physique {totalEnStock !== undefined && `(${totalEnStock.toLocaleString('fr-FR')})`}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('alert')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentAlert === 'true'
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/40"
          }`}
        >
          En alerte {totalAlertes !== undefined && `(${totalAlertes.toLocaleString('fr-FR')})`}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
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
            <button onClick={clearFilters} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer">
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
    </div>
  )
}
