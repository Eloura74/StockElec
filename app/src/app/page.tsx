import { Package, Truck, AlertTriangle, TrendingDown, ArrowRight, Wrench, HardHat, ArrowRightLeft, FileText } from "lucide-react"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { calculerStockArticle } from "@/lib/stockUtils"
import { DashboardCharts } from "@/components/DashboardCharts"
import { ExportExcelComptableButton } from "@/components/ExportExcelComptableButton"

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
  
  // Trier les articles pour le Top 3 immobilisations
  const topImmobilisations = [...articles]
    .map(article => ({
      article,
      valeur: (calculerStockArticle(article, article.mouvements).stockDepot) * (article.prixUnitaire || 0)
    }))
    .filter(item => item.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 3);
  
  const recentMouvements = await prisma.mouvement.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      chantier: true
    }
  });

  // Export Excel Data Prep
  const dataDepot = articles.map(article => {
    const stock = calculerStockArticle(article, article.mouvements)
    return {
      "Référence": article.reference,
      "Désignation": article.designation,
      "Catégorie": article.categorie || "-",
      "Stock Dépôt": stock.stockDepot,
      "Prix Unitaire (€)": article.prixUnitaire || 0,
      "Valeur Totale (€)": stock.stockDepot * (article.prixUnitaire || 0)
    }
  })

  const chantiersComplets = await prisma.chantier.findMany({
    include: {
      mouvements: { include: { article: true } }
    }
  });

  const dataChantiers: any[] = [];
  chantiersComplets.forEach(chantier => {
    const materielMap = new Map<string, { article: any, quantite: number }>();
    chantier.mouvements.forEach((mvt: any) => {
      if (!materielMap.has(mvt.articleId)) materielMap.set(mvt.articleId, { article: mvt.article, quantite: 0 });
      const current = materielMap.get(mvt.articleId)!;
      if (mvt.type === 'Depart') current.quantite += mvt.quantite;
      if (mvt.type === 'Retour' || mvt.type === 'Consomme') current.quantite -= mvt.quantite;
    });

    materielMap.forEach(m => {
      if (m.quantite > 0) {
        dataChantiers.push({
          "Chantier": chantier.nom,
          "Statut": chantier.statut,
          "Référence": m.article.reference,
          "Désignation": m.article.designation,
          "Quantité sur site": m.quantite,
          "Valeur (€)": m.quantite * (m.article.prixUnitaire || 0)
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {articlesEnAlerte > 0 && (
        <Link href="/catalogue?alert=true" className="bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shadow-sm cursor-pointer">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div className="font-semibold text-sm sm:text-base">
              ⚠️ {articlesEnAlerte} article(s) en rupture ou sous le seuil d'alerte ! Cliquez ici pour les voir.
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-rose-500 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/catalogue" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 ring-1 ring-indigo-200 dark:ring-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <Package className="w-4 h-4" /> Nouvel Article
          </Link>
          <Link href="/chantiers" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 ring-1 ring-emerald-200 dark:ring-emerald-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <HardHat className="w-4 h-4" /> Nouveau Chantier
          </Link>
          <Link href="/reassort" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 ring-1 ring-amber-200 dark:ring-amber-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Faire un Réassort
          </Link>
          <Link href="/mouvements" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 ml-auto sm:ml-0">
            <FileText className="w-4 h-4" /> Mouvement manuel
          </Link>
          <div className="ml-auto sm:ml-0">
            <ExportExcelComptableButton dataDepot={dataDepot} dataChantiers={dataChantiers} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPIs */}
        <div className="rounded-xl border bg-linear-to-br from-white to-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 shadow-inner">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total Articles</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50 mt-1">{articlesCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-linear-to-br from-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 shadow-inner">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Chantiers Actifs</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50 mt-1">{chantiersActifsCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-linear-to-br from-white to-orange-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600 shadow-inner">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Valeur au Dépôt</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50 mt-1">{valeurTotaleDépôt.toFixed(2)} €</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-linear-to-br from-white to-purple-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600 shadow-inner">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Valeur Chantier</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50 mt-1">{valeurTotaleChantiers.toFixed(2)} €</h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-linear-to-br from-white to-red-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-100 p-3 text-red-600 shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Alertes Stock</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50 mt-1">{articlesEnAlerte}</h2>
            </div>
          </div>
        </div>
      </div>

      <DashboardCharts mouvementsRecents={recentMouvements} articles={articles} />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Top 3 Immobilisations */}
        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-zinc-950/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-zinc-50">Capital Immobilisé (Top 3)</h3>
          </div>
          <div className="p-6 space-y-4">
            {topImmobilisations.map((item, index) => (
              <div key={item.article.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-zinc-50 line-clamp-1 text-sm">{item.article.designation}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{item.article.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-zinc-50">{item.valeur.toFixed(2)} €</p>
                </div>
              </div>
            ))}
            {topImmobilisations.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">Aucune donnée financière.</p>
            )}
          </div>
        </div>
        {/* Alertes de stock */}
        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-zinc-950/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-zinc-50">Articles à recommander</h3>
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
                        <p className="font-medium text-gray-900 dark:text-zinc-50">{article.designation}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{article.reference}</p>
                        {raison && <p className="text-xs text-orange-600 mt-1">{raison}</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-red-600">{stockInfo.stockDepot} {article.unite}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Seuil: {article.stockMinimum}</span>
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
                <div className="p-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
                  Aucun article en rupture de stock.
                </div>
              )}
            
            {alertesDetails.length > 5 && (
              <div className="p-3 text-center bg-gray-50 dark:bg-zinc-950">
                <Link href="/catalogue" className="text-sm font-medium text-blue-600 hover:underline">
                  Voir toutes les alertes
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Historique récent */}
        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-zinc-950/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-zinc-50">Activité récente</h3>
            <Link href="/mouvements" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y">
            {recentMouvements.length > 0 ? recentMouvements.map((mvt) => (
              <div key={mvt.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-950">
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
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">
                    {mvt.quantite}x {mvt.article.reference}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {mvt.type} {mvt.chantier ? `- ${mvt.chantier.nom}` : ''}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  {new Date(mvt.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
                Aucun mouvement récent.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
