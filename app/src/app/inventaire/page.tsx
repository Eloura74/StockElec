import { getArticlesActifsAvecStocks } from "@/app/actions/articles"
import { InventaireForm } from "@/components/InventaireForm"
import { PackageSearch, Boxes, ScanBarcode } from "lucide-react"

export default async function InventairePage() {
  const articles = await getArticlesActifsAvecStocks()

  const enStock = articles.filter((a) => (a.stockInfo?.stockDepot || 0) > 0)
  const totalPiecesDepot = enStock.reduce((acc, a) => acc + Math.max(0, a.stockInfo?.stockDepot || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
              Ajustement & Réconciliation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Session d&apos;Inventaire
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sélectionnez ou scannez une référence pour corriger le stock physique au dépôt. Le système calcule et trace automatiquement les écarts.
          </p>
        </div>

        {/* Capsules KPIs rapides */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2.5">
            <PackageSearch className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">Réf. en Dépôt</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {enStock.length} réf. actives
              </p>
            </div>
          </div>

          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2.5">
            <Boxes className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">Pièces au Dépôt</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {totalPiecesDepot.toLocaleString("fr-FR")} pcs
              </p>
            </div>
          </div>

          <div className="p-2.5 px-3.5 rounded-xl border border-purple-200/70 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/30 shadow-2xs flex items-center gap-2">
            <ScanBarcode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-purple-600/80 dark:text-purple-400 leading-none">Catalogue Lié</p>
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mt-0.5">
                Scan & Recherche Live
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-6">
        <InventaireForm articles={articles} />
      </div>
    </div>
  )
}
