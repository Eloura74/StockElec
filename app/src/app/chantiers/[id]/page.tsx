import prisma from "@/lib/prisma"
import { updateChantier, deleteChantier } from "@/app/actions/chantiers"
import { calculerResteSurChantier } from "@/lib/stockUtils"
import { ArrowLeft, Edit, Save, Trash2, Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"

export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const chantier = await prisma.chantier.findUnique({
    where: { id },
    include: {
      mouvements: {
        include: { article: true },
        orderBy: { date: 'desc' }
      }
    }
  })

  if (!chantier) {
    redirect("/chantiers")
  }

  // Calcul du matériel présent sur ce chantier (par article)
  const materielSurSiteMap = new Map<string, { article: any, quantite: number }>();
  let valeurTotale = 0;

  chantier.mouvements.forEach((mvt: any) => {
    if (!materielSurSiteMap.has(mvt.articleId)) {
      materielSurSiteMap.set(mvt.articleId, { article: mvt.article, quantite: 0 });
    }
    const current = materielSurSiteMap.get(mvt.articleId)!;
    
    if (mvt.type === 'Depart') {
      current.quantite += mvt.quantite;
    } else if (mvt.type === 'Retour' || mvt.type === 'Consomme') {
      current.quantite -= mvt.quantite;
    }
  });

  const materielDeploye = Array.from(materielSurSiteMap.values()).filter(m => m.quantite > 0);
  materielDeploye.forEach(m => {
    valeurTotale += m.quantite * m.article.prixUnitaire;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/chantiers" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Détails du chantier : {chantier.nom}</h1>
        </div>
        <div className="flex gap-2">
          <form action={deleteChantier.bind(null, chantier.id)}>
            <DeleteButton message="Supprimer définitivement ce chantier et tout son historique ?" />
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Édition */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Edit className="w-5 h-5 text-gray-500"/> Modifier le chantier</h2>
          <form action={updateChantier} className="space-y-4">
            <input type="hidden" name="id" value={chantier.id} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom du chantier</label>
              <input name="nom" type="text" defaultValue={chantier.nom} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
              <select name="statut" defaultValue={chantier.statut} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Actif">Actif</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            
            <button type="submit" className="w-full flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Save className="h-4 w-4" /> Enregistrer
            </button>
          </form>
        </div>

        {/* Historique & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Package className="w-6 h-6"/></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Matériel déployé (reste sur site)</p>
                <p className="text-2xl font-bold text-gray-900">{materielDeploye.reduce((acc, m) => acc + m.quantite, 0)} unités</p>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Valeur totale sur site</p>
              <p className="text-2xl font-bold text-gray-900">
                {valeurTotale.toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Matériel Actuellement sur ce Chantier</h2>
            </div>
            <div className="p-6">
              {materielDeploye.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Aucun matériel actuellement sur ce chantier.</p>
              ) : (
                <div className="space-y-4">
                  {materielDeploye.map(m => (
                    <div key={m.article.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{m.article.designation}</p>
                        <p className="text-xs text-gray-500">{m.article.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{m.quantite} {m.article.unite}</p>
                        <p className="text-xs text-gray-500">Soit {(m.quantite * m.article.prixUnitaire).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Historique des Mouvements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Article</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Qté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chantier.mouvements.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Aucun mouvement.</td></tr>
                  ) : (
                    chantier.mouvements.map((mvt: any) => (
                      <tr key={mvt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">{new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{mvt.article.designation}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${mvt.type === 'Depart' ? 'bg-blue-100 text-blue-800' : ''}
                            ${mvt.type === 'Retour' ? 'bg-emerald-100 text-emerald-800' : ''}
                            ${mvt.type === 'Consomme' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {mvt.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium">
                           {mvt.type === 'Depart' ? '+' : '-'}{mvt.quantite}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
