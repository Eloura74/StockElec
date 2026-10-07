import { Sidebar } from '@/components/Sidebar'
import { RentabiliteClient } from './RentabiliteClient'
import { getAchatsParChantier } from '@/app/actions/rentabilite'

export const dynamic = 'force-dynamic'

export default async function RentabilitePage() {
  const chantiersData = await getAchatsParChantier()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Bilan Financier & Chantiers
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Suivi des coûts d'achats matériels ventilés par chantier depuis les factures.
            </p>
          </header>
          
          <RentabiliteClient initialData={chantiersData} />
        </div>
      </main>
    </div>
  )
}
