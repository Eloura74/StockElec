import { getMouvements, annulerMouvement } from "@/app/actions/mouvements"
import { getArticlesActifsAvecStocks } from "@/app/actions/articles"
import { getChantiers } from "@/app/actions/chantiers"
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, ShoppingCart, User, MapPin, Activity } from "lucide-react"
import { DeleteButton } from "@/components/DeleteButton"
import { MouvementForm } from "@/components/MouvementForm"
import { MouvementsFilters } from "./MouvementsFilters"

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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Depart':
        return {
          label: 'Départ Chantier',
          icon: ArrowUpRight,
          style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
          isNegative: true
        }
      case 'Retour':
        return {
          label: 'Retour Dépôt',
          icon: ArrowDownLeft,
          style: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
          isNegative: false
        }
      case 'Achat':
        return {
          label: 'Achat Fournisseur',
          icon: ShoppingCart,
          style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
          isNegative: false
        }
      case 'Consomme':
        return {
          label: 'Consommé / Posé',
          icon: ArrowUpRight,
          style: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
          isNegative: true
        }
      case 'Perte':
        return {
          label: 'Perte / Cassé',
          icon: ArrowUpRight,
          style: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
          isNegative: true
        }
      default:
        return {
          label: type,
          icon: Activity,
          style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.06]',
          isNegative: false
        }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Header Prestige */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Flux & Traçabilité
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Journal des Entrées & Sorties
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mouvements de Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historique exhaustif et horodaté des départs chantiers, réceptions fournisseurs et retours atelier.
          </p>
        </div>

        <MouvementsFilters />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire Client Component modernisé */}
        <div className="lg:col-span-1">
          <MouvementForm articles={articles} chantiers={chantiers} />
        </div>

        {/* Historique des mouvements */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
            {/* Vue Desktop : Tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                <thead className="bg-slate-50/75 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Date & Heure</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Type de flux</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Article & Réf</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Quantité</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Destination / Auteur</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {mouvements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="font-medium">Aucun mouvement trouvé pour cette période.</p>
                      </td>
                    </tr>
                  ) : (
                    mouvements.map((mvt) => {
                      const badge = getTypeBadge(mvt.type)
                      const Icon = badge.icon

                      return (
                        <tr key={mvt.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                          {/* 1. Date */}
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {mvt.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                            </span>
                            <span className="text-[10px] block text-slate-400">
                              {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                            </span>
                          </td>

                          {/* 2. Type */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.style}`}>
                              <Icon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* 3. Article */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[200px]" title={mvt.article.designation}>
                              {mvt.article.designation}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {mvt.article.reference}
                            </div>
                          </td>

                          {/* 4. Quantité */}
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-extrabold text-xs tabular-nums ${
                              badge.isNegative
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}>
                              {badge.isNegative ? '-' : '+'}{mvt.quantite}
                            </span>
                          </td>

                          {/* 5. Destination / Utilisateur */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              {mvt.chantier?.nom && (
                                <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{mvt.chantier.nom}</span>
                                </div>
                              )}
                              {mvt.utilisateur && (
                                <div className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  <User className="w-3 h-3" />
                                  <span>{mvt.utilisateur}</span>
                                </div>
                              )}
                              {mvt.observation && (
                                <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                                  "{mvt.observation}"
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 6. Action */}
                          <td className="px-4 py-3.5 text-right">
                            <form action={annulerMouvement.bind(null, mvt.id)}>
                              <DeleteButton message="Annuler ce mouvement ? Un mouvement de correction inverse sera créé pour rétablir le stock." />
                            </form>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Cartes soignées) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
              {mouvements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Aucun mouvement enregistré.
                </div>
              ) : (
                mouvements.map((mvt) => {
                  const badge = getTypeBadge(mvt.type)
                  const Icon = badge.icon

                  return (
                    <div key={mvt.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="text-xs text-slate-400 font-medium">
                          {mvt.date.toLocaleDateString("fr-FR")} à {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.style}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{mvt.article.designation}</div>
                          <div className="text-[10px] font-mono text-slate-400">{mvt.article.reference}</div>
                        </div>
                        <div className={`text-base font-extrabold tabular-nums shrink-0 ${
                          badge.isNegative ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {badge.isNegative ? '-' : '+'}{mvt.quantite}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <div className="flex flex-col gap-0.5">
                          {mvt.chantier?.nom && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {mvt.chantier.nom}
                            </span>
                          )}
                          {mvt.utilisateur && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                              Par: {mvt.utilisateur}
                            </span>
                          )}
                        </div>
                        <form action={annulerMouvement.bind(null, mvt.id)}>
                          <DeleteButton message="Annuler ce mouvement ? Un mouvement de correction inverse sera créé pour rétablir le stock." />
                        </form>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
