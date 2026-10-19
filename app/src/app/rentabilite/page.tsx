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
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Bilan Financier & Chantiers
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Suivi des coûts d'achats matériels ventilés par chantier depuis les factures.
        </p>
      </header>
      
      <RentabiliteClient initialData={chantiersData} />
    </div>
  )
}
