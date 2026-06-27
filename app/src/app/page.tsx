import { Package, Truck, AlertTriangle, TrendingDown, ArrowRight, Wrench } from "lucide-react"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { calculerStockArticle } from "@/lib/stockUtils"
import { DashboardCharts } from "@/components/DashboardCharts"

export default async function Home() {
  // Récupérer les articles avec leurs mouvements pour calculer les vrais stocks
  const articles = await prisma.article.findMany({
    include: { mouvements: true }
  })
  
  // Calculer les stats réelles
  let articlesEnAlerte = 0
  let valeurTotaleDépôt = 0
  let valeurTotaleChantiers = 0
  
  const alertesDetails = []

  for (const article of articles) {
    const stock = calculerStockArticle(article, article.mouvements)
    const prix = article.prixUnitaire || 0
    valeurTotaleDépôt += stock.stockDepot * prix
    valeurTotaleChantiers += stock.stockChantiersTotal * prix
    
    if (stock.enAlerte) {
      articlesEnAlerte++
      alertesDetails.push({
        article,
        stock
      })
    }
  }

  const articlesCount = articles.length;
  const chantiersActifsCount = await prisma.chantier.count({ where: { statut: 'Actif' } });
  
  const recentMouvements = await prisma.mouvement.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      article: true,
      chantier: true
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <div className="flex items-center gap-2">
          <Link href="/mouvements" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Nouveau mouvement
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPIs */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Articles</p>
              <h2 className="text-2xl font-bold text-gray-900">{articlesCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Chantiers Actifs</p>
              <h2 className="text-2xl font-bold text-gray-900">{chantiersActifsCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Valeur au Dépôt</p>
              <h2 className="text-2xl font-bold text-gray-900">{valeurTotaleDépôt.toFixed(2)} €</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Valeur en Chantier</p>
              <h2 className="text-2xl font-bold text-gray-900">{valeurTotaleChantiers.toFixed(2)} €</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Alertes Stock</p>
              <h2 className="text-2xl font-bold text-gray-900">{articlesEnAlerte}</h2>
            </div>
          </div>
        </div>
      </div>

      <DashboardCharts mouvementsRecents={recentMouvements} articles={articles} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alertes de stock */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Articles à recommander</h3>
            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">{articlesEnAlerte} alertes</span>
          </div>
          <div className="p-6">
              {articles.map((article: any) => {
                const stockInfo = calculerStockArticle(article, article.mouvements)
                if (!stockInfo.enAlerte) return null;

                // Trouver le dernier mouvement qui a fait baisser le stock
                const derniersMouvements = (article.mouvements || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const dernierMvt = derniersMouvements.find((m: any) => m.type === 'Depart' || m.type === 'Consomme' || m.type === 'Perte');
                let raison = "";
                if (dernierMvt) {
                  raison = `Dernière baisse : ${dernierMvt.type} (${dernierMvt.quantite}) le ${new Date(dernierMvt.date).toLocaleDateString('fr-FR')}`;
                }

                // Quantité à commander = (seuil * 2) - stock
                const aCommander = Math.max(0, (article.stockMinimum * 2) - stockInfo.stockDepot);

                return (
                  <div key={article.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-red-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{article.designation}</p>
                        <p className="text-xs text-gray-500">{article.reference}</p>
                        {raison && <p className="text-xs text-orange-600 mt-1">{raison}</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-red-600">{stockInfo.stockDepot} {article.unite}</span>
                        <span className="text-xs text-gray-500">Seuil: {article.stockMinimum}</span>
                      </div>
                      {aCommander > 0 && (
                        <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md mt-1">
                          À commander : <b>{aCommander}</b>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {articlesEnAlerte === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Aucun article en rupture de stock.
                </div>
              )}
            
            {alertesDetails.length > 5 && (
              <div className="p-3 text-center bg-gray-50">
                <Link href="/catalogue" className="text-sm font-medium text-blue-600 hover:underline">
                  Voir toutes les alertes
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Historique récent */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Activité récente</h3>
            <Link href="/mouvements" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y">
            {recentMouvements.length > 0 ? recentMouvements.map((mvt) => (
              <div key={mvt.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <div className={`rounded-full p-2 ${
                  mvt.type === 'Depart' ? 'bg-orange-100 text-orange-600' :
                  mvt.type === 'Retour' ? 'bg-blue-100 text-blue-600' :
                  mvt.type === 'Consomme' ? 'bg-purple-100 text-purple-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {mvt.type === 'Depart' ? <ArrowRight className="h-4 w-4" /> : 
                   mvt.type === 'Retour' ? <TrendingDown className="h-4 w-4" /> :
                   <Package className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {mvt.quantite}x {mvt.article.reference}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mvt.type} {mvt.chantier ? `- ${mvt.chantier.nom}` : ''}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(mvt.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucun mouvement récent.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
