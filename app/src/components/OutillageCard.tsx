import Link from "next/link"
import { Wrench, CheckCircle, Clock, AlertTriangle, User, MapPin, RotateCcw } from "lucide-react"
import { retournerOutillageRapide } from "@/app/actions/outillage"

export function OutillageCard({ outil }: { outil: any }) {
  const isDisponible = outil.statut === "Disponible"
  const isEnChantier = outil.statut === "En Chantier"
  const isEnReparation = outil.statut === "En Réparation"
  const isPerdu = outil.statut === "Perdu"

  const joursSortie: number | null = typeof outil.joursSortie === "number" ? outil.joursSortie : null
  const enRetard = joursSortie !== null && joursSortie >= 15

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 shadow-2xs hover:border-blue-500/40 transition-all h-full flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start gap-3">
        <Link href={`/outillage/${outil.id}`} className="flex items-start gap-3 group flex-1 min-w-0">
          <div
            className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${
              isDisponible
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                : isEnChantier
                  ? enRetard
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            }`}
          >
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
              {outil.nom}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              {outil.marque || "Sans marque"} {outil.reference ? `• Réf: ${outil.reference}` : ""}
            </p>
          </div>
        </Link>

        {joursSortie !== null && (
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              enRetard
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50"
            }`}
            title={enRetard ? "Sorti depuis plus de 15 jours — À relancer" : "Durée de sortie sur chantier"}
          >
            {enRetard && <AlertTriangle className="w-3 h-3" />}
            <span>{joursSortie === 0 ? "Aujourd'hui" : `${joursSortie} j`}</span>
          </span>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col gap-2">
        {isDisponible && (
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Disponible au dépôt</span>
            </div>
            <Link
              href={`/outillage/${outil.id}`}
              className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Fiche →
            </Link>
          </div>
        )}

        {isEnChantier && (
          <div className="flex flex-col gap-2 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-3 rounded-xl text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Sur Chantier</span>
              </div>
              <form action={retournerOutillageRapide.bind(null, outil.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Rapatrier immédiatement cette machine au dépôt"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retour dépôt</span>
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-amber-700 dark:text-amber-400/90">
              {outil.chantier && (
                <div className="flex items-center gap-1 font-semibold">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{outil.chantier.nom}</span>
                </div>
              )}
              {outil.utilisateur && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span>{outil.utilisateur}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(isEnReparation || isPerdu) && (
          <div className="flex items-center justify-between gap-2 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 px-3 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{outil.statut}</span>
            </div>
            <form action={retournerOutillageRapide.bind(null, outil.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                title="Remettre la machine en stock disponible au dépôt"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Remettre au dépôt</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
