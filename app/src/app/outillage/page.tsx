import prisma from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { OutillageCard } from "@/components/OutillageCard"
import { EmpruntOutillageForm } from "@/components/EmpruntOutillageForm"
import { getOutillages } from "@/app/actions/outillage"
import { getSession } from "@/lib/auth"

export default async function OutillagePage() {
  const [outillages, chantiers, session] = await Promise.all([
    getOutillages(),
    prisma.chantier.findMany({
      where: { statut: 'Actif' },
      orderBy: { nom: 'asc' }
    }),
    getSession(),
  ])
  
  const isGerant = session?.role === 'GERANT'

  // Stats rapides
  const total = outillages.length
  const disponibles = outillages.filter((o: any) => o.statut === "Disponible").length
  const enChantier = outillages.filter((o: any) => o.statut === "En Chantier").length
  const autres = total - disponibles - enChantier // En réparation ou perdu

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* En-tête exécutif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Parc Machines & Outillage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestion de l'Outillage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des machines, équipements de mesure et affectations chantiers de Quentin Électricité.
          </p>
        </div>

        {isGerant && (
          <Link 
            href="/outillage/nouveau" 
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm flex items-center justify-center gap-2 transition-all tactile-btn"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une Machine</span>
          </Link>
        )}
      </div>

      {/* 3 Cartes Métriques Prestige */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs prestige-sheen flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Parc Total</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">{total}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">machines référencées</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-[#101915] shadow-2xs prestige-sheen flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Au Dépôt</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">{disponibles}</p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500">disponibles immédiatement</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/30 dark:bg-[#111522] shadow-2xs prestige-sheen flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Sur Chantier</p>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums">{enChantier}</p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400">emprunts actifs</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outillages.map((outil: any) => (
              <OutillageCard key={outil.id} outil={outil} />
            ))}
            {outillages.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed">
                Aucun outil enregistré pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <EmpruntOutillageForm outillages={outillages} chantiers={chantiers} />
        </div>

      </div>
    </div>
  )
}
