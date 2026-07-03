"use client"

import { Trash2 } from "lucide-react"

export function DeleteUserButton() {
  return (
    <button 
      type="submit" 
      className="text-red-600 hover:text-red-900 flex items-center justify-end gap-1 w-full" 
      onClick={(e) => {
        if(!window.confirm("Supprimer ce compte ?")) e.preventDefault();
      }}
    >
      <Trash2 className="w-4 h-4" /> Supprimer
    </button>
  )
}
