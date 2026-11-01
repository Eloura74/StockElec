"use client"

import { Search, X, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get("q") || ""
  
  const [query, setQuery] = useState(currentQuery)
  const [isPending, startTransition] = useTransition()

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        if (query) {
          router.push(`/catalogue?q=${encodeURIComponent(query)}`)
        } else {
          router.push(`/catalogue`)
        }
      })
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, router])

  return (
    <div className="relative w-full md:max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        {isPending ? (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        placeholder="Chercher un article, une référence..."
      />
      {query && (
        <button 
          type="button"
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
