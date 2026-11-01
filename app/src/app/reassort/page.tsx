import { getArticlesWithStocks } from "@/app/actions/articles"
import { ShoppingCart } from "lucide-react"
import { CommandeFournisseurCard } from "@/components/CommandeFournisseurCard"

export default async function ReassortPage() {
  const articles = await getArticlesWithStocks()
  
  // Filtrer les articles en alerte
  const aCommander = articles.map(article => {
    return { article, stockInfo: article.stockInfo }
  }).filter(item => item.stockInfo.enAlerte)

  // Grouper par fournisseur (le nom du fournisseur)
  const parFournisseur = aCommander.reduce((acc: any, item: any) => {
    const fn = item.article.fournisseur || "Fournisseur Inconnu"
    if (!acc[fn]) acc[fn] = []
    acc[fn].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
            Approvisionnements & Commandes
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Réassort Fournisseurs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Génération automatique des besoins de réapprovisionnement groupés par fournisseur (Rexel, Sonepar, etc.).
        </p>
      </div>

      {Object.keys(parFournisseur).length === 0 ? (
        <div className="rounded-xl border bg-white dark:bg-zinc-900 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-zinc-50">Tout est en ordre !</h3>
          <p className="mt-2 text-gray-500 dark:text-zinc-400">Aucun article n'est actuellement sous son seuil d'alerte.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(parFournisseur).map(([fournisseur, items]: [string, any]) => {
            const orderItems = items.map((item: any) => {
              const qteRecommandee = Math.max(0, (item.article.stockMinimum * 2) - item.stockInfo.stockDepot)
              const quantiteParBoite = item.article.quantiteParBoite || 1
              const boitesACommander = Math.ceil(qteRecommandee / quantiteParBoite)
              const suggestedQuantity = boitesACommander * quantiteParBoite

              return {
                articleId: item.article.id,
                designation: item.article.designation,
                reference: item.article.reference,
                referenceFournisseur: item.article.referenceFournisseur,
                stockDépôt: item.stockInfo.stockDepot,
                stockMinimum: item.article.stockMinimum,
                quantiteParBoite,
                unite: item.article.unite,
                suggestedQuantity
              }
            })

            return (
              <CommandeFournisseurCard 
                key={fournisseur} 
                fournisseur={fournisseur} 
                items={orderItems} 
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
