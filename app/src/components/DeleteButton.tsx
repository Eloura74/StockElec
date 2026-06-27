"use client"

import { Trash2 } from "lucide-react"

export function DeleteButton({ message }: { message: string }) {
  return (
    <button 
      type="submit" 
      title="Supprimer" 
      className="rounded p-1 text-red-500 hover:bg-red-50" 
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
