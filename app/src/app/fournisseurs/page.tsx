import { getFactures } from '@/app/actions/factures'
import { FournisseursClient } from './FournisseursClient'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FournisseursPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'GERANT') {
    redirect('/')
  }

  const factures = await getFactures()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrôle Fournisseurs</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">
            Vérifiez les prix de vos factures et générez vos demandes d'avoir.
          </p>
        </div>
      </div>

      <FournisseursClient initialFactures={factures} />
    </div>
  )
}
