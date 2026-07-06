import { getMouvements, createMouvement, deleteMouvement } from "@/app/actions/mouvements"
import { getArticles } from "@/app/actions/articles"
import { getChantiers } from "@/app/actions/chantiers"
import { FileText, ArrowRightLeft, Trash2 } from "lucide-react"
import { DeleteButton } from "@/components/DeleteButton"
import { MouvementForm } from "@/components/MouvementForm"

export default async function MouvementsPage() {
  const mouvements = await getMouvements()
  const articles = await getArticles()
  const chantiers = await getChantiers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire Client Component */}
        <div className="lg:col-span-1">
          <MouvementForm articles={articles} chantiers={chantiers} />
        </div>

        {/* Historique des mouvements */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-zinc-400 rounded-l-xl">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-zinc-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-zinc-400">Article</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-zinc-400">Qté</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-zinc-400">Chantier / Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-zinc-400">Obs.</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-zinc-400 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {mouvements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-zinc-400">
                        Aucun mouvement enregistré.
                      </td>
                    </tr>
                  ) : (
                    mouvements.map((mvt) => (
                      <tr key={mvt.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-950">
                        <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                          {mvt.date.toLocaleDateString("fr-FR")} {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            mvt.type === 'Depart' ? 'bg-orange-100 text-orange-800' : 
                            mvt.type === 'Retour' ? 'bg-blue-100 text-blue-800' : 
                            mvt.type === 'Achat' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100'
                          }`}>
                            {mvt.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 dark:text-zinc-50">{mvt.article.designation}</div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400">{mvt.article.reference}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-black text-lg">
                          <span className={mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' || mvt.type === 'Correction_Moins' ? 'text-orange-600' : 'text-emerald-600'}>
                            {mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' || mvt.type === 'Correction_Moins' ? '-' : '+'}{mvt.quantite}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {mvt.chantier?.nom && <div className="font-medium text-gray-900 dark:text-zinc-50">{mvt.chantier.nom}</div>}
                          {mvt.utilisateur && <div className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mt-1">Par: {mvt.utilisateur}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 max-w-[150px] truncate" title={mvt.observation || ""}>
                          {mvt.observation || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={deleteMouvement.bind(null, mvt.id)}>
                            <DeleteButton message="Supprimer ce mouvement ? Le stock sera recalculé sans lui." />
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Cartes) */}
            <div className="md:hidden divide-y divide-gray-100">
              {mouvements.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-zinc-400">Aucun mouvement enregistré.</div>
              ) : (
                mouvements.map((mvt) => (
                  <div key={mvt.id} className="p-4 bg-white dark:bg-zinc-900 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        {mvt.date.toLocaleDateString("fr-FR")} à {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        mvt.type === 'Depart' ? 'bg-orange-100 text-orange-800' : 
                        mvt.type === 'Retour' ? 'bg-blue-100 text-blue-800' : 
                        mvt.type === 'Achat' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100'
                      }`}>
                        {mvt.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 mt-2">
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-gray-900 dark:text-zinc-50 text-sm truncate">{mvt.article.designation}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">{mvt.article.reference}</div>
                      </div>
                      <div className={`text-xl font-bold shrink-0 ml-3 ${mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' || mvt.type === 'Correction_Moins' ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' || mvt.type === 'Correction_Moins' ? '-' : '+'}{mvt.quantite}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs mt-2">
                      <div className="flex flex-col gap-1">
                        {mvt.chantier?.nom && <span className="font-medium text-gray-700 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">📍 {mvt.chantier.nom}</span>}
                        {mvt.utilisateur && <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">👤 {mvt.utilisateur}</span>}
                      </div>
                      <form action={deleteMouvement.bind(null, mvt.id)}>
                        <DeleteButton message="Supprimer ce mouvement ?" />
                      </form>
                    </div>

                    {mvt.observation && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400 italic mt-2 bg-gray-50 dark:bg-zinc-950 p-2 rounded border border-gray-100 dark:border-zinc-800">
                        "{mvt.observation}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
