import { getMouvements, createMouvement, deleteMouvement } from "@/app/actions/mouvements"
import { getArticles } from "@/app/actions/articles"
import { getChantiers } from "@/app/actions/chantiers"
import { FileText, ArrowRightLeft, Trash2 } from "lucide-react"
import { DeleteButton } from "@/components/DeleteButton"

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
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50/50 px-4 py-3 font-medium">
              Saisir un mouvement
            </div>
            <form action={createMouvement} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de mouvement</label>
                <select name="type" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
                  <option value="Depart">Départ vers Chantier</option>
                  <option value="Retour">Retour de Chantier</option>
                  <option value="Achat">Achat / Entrée Dépôt</option>
                  <option value="Consomme">Consommé / Posé</option>
                  <option value="Perte">Perdu / Cassé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Article</label>
                <select required name="articleId" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
                  <option value="">-- Sélectionner --</option>
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>[{a.reference}] {a.designation}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Chantier (si applicable)</label>
                  <select name="chantierId" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
                    <option value="">-- Aucun / Dépôt --</option>
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité</label>
                  <input required name="quantite" type="number" min="1" defaultValue="1" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 font-bold">👤 Saisi par (OBLIGATOIRE)</label>
                  <input required name="utilisateur" type="text" placeholder="Ton prénom" className="mt-1 block w-full rounded-md border-2 border-orange-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observation</label>
                <textarea name="observation" rows={2} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Optionnel..."></textarea>
              </div>
              
              <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <ArrowRightLeft className="h-4 w-4" />
                Valider le mouvement
              </button>
            </form>
          </div>
        </div>

        {/* Historique des mouvements */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Article</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Qté</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Chantier</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {mouvements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Aucun mouvement enregistré.
                      </td>
                    </tr>
                  ) : (
                    mouvements.map((mvt) => (
                      <tr key={mvt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">
                          {mvt.date.toLocaleDateString("fr-FR")} {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            mvt.type === 'Depart' ? 'bg-orange-100 text-orange-800' : 
                            mvt.type === 'Retour' ? 'bg-blue-100 text-blue-800' : 
                            mvt.type === 'Achat' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {mvt.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {mvt.article.reference}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' ? '-' : '+'}{mvt.quantite}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {mvt.chantier?.nom || '-'}
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
                <div className="p-8 text-center text-gray-500">Aucun mouvement enregistré.</div>
              ) : (
                mouvements.map((mvt) => (
                  <div key={mvt.id} className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-500 font-medium">
                        {mvt.date.toLocaleDateString("fr-FR")} à {mvt.date.getHours()}:{mvt.date.getMinutes().toString().padStart(2, '0')}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        mvt.type === 'Depart' ? 'bg-orange-100 text-orange-800' : 
                        mvt.type === 'Retour' ? 'bg-blue-100 text-blue-800' : 
                        mvt.type === 'Achat' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mvt.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{mvt.article.designation}</div>
                        <div className="text-xs text-gray-500">{mvt.article.reference}</div>
                      </div>
                      <div className="text-xl font-bold">
                        <span className={mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' ? 'text-orange-600' : 'text-green-600'}>
                          {mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' ? '-' : '+'}{mvt.quantite}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        {mvt.chantier && (
                          <span className="flex items-center gap-1"><span className="font-semibold text-gray-900">Chantier:</span> {mvt.chantier.nom}</span>
                        )}
                        {mvt.utilisateur && (
                          <span className="flex items-center gap-1"><span className="font-semibold text-gray-900">Par:</span> {mvt.utilisateur}</span>
                        )}
                      </div>
                      <div>
                        <form action={deleteMouvement.bind(null, mvt.id)}>
                          <DeleteButton message="Supprimer ce mouvement ?" />
                        </form>
                      </div>
                    </div>
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
