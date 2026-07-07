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
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border dark:border-zinc-800 shadow-sm text-sm">
      <div className="flex items-center gap-2">
        <label className="text-gray-500 dark:text-zinc-400 font-medium">Du</label>
        <input 
          type="date" 
          value={start}
          onChange={(e) => handleFilterChange('start', e.target.value)}
          className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-500 dark:text-zinc-400 font-medium">Au</label>
        <input 
          type="date" 
          value={end}
          onChange={(e) => handleFilterChange('end', e.target.value)}
          className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {(start || end) && (
        <button 
          onClick={clearFilters}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
        >
          Effacer
        </button>
      )}
    </div>
  )
}
