"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { calculerStockArticle } from "@/lib/stockUtils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function ExportPDFButton({ articles }: { articles: any[] }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    
    try {
      const doc = new jsPDF("landscape") // Format paysage pour plus de colonnes

      // Titre
      doc.setFontSize(18)
      doc.text("Inventaire Global - Quentin Elec", 14, 22)
      
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 30)

      // Préparation des données
      let valeurTotaleGlobale = 0
      const tableData = articles.map(article => {
        const stock = calculerStockArticle(article, article.mouvements || [])
        const valeurStockDepot = (stock.stockDepot * (article.prixUnitaire || 0))
        valeurTotaleGlobale += valeurStockDepot

        return [
          article.reference,
          article.designation,
          article.fournisseur || "-",
          article.categorie || "-",
          `${stock.stockDepot} ${article.unite || 'u'}`,
          `${stock.stockChantiersTotal} ${article.unite || 'u'}`,
          `${article.prixUnitaire?.toFixed(2) || "0.00"} €`,
          `${valeurStockDepot.toFixed(2)} €`
        ]
      })

      // Génération du tableau
      autoTable(doc, {
        startY: 35,
        head: [['Référence', 'Désignation', 'Fournisseur', 'Catégorie', 'Stock Dépôt', 'Sur Chantiers', 'P.U. HT', 'Valeur Totale']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
        columnStyles: {
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center' },
          6: { halign: 'right' },
          7: { halign: 'right', fontStyle: 'bold' },
        },
        didDrawPage: function (data) {
          // Footer
          const str = 'Page ' + (doc as any).internal.getNumberOfPages()
          doc.setFontSize(10)
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          doc.text(str, data.settings.margin.left, pageHeight - 10)
        }
      })

      // Ajout du total global à la fin
      const finalY = (doc as any).lastAutoTable.finalY || 40
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.setFont("helvetica", "bold")
      doc.text(`Valeur Totale du Stock Dépôt : ${valeurTotaleGlobale.toFixed(2)} €`, 14, finalY + 10)

      doc.save(`Inventaire_Stock_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
      alert("Une erreur est survenue lors de la génération du PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button 
      onClick={handleExport} 
      disabled={isExporting}
      className="flex items-center gap-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {isExporting ? "Génération..." : "Exporter PDF"}
    </button>
  )
}
