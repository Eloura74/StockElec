"use client"

import { useState } from "react"
import { FileDown, CheckCircle } from "lucide-react"
import { marquerFournisseurCommeCommande } from "@/app/actions/reassort"

type ReassortItem = {
  articleId: string
  reference: string
  referenceFournisseur?: string
  designation: string
  unite: string
  quantiteParBoite: number
  qteRecommandee: number // Unités totales
  boitesACommander: number
}

export function ReassortButtons({ fournisseur, items }: { fournisseur: string, items: ReassortItem[] }) {
  const [loading, setLoading] = useState(false)

  const handleExportCSV = () => {
    const headers = ["Fournisseur", "Ref_Fournisseur", "Ref_Interne", "Designation", "Unite", "Quantite_Boites", "Unites_Totales"]
    
    const rows = items.map(item => [
      fournisseur,
      item.referenceFournisseur || "",
      item.reference,
      `"${item.designation.replace(/"/g, '""')}"`,
      item.unite,
      item.boitesACommander.toString(),
      (item.boitesACommander * item.quantiteParBoite).toString()
    ])

    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `commande_${fournisseur.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMarquerCommande = async () => {
    if (confirm(`Veux-tu vraiment marquer tous les articles de ${fournisseur} comme commandés ? Cela va ajouter les quantités au stock d'un coup.`)) {
      setLoading(true)
      const lignes = items.map(item => ({
        articleId: item.articleId,
        quantiteUnites: item.boitesACommander * item.quantiteParBoite // On ajoute le multiple exact de boîtes
      }))
      await marquerFournisseurCommeCommande(lignes)
      setLoading(false)
      alert("La commande a été ajoutée au stock avec succès !")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <FileDown className="h-4 w-4" /> Exporter CSV
      </button>
      <button 
        onClick={handleMarquerCommande}
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <CheckCircle className="h-4 w-4" /> {loading ? "Traitement..." : "Tout Réceptionner (Auto)"}
      </button>
    </div>
  )
}
