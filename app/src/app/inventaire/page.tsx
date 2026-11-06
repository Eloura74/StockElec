import { getArticlesActifsAvecStocks } from "@/app/actions/articles"
import { InventaireForm } from "@/components/InventaireForm"

export default async function InventairePage() {
  const articles = await getArticlesActifsAvecStocks()

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
            Ajustement & Réconciliation
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Session d'Inventaire
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Sélectionnez ou scannez une référence pour corriger le stock physique au dépôt. Le système calcule et trace automatiquement les écarts.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mt-6">
        <InventaireForm articles={articles} />
      </div>
    </div>
  )
}
