import { getFactures } from '@/app/actions/factures'
import { getConfigMail } from '@/app/actions/config-mail'
import { getAliases } from '@/app/actions/alias'
import { FournisseursClient } from './FournisseursClient'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FournisseursPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'GERANT') {
    redirect('/')
  }

  const [factures, configMail, aliases] = await Promise.all([
    getFactures(),
    getConfigMail(),
    getAliases()
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrôle Fournisseurs & Comptabilité</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">
            Vérifiez les prix de vos factures, affectez les chantiers et suivez vos avoirs en toute simplicité.
          </p>
        </div>
      </div>

      <FournisseursClient 
        initialFactures={factures} 
        initialConfigMail={configMail}
        initialAliases={aliases}
      />
    </div>
  )
}
