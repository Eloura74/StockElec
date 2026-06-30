import prisma from "@/lib/prisma"
import { updateArticle, deleteArticle } from "@/app/actions/articles"
import { entrerStockRapide } from "@/app/actions/mouvements"
import { calculerStockArticle } from "@/lib/stockUtils"
import { ArrowLeft, Edit, Save, Trash2, PackagePlus, ArrowRightLeft, PackageMinus, RefreshCw } from "lucide-react"
import { ScannerInput } from "@/components/ScannerInput"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      mouvements: {
        include: { chantier: true },
        orderBy: { date: 'desc' }
      }
    }
  })

  if (!article) {
    redirect("/catalogue")
  }

  const stockInfo = calculerStockArticle(article, article.mouvements)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/catalogue" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Détails de l'article</h1>
        </div>
        <div className="flex gap-2">
          <form action={deleteArticle.bind(null, article.id)}>
            <DeleteButton message="Supprimer définitivement cet article et tout son historique ?" />
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Édition */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Edit className="w-5 h-5 text-gray-500"/> Modifier l'article</h2>
          <form action={updateArticle} className="space-y-4">
            <input type="hidden" name="id" value={article.id} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Désignation</label>
              <input name="designation" type="text" defaultValue={article.designation} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Référence Interne</label>
              <input name="reference" type="text" defaultValue={article.reference} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fournisseur (Nom)</label>
                <input name="fournisseur" type="text" defaultValue={article.fournisseur || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="ex: Rexel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Réf. Fournisseur (Code)</label>
                <input name="referenceFournisseur" type="text" defaultValue={article.referenceFournisseur || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="ex: REX-12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qté par lot (Achat)</label>
                <input name="quantiteParBoite" type="number" defaultValue={article.quantiteParBoite || 1} min="1" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" title="Combien d'unités dans une boîte commandée ?" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <select name="categorie" defaultValue={article.categorie || ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Appareillage</option>
                <option>Câblage</option>
                <option>Tableau</option>
                <option>Éclairage</option>
                <option>Outillage</option>
                <option>Consommable</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Unité</label>
                <input name="unite" type="text" defaultValue={article.unite || ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seuil Alerte</label>
                <input name="stockMinimum" type="number" defaultValue={article.stockMinimum} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix unitaire (€)</label>
              <input name="prixUnitaire" type="number" step="0.01" defaultValue={article.prixUnitaire || 0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <ScannerInput 
                name="codeBarre" 
                label="Code-Barres (EAN)" 
                defaultValue={article.codeBarre || ''}
              />
            </div>
            <button type="submit" className="w-full flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Save className="h-4 w-4" /> Enregistrer les modifications
            </button>
          </form>
        </div>

        {/* Historique & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-xl border p-4 shadow-sm ${stockInfo.enAlerte ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
              <p className="text-sm font-medium text-gray-500">Stock Dépôt Actuel</p>
              <p className={`text-2xl font-bold ${stockInfo.enAlerte ? 'text-red-600' : 'text-gray-900'}`}>{stockInfo.stockDepot} {article.unite}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Stock sur Chantiers</p>
              <p className="text-2xl font-bold text-gray-900">{stockInfo.stockChantiersTotal} {article.unite || 'u'}</p>
            </div>
            <div className="mt-4 rounded bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Valeur totale en stock : <span className="font-semibold text-gray-900">{((stockInfo.stockDepot + stockInfo.stockChantiersTotal) * (article.prixUnitaire || 0)).toFixed(2)} €</span></p>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Historique des Mouvements</h2>
              <form action={entrerStockRapide} className="flex gap-2">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="number" name="quantite" placeholder="Qté" defaultValue="1" min="1" className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" />
                <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700">Entrée rapide</button>
              </form>
            </div>
            <div className="p-6">
              {article.mouvements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucun mouvement pour le moment.</div>
              ) : (
                <div className="relative border-l border-gray-200 ml-3 space-y-8">
                  {article.mouvements.map((mvt: any, index: number) => {
                    let Icon = ArrowRightLeft
                    let colorClass = "bg-gray-100 text-gray-500"
                    let iconBgClass = "bg-gray-100"
                    
                    if (mvt.type === 'Achat') {
                      Icon = PackagePlus
                      colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200"
                      iconBgClass = "bg-emerald-100 text-emerald-600"
                    } else if (mvt.type === 'Depart') {
                      Icon = ArrowRightLeft
                      colorClass = "text-orange-700 bg-orange-50 border-orange-200"
                      iconBgClass = "bg-orange-100 text-orange-600"
                    } else if (mvt.type === 'Retour') {
                      Icon = RefreshCw
                      colorClass = "text-blue-700 bg-blue-50 border-blue-200"
                      iconBgClass = "bg-blue-100 text-blue-600"
                    } else if (mvt.type === 'Consomme' || mvt.type === 'Perte') {
                      Icon = PackageMinus
                      colorClass = "text-red-700 bg-red-50 border-red-200"
                      iconBgClass = "bg-red-100 text-red-600"
                    } else if (mvt.type === 'Correction') {
                      Icon = Edit
                      colorClass = "text-purple-700 bg-purple-50 border-purple-200"
                      iconBgClass = "bg-purple-100 text-purple-600"
                    }

                    return (
                      <div key={mvt.id} className="relative pl-6">
                        {/* Circle dot on the timeline */}
                        <div className={`absolute -left-4 top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${iconBgClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className={`rounded-lg border p-4 shadow-sm ${colorClass}`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">
                                  {mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte' ? '-' : '+'}
                                  {mvt.quantite}
                                </span>
                                <span className="font-semibold">{mvt.type}</span>
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                Saisi par : <span className="underline decoration-dashed">{mvt.utilisateur || 'Anonyme'}</span>
                              </div>
                              {mvt.chantier && (
                                <div className="mt-1 text-sm">
                                  📍 Chantier : <span className="font-semibold">{mvt.chantier.nom}</span>
                                </div>
                              )}
                              {mvt.observation && (
                                <div className="mt-2 text-sm italic opacity-80">
                                  "{mvt.observation}"
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-medium opacity-60 sm:text-right">
                              {new Date(mvt.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
