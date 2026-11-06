"use client"

import { useState } from "react"
import { Copy, Check, ShoppingCart, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { SupplierBadge } from "./SupplierBadge"

type OrderItem = {
  articleId: string
  designation: string
  reference: string
  referenceFournisseur: string | null
  stockDépôt: number
  stockMinimum: number
  quantiteParBoite: number
  unite: string
  prixUnitaire?: number
  suggestedQuantity: number
}

export function CommandeFournisseurCard({
  fournisseur,
  items,
}: {
  fournisseur: string
  items: OrderItem[]
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.articleId]: item.suggestedQuantity }), {})
  )
  const [copied, setCopied] = useState(false)

  const handleQuantityChange = (id: string, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQuantities((prev) => ({ ...prev, [id]: num }))
    } else if (value === "") {
      setQuantities((prev) => ({ ...prev, [id]: 0 }))
    }
  }

  const generateOrderText = () => {
    let text = `Bonjour,\n\nPouvez-vous me préparer la commande suivante s'il vous plaît :\n\n`

    items.forEach((item) => {
      const qte = quantities[item.articleId]
      if (qte > 0) {
        const refText = item.referenceFournisseur
          ? `(Réf Fournisseur: ${item.referenceFournisseur})`
          : `(Réf Interne: ${item.reference})`
        text += `- ${qte} x ${item.designation} ${refText}\n`
      }
    })

    text += `\nMerci d'avance,\nQuentin Elec`
    return text
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateOrderText())
      setCopied(true)
      toast.success(`Commande ${fournisseur} copiée dans le presse-papiers !`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast.error("Erreur lors de la copie de la commande.")
    }
  }

  const totalItemsToOrder = Object.values(quantities).filter((q) => q > 0).length
  const totalEstimeHT = items.reduce(
    (sum, item) => sum + (quantities[item.articleId] || 0) * (item.prixUnitaire || 0),
    0
  )

  return (
    <div className="prestige-card bg-white dark:bg-[#111622] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
      <div className="bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <SupplierBadge name={fournisseur} size="sm" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                • {items.length} réf. en alerte
              </span>
            </div>
            {totalEstimeHT > 0 && (
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
                Montant estimé :{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {totalEstimeHT.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  € HT
                </span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          disabled={totalItemsToOrder === 0}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            copied
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40"
              : totalItemsToOrder > 0
              ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm tactile-btn"
              : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? "Commande copiée !" : "Copier pour Email"}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/75 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
            <tr>
              <th className="px-5 py-3 font-semibold">Article & Référence</th>
              <th className="px-5 py-3 font-semibold text-center">Stock Actuel</th>
              <th className="px-5 py-3 font-semibold text-right">Qté à commander</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {items.map((item) => (
              <tr
                key={item.articleId}
                className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {item.designation}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    {item.referenceFournisseur
                      ? `Réf fournisseur : ${item.referenceFournisseur}`
                      : `Réf interne : ${item.reference}`}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] tabular-nums">
                    <AlertCircle className="h-3 w-3" />
                    <span>
                      {item.stockDépôt} {item.unite}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Seuil min : {item.stockMinimum}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      value={quantities[item.articleId]}
                      onChange={(e) => handleQuantityChange(item.articleId, e.target.value)}
                      className="w-20 px-2.5 py-1.5 text-center bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 focus:border-blue-500 tabular-nums"
                    />
                    <span className="text-slate-400 dark:text-slate-500 w-6 text-left font-semibold">
                      {item.unite}
                    </span>
                  </div>
                  {item.quantiteParBoite > 1 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 mr-8">
                      Conditionné par {item.quantiteParBoite}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
