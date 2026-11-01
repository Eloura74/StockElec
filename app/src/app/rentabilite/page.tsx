import { RentabiliteClient } from './RentabiliteClient'
import { getAchatsParChantier } from '@/app/actions/rentabilite'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RentabilitePage() {
  const session = await getSession()
  if (!session || session.role !== 'GERANT') {
    redirect('/')
  }

  const chantiersData = await getAchatsParChantier()

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <span className="inline-block mb-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
          Rentabilité
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Bilan Financier & Chantiers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Suivi des coûts d'achats matériels ventilés par chantier depuis les factures.
        </p>
      </header>
      
      <RentabiliteClient initialData={chantiersData} />
    </div>
  )
}
