"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, FilterX, Layers, CheckCircle2, AlertTriangle, Building2, Tag } from "lucide-react"

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
  const hasFilters = Boolean(currentF || currentC || currentAlert || currentStock)

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
    <div className="space-y-4 p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs">
      {/* 1. Onglets de filtrage par statut de stock (Segmented Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.06] shadow-inner gap-1">
          {/* Tous */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !currentStock && !currentAlert
                ? "bg-white text-slate-900 dark:bg-white dark:text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Tous les articles</span>
            {totalCatalogue !== undefined && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                !currentStock && !currentAlert 
                  ? "bg-slate-100 dark:bg-slate-200 text-slate-800" 
                  : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
              }`}>
                {totalCatalogue.toLocaleString('fr-FR')}
              </span>
            )}
          </button>

          {/* En stock physique */}
          <button
            type="button"
            onClick={() => setStatusFilter('in_stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentStock === 'in_stock'
                ? "bg-emerald-600 text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>En stock physique</span>
            {totalEnStock !== undefined && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md font-bold ${
                currentStock === 'in_stock'
                  ? "bg-emerald-700/80 text-white"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
              }`}>
                {totalEnStock.toLocaleString('fr-FR')}
              </span>
            )}
          </button>

          {/* En alerte */}
          <button
            type="button"
            onClick={() => setStatusFilter('alert')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentAlert === 'true'
                ? "bg-rose-600 text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${currentAlert === 'true' ? 'text-white' : 'text-amber-500'}`} />
            <span>En alerte</span>
            {totalAlertes !== undefined && totalAlertes > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md font-bold ${
                currentAlert === 'true'
                  ? "bg-rose-700 text-white"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
              }`}>
                {totalAlertes.toLocaleString('fr-FR')}
              </span>
            )}
          </button>
        </div>

        {/* Bouton reset filtres */}
        {hasFilters && (
          <button 
            type="button"
            onClick={clearFilters} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Effacer les filtres</span>
          </button>
        )}
      </div>

      {/* 2. Filtres déroulants et pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Fournisseur */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <select 
              value={currentF}
              onChange={(e) => handleFilterChange('f', e.target.value)}
              className="pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Catégorie */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Tag className="h-3.5 w-3.5" />
            </div>
            <select 
              value={currentC}
              onChange={(e) => handleFilterChange('c', e.target.value)}
              className="pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Pagination compacte & élégante */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> sur {totalPages}
            </span>
            <div className="inline-flex rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161d2d] shadow-2xs overflow-hidden">
              <button 
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Page précédente"
                className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer border-r border-slate-100 dark:border-white/[0.06]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Page suivante"
                className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer"
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
