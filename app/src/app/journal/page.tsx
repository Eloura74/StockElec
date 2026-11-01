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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Traçabilité & Sécurité
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Journal d'Audit & Sécurité
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historique horodaté des actions critiques, mouvements de stock et sauvegardes certifiées de Quentin Électricité.
          </p>
        </div>

        {session.role === 'GERANT' && (
          <a
            href="/api/backup/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-[#161d2d] shadow-2xs transition-all tactile-btn cursor-pointer"
            title="Télécharger une sauvegarde complète de la base de données"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Sauvegarder la base (JSON)</span>
          </a>
        )}
      </div>

      <div className="prestige-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun événement enregistré pour le moment.
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
