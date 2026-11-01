"use client"

import { FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

export function ExportExcelComptableButton({ 
  dataDepot, 
  dataChantiers 
}: { 
  dataDepot: any[], 
  dataChantiers: any[] 
}) {
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Onglet Dépôt
    const wsDepot = XLSX.utils.json_to_sheet(dataDepot)
    XLSX.utils.book_append_sheet(wb, wsDepot, "Stock Dépôt")
    
    // Onglet Chantiers
    const wsChantiers = XLSX.utils.json_to_sheet(dataChantiers)
    XLSX.utils.book_append_sheet(wb, wsChantiers, "Matériel sur Chantiers")
    
    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")
    XLSX.writeFile(wb, `Valorisation_Stock_${date}.xlsx`)
  }

  return (
    <button 
      type="button"
      onClick={exportExcel}
      className="bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161d2d] text-emerald-700 dark:text-emerald-400 border border-slate-200/80 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
    >
      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>Export Comptable</span>
    </button>
  )
}
