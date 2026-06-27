import { getArticles } from "@/app/actions/articles"
import { calculerStockArticle } from "@/lib/stockUtils"
import { ShoppingCart, Copy, FileDown } from "lucide-react"

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
        <button 
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          // Dans une V5, on pourrait générer un PDF. Pour l'instant on garde une UI simple.
        >
          <ShoppingCart className="h-4 w-4" /> Préparer les commandes
        </button>
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
          {Object.entries(parFournisseur).map(([fournisseur, items]: [string, any]) => (
            <div key={fournisseur} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{fournisseur}</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{items.length} références à commander</span>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="pb-3 font-medium">Référence Interne</th>
                      <th className="pb-3 font-medium">Désignation</th>
                      <th className="pb-3 font-medium text-center">Stock Actuel</th>
                      <th className="pb-3 font-medium text-center">Seuil</th>
                      <th className="pb-3 font-medium text-right text-blue-600">Qté à Commander</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item: any) => {
                      const qteRecommandee = Math.max(0, (item.article.stockMinimum * 2) - item.stockInfo.stockDepot)
                      return (
                        <tr key={item.article.id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{item.article.reference}</td>
                          <td className="py-3 text-gray-600">{item.article.designation}</td>
                          <td className="py-3 text-center text-red-600 font-bold">{item.stockInfo.stockDepot} {item.article.unite}</td>
                          <td className="py-3 text-center text-gray-500">{item.article.stockMinimum}</td>
                          <td className="py-3 text-right font-bold text-blue-600">{qteRecommandee} {item.article.unite}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
