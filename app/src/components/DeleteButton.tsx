"use client"

import { Trash2 } from "lucide-react"

export function DeleteButton({ message }: { message: string }) {
  return (
    <button 
      type="submit" 
      title="Supprimer" 
      aria-label="Supprimer"
      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/50 dark:hover:border-rose-900/40 transition-all duration-150 active:scale-95 cursor-pointer" 
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault()
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
