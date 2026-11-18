"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function MouvementsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const start = searchParams.get('start') || ""
  const end = searchParams.get('end') || ""

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('start')
    params.delete('end')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white dark:bg-[#111622] p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs text-xs overflow-hidden max-w-full">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 min-w-0 w-full">
        <div className="flex items-center gap-1.5 min-w-0 bg-slate-50 dark:bg-[#161d2d] px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
          <label className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] shrink-0">Du</label>
          <input 
            type="date" 
            value={start}
            onChange={(e) => handleFilterChange('start', e.target.value)}
            className="w-full min-w-0 bg-transparent border-0 text-slate-900 dark:text-white p-0 text-xs focus:ring-0 font-medium"
          />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 bg-slate-50 dark:bg-[#161d2d] px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
          <label className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] shrink-0">Au</label>
          <input 
            type="date" 
            value={end}
            onChange={(e) => handleFilterChange('end', e.target.value)}
            className="w-full min-w-0 bg-transparent border-0 text-slate-900 dark:text-white p-0 text-xs focus:ring-0 font-medium"
          />
        </div>
      </div>
      {(start || end) && (
        <button 
          onClick={clearFilters}
          className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1.5 rounded-xl font-bold transition-colors text-center shrink-0 cursor-pointer text-xs"
        >
          Effacer filtre
        </button>
      )}
    </div>
  )
}
