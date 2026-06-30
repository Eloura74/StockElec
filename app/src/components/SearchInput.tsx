"use client"

import { Search, X } from "lucide-react"
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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${isPending ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
        placeholder="Chercher un article, une référence..."
      />
      {query && (
        <button 
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
