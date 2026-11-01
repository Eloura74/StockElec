"use client"

import { Trash2 } from "lucide-react"

export function DeleteUserButton() {
  return (
    <button 
      type="submit" 
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/50 dark:hover:border-rose-900/40 transition-all cursor-pointer" 
      onClick={(e) => {
        if (!window.confirm("Supprimer ce compte ?")) e.preventDefault();
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>Supprimer</span>
    </button>
  )
}
