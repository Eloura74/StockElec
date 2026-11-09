"use client"

import React, { useState } from "react"
import { FileDown, Share2, MessageCircle, ChevronDown } from "lucide-react"
import { buildBonLivraisonPdf, partagerBonLivraison, BonLivraisonData } from "@/lib/generateBonLivraisonPdf"
import { toast } from "sonner"

export function ExportBonLivraisonButton({
  chantier,
  materielDeploye,
}: {
  chantier: any
  materielDeploye: { article: any; quantite: number }[]
}) {
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const prepareData = (): BonLivraisonData => {
    return {
      chantierNom: chantier.nom,
      chantierAdresse: chantier.adresse || null,
      date: new Date(),
      utilisateur: "Quentin Électricité",
      lignes: materielDeploye.map((item) => ({
        reference: item.article.reference,
        designation: item.article.designation,
        quantite: item.quantite,
        unite: item.article.unite,
        categorie: item.article.categorie,
      })),
    }
  }

  const handleDownload = () => {
    setLoading(true)
    try {
      const data = prepareData()
      const { save } = buildBonLivraisonPdf(data)
      save()
      toast.success("Bon de livraison PDF téléchargé !")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la création du PDF.")
    } finally {
      setLoading(false)
      setIsOpenMenu(false)
    }
  }

  const handleShare = async () => {
    setLoading(true)
    try {
      const data = prepareData()
      await partagerBonLivraison(data)
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors du partage.")
    } finally {
      setLoading(false)
      setIsOpenMenu(false)
    }
  }

  const handleWhatsApp = () => {
    const data = prepareData()
    const totalPieces = data.lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0), 0)
    const textResume = `📄 *BON DE LIVRAISON CHANTIER - QUENTIN ÉLECTRICITÉ*\n` +
      `🏗️ *Chantier :* ${data.chantierNom}\n` +
      `📦 *Matériel sur site :* ${data.lignes.length} réf. (${totalPieces} pièces)\n` +
      `📅 *Date :* ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n`

    window.open(`https://wa.me/?text=${encodeURIComponent(textResume)}`, "_blank")
    setIsOpenMenu(false)
  }

  return (
    <div className="relative inline-flex items-center">
      <div className="inline-flex rounded-xl shadow-2xs border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111622]">
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading || materielDeploye.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <FileDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Bon de Livraison (BL)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          disabled={loading || materielDeploye.length === 0}
          className="px-2 py-2 border-l border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpenMenu && (
        <div className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
          >
            <FileDown className="w-4 h-4 text-blue-500" />
            <span>Télécharger PDF A4</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
          >
            <Share2 className="w-4 h-4 text-indigo-500" />
            <span>Partager (Mobile)</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Envoyer WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  )
}
