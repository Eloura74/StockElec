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
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
    >
      <FileSpreadsheet className="w-4 h-4" /> Export Comptable (Excel)
    </button>
  )
}
