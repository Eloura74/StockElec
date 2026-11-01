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
      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 text-sm font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
    >
      <CheckCircle2 className="w-4 h-4" />
      <span>Clôturer</span>
    </button>
  )
}
