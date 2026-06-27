import { getArticles, createArticle, deleteArticle } from "@/app/actions/articles"
import { entrerStockRapide } from "@/app/actions/mouvements"
import { Plus, AlertTriangle, Trash2 } from "lucide-react"
import { DeleteButton } from "@/components/DeleteButton"
import { calculerStockArticle } from "@/lib/stockUtils"
import Link from "next/link"

export default async function CataloguePage() {
  const articles = await getArticles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Articles</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire d'ajout */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50/50 px-4 py-3 font-medium">
              Ajouter un article
            </div>
            <form action={createArticle} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Référence</label>
                <input required name="reference" type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="ex: VIS-6X60" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Désignation</label>
                <input required name="designation" type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="ex: Vis béton 6x60" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                  <select name="categorie" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
                    <option value="Consommable">Consommable</option>
                    <option value="Outillage">Outillage</option>
                    <option value="EPI">EPI</option>
                    <option value="Matériaux">Matériaux</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock initial</label>
                  <input name="stockInitial" type="number" defaultValue="0" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unité</label>
                  <input name="unite" type="text" defaultValue="u" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Seuil alerte</label>
                  <input name="stockMinimum" type="number" defaultValue="0" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Réf. Fournisseur (optionnel)</label>
                <input name="referenceFournisseur" type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prix unitaire (€)</label>
                <input name="prixUnitaire" type="number" step="0.01" defaultValue="0" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input id="retour" name="retourAttendu" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="retour" className="text-sm text-gray-700">Retour de chantier attendu (Outillage)</label>
              </div>
              
              <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Plus className="h-4 w-4" />
                Ajouter l'article
              </button>
            </form>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Désignation</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Réf. Fourn.</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Stock Dépôt</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">En Chantier</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Seuil</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Aucun article dans le catalogue.
                      </td>
                    </tr>
                  ) : (
                    articles.map((article: any) => {
                      const stockInfo = calculerStockArticle(article, article.mouvements)
                      const enAlerte = stockInfo.enAlerte
                      return (
                        <tr key={article.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{article.reference}</td>
                          <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                <Link href={`/catalogue/${article.id}`} className="hover:text-blue-600 hover:underline">
                                  {article.designation}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">{article.reference}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {article.referenceFournisseur || '-'}
                          </td>
                          <td className={`px-4 py-3 text-center font-bold ${enAlerte ? 'text-red-600' : 'text-green-600'}`}>
                            {stockInfo.stockDepot} {article.unite}
                            {enAlerte && <AlertTriangle className="inline-block ml-1 h-4 w-4" />}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {stockInfo.stockChantiersTotal} {article.unite}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {article.stockMinimum}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <form action={entrerStockRapide} className="flex items-center gap-1">
                                <input type="hidden" name="articleId" value={article.id} />
                                <input type="number" name="quantite" defaultValue="1" min="1" className="w-16 rounded border px-2 py-1 text-xs" />
                                <button type="submit" title="Ajouter du stock" className="rounded bg-green-100 p-1 text-green-700 hover:bg-green-200">
                                  +
                                  +
                                </button>
                              </form>
                              <Link href={`/catalogue/${article.id}`} className="rounded p-1 text-blue-500 hover:bg-blue-50" title="Modifier/Détails">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </Link>
                              <form action={deleteArticle.bind(null, article.id)}>
                                <DeleteButton message="Supprimer cet article va aussi supprimer son historique. Continuer ?" />
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
          </div>
        </div>
      </div>
    </div>
  )
}
