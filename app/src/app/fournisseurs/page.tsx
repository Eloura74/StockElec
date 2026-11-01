import { getFactures } from '@/app/actions/factures'
import { getConfigMail } from '@/app/actions/config-mail'
import { getAliases } from '@/app/actions/alias'
import { FournisseursClient } from './FournisseursClient'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function FournisseursPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'GERANT') {
    redirect('/')
  }

  const [factures, configMail, aliases, chantiers] = await Promise.all([
    getFactures(),
    getConfigMail(),
    getAliases(),
    prisma.chantier.findMany({ 
      select: { id: true, nom: true, statut: true }, 
      orderBy: { nom: 'asc' } 
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <span className="inline-block mb-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
            Achats &amp; Factures
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Contrôle Fournisseurs & Comptabilité</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Vérifiez les prix de vos factures, affectez les chantiers et suivez vos avoirs en toute simplicité.
          </p>
        </div>
      </div>

      <FournisseursClient 
        initialFactures={factures} 
        initialConfigMail={configMail}
        initialAliases={aliases}
        initialChantiers={chantiers}
      />
    </div>
  )
}
