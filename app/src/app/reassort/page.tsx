import { getArticlesActifsAvecStocks } from "@/app/actions/articles"
import { ShoppingCart, AlertTriangle, Building2 } from "lucide-react"
import { CommandeFournisseurCard } from "@/components/CommandeFournisseurCard"

export default async function ReassortPage() {
  const articles = await getArticlesActifsAvecStocks()

  // Filtrer les articles en alerte
  const aCommander = articles
    .map((article) => {
      return { article, stockInfo: article.stockInfo }
    })
    .filter((item) => item.stockInfo.enAlerte)

  // Grouper par fournisseur (le nom du fournisseur)
  const parFournisseur = aCommander.reduce((acc: any, item: any) => {
    const fn = item.article.fournisseur || "Fournisseur Inconnu"
    if (!acc[fn]) acc[fn] = []
    acc[fn].push(item)
    return acc
  }, {})

  const nbFournisseurs = Object.keys(parFournisseur).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Génération automatique des besoins de réapprovisionnement groupés par fournisseur (Rexel, Sonepar, Legrand, etc.).
          </p>
        </div>

        {/* Capsules KPIs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">
                En Alerte
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {aCommander.length} réf. à commander
              </p>
            </div>
          </div>

          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">
                Grossistes
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {nbFournisseurs} commande{nbFournisseurs > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {nbFournisseurs === 0 ? (
        <div className="prestige-sheen rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-12 text-center shadow-2xs animate-slide-up">
          <div className="radar-beacon animate-float-slow mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 ring-1 ring-emerald-200/70 dark:ring-emerald-800/40">
            <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Tout est en ordre !
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Aucun article n&apos;est actuellement sous son seuil d&apos;alerte.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(parFournisseur).map(([fournisseur, items]: [string, any]) => {
            const orderItems = items.map((item: any) => {
              const qteRecommandee = Math.max(
                0,
                item.article.stockMinimum * 2 - item.stockInfo.stockDepot
              )
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
                prixUnitaire: item.article.prixUnitaire || 0,
                suggestedQuantity,
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
