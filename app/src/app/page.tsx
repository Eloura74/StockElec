import prisma from "@/lib/prisma"
import { getArticlesWithStocks } from "@/app/actions/articles"
import { DynamicDashboardClient } from "@/components/DynamicDashboardClient"

export default async function Home() {
  const articles = await getArticlesWithStocks()
  
  // 1. Calculer les statistiques réelles de stock
  let articlesEnAlerte = 0
  let valeurTotaleDépôt = 0
  let valeurTotaleChantiers = 0
  let articlesEnStockCount = 0
  let totalPiecesStock = 0
  
  const alertesList = []

  for (const article of articles) {
    const stock = article.stockInfo
    const prix = article.prixUnitaire || 0
    valeurTotaleDépôt += stock.stockDepot * prix
    valeurTotaleChantiers += stock.stockChantiersTotal * prix
    
    if (stock.stockDepot > 0 || stock.stockChantiersTotal > 0) {
      articlesEnStockCount++
      totalPiecesStock += Math.max(0, stock.stockDepot) + Math.max(0, stock.stockChantiersTotal)
    }

    if (stock.enAlerte) {
      articlesEnAlerte++
      const aCommander = Math.max(0, (article.stockMinimum * 2) - stock.stockDepot)
      alertesList.push({
        id: article.id,
        reference: article.reference,
        designation: article.designation,
        categorie: article.categorie,
        unite: article.unite || 'u',
        stockDepot: stock.stockDepot,
        stockMinimum: article.stockMinimum,
        prixUnitaire: prix,
        aCommander
      })
    }
  }

  const articlesCount = articles.length;
  const chantiersActifsCount = await prisma.chantier.count({ where: { statut: 'Actif' } });
  
  // 2. Top 3 immobilisations
  const topImmobilisations = [...articles]
    .map(article => ({
      article,
      valeur: article.stockInfo.stockDepot * (article.prixUnitaire || 0)
    }))
    .filter(item => item.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 3);
  
  // 3. Mouvements récents
  const recentMouvements = await prisma.mouvement.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      chantier: true,
      article: true
    }
  });

  // 4. Données complètes des chantiers et matériel affecté
  const chantiersComplets = await prisma.chantier.findMany({
    include: {
      mouvements: { include: { article: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const dataChantiers: any[] = [];
  const chantiersList = chantiersComplets.map(chantier => {
    const materielMap = new Map<string, { article: any, quantite: number }>();
    chantier.mouvements.forEach((mvt: any) => {
      if (!materielMap.has(mvt.articleId)) materielMap.set(mvt.articleId, { article: mvt.article, quantite: 0 });
      const current = materielMap.get(mvt.articleId)!;
      if (mvt.type === 'Depart') current.quantite += mvt.quantite;
      if (mvt.type === 'Retour' || mvt.type === 'Consomme') current.quantite -= mvt.quantite;
    });

    let valeurSurSite = 0;
    let materielCount = 0;
    const materielDetails: any[] = [];

    materielMap.forEach(m => {
      if (m.quantite > 0) {
        const itemVal = m.quantite * (m.article.prixUnitaire || 0);
        valeurSurSite += itemVal;
        materielCount++;
        materielDetails.push({
          reference: m.article.reference,
          designation: m.article.designation,
          quantite: m.quantite,
          prixUnitaire: m.article.prixUnitaire || 0
        });

        dataChantiers.push({
          "Chantier": chantier.nom,
          "Statut": chantier.statut,
          "Référence": m.article.reference,
          "Désignation": m.article.designation,
          "Quantité sur site": m.quantite,
          "Valeur (€)": itemVal
        });
      }
    });

    return {
      id: chantier.id,
      nom: chantier.nom,
      statut: chantier.statut,
      adresse: (chantier as any).adresse || null,
      client: (chantier as any).client || null,
      materielCount,
      valeurSurSite,
      materielDetails
    };
  });

  // 5. Données d'export Excel pour le Dépôt
  const dataDepot = articles.map(article => {
    const stock = article.stockInfo
    return {
      "Référence": article.reference,
      "Désignation": article.designation,
      "Catégorie": article.categorie || "-",
      "Stock Dépôt": stock.stockDepot,
      "Prix Unitaire (€)": article.prixUnitaire || 0,
      "Valeur Totale (€)": stock.stockDepot * (article.prixUnitaire || 0)
    }
  });

  return (
    <DynamicDashboardClient
      articlesCount={articlesCount}
      articlesEnStockCount={articlesEnStockCount}
      totalPiecesStock={totalPiecesStock}
      chantiersActifsCount={chantiersActifsCount}
      valeurTotaleDépôt={valeurTotaleDépôt}
      valeurTotaleChantiers={valeurTotaleChantiers}
      articlesEnAlerte={articlesEnAlerte}
      chantiersList={chantiersList}
      alertesList={alertesList}
      topImmobilisations={topImmobilisations}
      recentMouvements={recentMouvements}
      dataDepot={dataDepot}
      dataChantiers={dataChantiers}
      allArticles={articles}
    />
  );
}
