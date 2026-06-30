"use client"

import { CheckCircle2 } from "lucide-react"

export function CloturerButton() {
  return (
    <button 
      type="submit" 
      onClick={(e) => {
        if(!window.confirm("Clôturer ce chantier ? Tout le matériel non consommé sera automatiquement retourné au Dépôt.")) {
          e.preventDefault();
        }
      }}
      className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-sm transition-colors"
    >
      <CheckCircle2 className="w-4 h-4" /> Clôturer
    </button>
  )
}
