import { getMouvements, annulerMouvement } from "@/app/actions/mouvements"
import { getArticlesActifsAvecStocks } from "@/app/actions/articles"
import { getChantiers } from "@/app/actions/chantiers"
import { MouvementsFilters } from "./MouvementsFilters"
import { MouvementsViewClient } from "./MouvementsViewClient"

export default async function MouvementsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
  const { start, end } = await searchParams
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (start) {
    startDate = new Date(start)
    startDate.setHours(0, 0, 0, 0)
  }
  if (end) {
    endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
  }

  const [mouvements, articles, chantiers] = await Promise.all([
    getMouvements({ startDate, endDate }),
    getArticlesActifsAvecStocks(),
    getChantiers(),
  ])

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-8 animate-in fade-in duration-200">
      {/* 1. Header Prestige */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Flux &amp; Traçabilité
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Journal des Entrées &amp; Sorties
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mouvements de Stock
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historique exhaustif et saisie des flux dépôt, départs chantiers et réceptions.
          </p>
        </div>

        <MouvementsFilters />
      </div>

      {/* 2. Vue Client Responsive (Système d'onglets mobile + grille desktop) */}
      <MouvementsViewClient
        mouvements={mouvements}
        articles={articles}
        chantiers={chantiers}
        annulerMouvementAction={annulerMouvement}
      />
    </div>
  )
}
