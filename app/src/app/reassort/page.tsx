import { getArticles } from "@/app/actions/articles"
import { calculerStockArticle } from "@/lib/stockUtils"
import { ShoppingCart } from "lucide-react"
import { ReassortButtons } from "@/components/ReassortButtons"

export default async function ReassortPage() {
  const articles = await getArticles()
  
  // Filtrer les articles en alerte
  const aCommander = articles.map(article => {
    const stockInfo = calculerStockArticle(article, article.mouvements)
    return { article, stockInfo }
  }).filter(item => item.stockInfo.enAlerte)

  // Grouper par fournisseur
  const parFournisseur = aCommander.reduce((acc: any, item) => {
    const fn = item.article.referenceFournisseur || "Fournisseur Inconnu"
    if (!acc[fn]) acc[fn] = []
    acc[fn].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Réassort & Commandes</h1>
      </div>

      {Object.keys(parFournisseur).length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Tout est en ordre !</h3>
          <p className="mt-2 text-gray-500">Aucun article n'est actuellement sous son seuil d'alerte.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(parFournisseur).map(([fournisseur, items]: [string, any]) => {
            const reassortItems = items.map((item: any) => {
              const qteRecommandee = Math.max(0, (item.article.stockMinimum * 2) - item.stockInfo.stockDepot)
              const quantiteParBoite = item.article.quantiteParBoite || 1
              const boitesACommander = Math.ceil(qteRecommandee / quantiteParBoite)
              return {
                articleId: item.article.id,
                reference: item.article.reference,
                designation: item.article.designation,
                unite: item.article.unite,
                quantiteParBoite,
                qteRecommandee,
                boitesACommander
              }
            })

            return (
              <div key={fournisseur} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="border-b bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{fournisseur}</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 inline-block">{items.length} références à commander</span>
                  </div>
                  <ReassortButtons fournisseur={fournisseur} items={reassortItems} />
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="pb-3 font-medium">Référence Interne</th>
                        <th className="pb-3 font-medium">Désignation</th>
                        <th className="pb-3 font-medium text-center">Stock Actuel</th>
                        <th className="pb-3 font-medium text-center">Seuil</th>
                        <th className="pb-3 font-medium text-center">Lot d'Achat</th>
                        <th className="pb-3 font-medium text-right text-blue-600">À Commander</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reassortItems.map((item: any) => (
                        <tr key={item.articleId} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{item.reference}</td>
                          <td className="py-3 text-gray-600">{item.designation}</td>
                          <td className="py-3 text-center text-red-600 font-bold">
                            {items.find((i: any) => i.article.id === item.articleId).stockInfo.stockDepot} {item.unite}
                          </td>
                          <td className="py-3 text-center text-gray-500">
                            {items.find((i: any) => i.article.id === item.articleId).article.stockMinimum}
                          </td>
                          <td className="py-3 text-center text-gray-500">
                            Par {item.quantiteParBoite}
                          </td>
                          <td className="py-3 text-right">
                            <span className="font-bold text-blue-600">{item.boitesACommander} boîtes</span>
                            <div className="text-xs text-gray-400">soit {item.boitesACommander * item.quantiteParBoite} {item.unite}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
