import { getChantiers, createChantier, deleteChantier } from "@/app/actions/chantiers"
import { HardHat, Plus, Trash2 } from "lucide-react"
import { calculerResteSurChantier } from "@/lib/stockUtils"
import prisma from "@/lib/prisma"
import { DeleteButton } from "@/components/DeleteButton"
import Link from "next/link"

export default async function ChantiersPage() {
  const chantiers = await prisma.chantier.findMany({
    include: { mouvements: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Chantiers</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire d'ajout */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50/50 px-4 py-3 font-medium">
              Nouveau chantier
            </div>
            <form action={createChantier} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom du chantier</label>
                <input required name="nom" type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="ex: Rénovation Appartement Paris 15" />
              </div>
              
              <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Plus className="h-4 w-4" />
                Créer le chantier
              </button>
            </form>
          </div>
        </div>

        {/* Liste des chantiers */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nom du Chantier</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Adresse</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Matériel sur site</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {chantiers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Aucun chantier enregistré.
                      </td>
                    </tr>
                  ) : (
                    chantiers.map((chantier: any) => {
                      const resteChantier = calculerResteSurChantier(chantier.mouvements)
                      const materielDeploye = (Object.values(resteChantier) as number[]).reduce((acc: number, val: number) => acc + val, 0)
                      
                      return (
                        <tr key={chantier.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-gray-100 p-2">
                                <HardHat className="h-5 w-5 text-gray-500" />
                              </div>
                              <Link href={`/chantiers/${chantier.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                                {chantier.nom}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{chantier.adresse || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              chantier.statut === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {chantier.statut}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-blue-600">
                            {materielDeploye} unités
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/chantiers/${chantier.id}`} className="rounded p-1 text-blue-500 hover:bg-blue-50" title="Modifier/Détails">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </Link>
                              <form action={deleteChantier.bind(null, chantier.id)}>
                                <DeleteButton message="Supprimer ce chantier va aussi supprimer son historique de mouvements. Continuer ?" />
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Cartes) */}
            <div className="md:hidden divide-y divide-gray-100">
              {chantiers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Aucun chantier enregistré.</div>
              ) : (
                chantiers.map((chantier: any) => {
                  const resteChantier = calculerResteSurChantier(chantier.mouvements)
                  const materielDeploye = (Object.values(resteChantier) as number[]).reduce((acc: number, val: number) => acc + val, 0)
                  
                  return (
                    <div key={chantier.id} className="p-4 bg-white space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-gray-100 p-2">
                            <HardHat className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <Link href={`/chantiers/${chantier.id}`} className="font-bold text-gray-900 hover:text-blue-600">
                              {chantier.nom}
                            </Link>
                            <div className="text-xs text-gray-500">{chantier.adresse || 'Pas d\'adresse'}</div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          chantier.statut === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {chantier.statut}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">Matériel sur site</div>
                        <div className="font-bold text-blue-600">{materielDeploye} unités</div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Link href={`/chantiers/${chantier.id}`} className="rounded p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <form action={deleteChantier.bind(null, chantier.id)}>
                          <DeleteButton message="Supprimer ce chantier va aussi supprimer son historique de mouvements. Continuer ?" />
                        </form>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
