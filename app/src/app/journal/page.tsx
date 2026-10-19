import { getAuditLogs } from "@/lib/audit"
import { Shield, Trash2, Edit, Plus, AlertCircle, Download } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function JournalPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const logs = await getAuditLogs()

  const getIcon = (action: string) => {
    switch (action) {
      case 'SUPPRESSION': return <Trash2 className="w-4 h-4 text-red-500" />
      case 'MODIFICATION': return <Edit className="w-4 h-4 text-orange-500" />
      case 'CREATION': return <Plus className="w-4 h-4 text-emerald-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getBadgeClass = (action: string) => {
    switch (action) {
      case 'SUPPRESSION': return "bg-red-100 text-red-800 border-red-200"
      case 'MODIFICATION': return "bg-orange-100 text-orange-800 border-orange-200"
      case 'CREATION': return "bg-emerald-100 text-emerald-800 border-emerald-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50">Journal d'Activité & Sauvegardes</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Historique des actions critiques et instantanés de sécurité.</p>
          </div>
        </div>

        {session.role === 'GERANT' && (
          <a
            href="/api/backup/export"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm transition-colors cursor-pointer"
            title="Télécharger une sauvegarde complète de la base de données"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Sauvegarder la base (JSON)</span>
          </a>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
            Aucun événement enregistré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-zinc-400">Date</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-zinc-400">Utilisateur</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-zinc-400">Action</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-zinc-400">Entité</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-zinc-400">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-950/50">
                    <td className="px-6 py-3 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString('fr-FR')} à {new Date(log.date).toLocaleTimeString('fr-FR')}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-gray-900 dark:text-zinc-50">{log.user}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(log.action)}`}>
                        {getIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      {log.entite}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-zinc-400">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
