import { Article, Mouvement } from "@prisma/client"

export type StockInfo = {
  stockInitial: number
  stockDepot: number
  stockChantiersTotal: number
  enAlerte: boolean
}

/**
 * Calcule les stocks réels d'un article en se basant sur ses mouvements.
 * 
 * Logique:
 * Stock Dépôt = Stock Initial + Achat + Retour - Depart - Perte - Consomme (si consommé au dépôt, rare mais possible)
 * Stock Chantier = Depart (vers ce chantier) - Retour (de ce chantier) - Consomme (sur ce chantier) - Perte (sur ce chantier)
 */
export function calculerStockArticle(article: Article, mouvements: Mouvement[]): StockInfo {
  let stockDepot = article.stockInitial
  let stockChantiersTotal = 0

  mouvements.forEach(mvt => {
    switch (mvt.type) {
      case "Achat":
      case "Correction":
        stockDepot += mvt.quantite
        break
      case "Depart":
        stockDepot -= mvt.quantite
        stockChantiersTotal += mvt.quantite
        break
      case "Retour":
        stockChantiersTotal -= mvt.quantite
        stockDepot += mvt.quantite
        break
      case "Consomme":
      case "Perte":
        if (mvt.chantierId) {
          stockChantiersTotal -= mvt.quantite
        } else {
          stockDepot -= mvt.quantite
        }
        break
    }
  })

  // Auto-correction : si le stock chantier est négatif, c'est que l'utilisateur 
  // a fait un "Consommé" sur chantier sans faire de "Départ" au préalable.
  // On déduit donc ce manque directement du dépôt.
  if (stockChantiersTotal < 0) {
    stockDepot += stockChantiersTotal; // += car stockChantiersTotal est négatif
    stockChantiersTotal = 0;
  }

  return {
    stockInitial: article.stockInitial,
    stockDepot,
    stockChantiersTotal,
    enAlerte: stockDepot <= article.stockMinimum
  }
}

/**
 * Calcule le matériel restant (déployé) sur un chantier spécifique
 */
export function calculerResteSurChantier(mouvementsChantier: Mouvement[]): Record<string, number> {
  const stockParArticle: Record<string, number> = {}

  mouvementsChantier.forEach(mvt => {
    const artId = mvt.articleId
    if (stockParArticle[artId] === undefined) {
      stockParArticle[artId] = 0
    }

    if (mvt.type === "Depart") {
      stockParArticle[artId] += mvt.quantite
    } else if (mvt.type === "Retour" || mvt.type === "Consomme" || mvt.type === "Perte") {
      stockParArticle[artId] -= mvt.quantite
    }
  })

  // Auto-correction pour l'affichage (ne pas afficher de stock négatif)
  Object.keys(stockParArticle).forEach(artId => {
    if (stockParArticle[artId] < 0) {
      stockParArticle[artId] = 0
    }
  })

  return stockParArticle
}

export type AgregatMouvement = {
  articleId: string
  type: string
  chantierId: string | null
  _sum: { quantite: number | null }
}

/**
 * Calcule, à partir d'un `groupBy(['articleId','type','chantierId'])` sur les mouvements,
 * le delta de stock dépôt (hors stockInitial) et le stock total en chantier par article.
 * Source unique utilisée par le catalogue et par l'import Excel.
 */
export function calculerStocksDepuisAgregats(
  aggregations: AgregatMouvement[]
): Map<string, { stockDepot: number; stockChantiersTotal: number }> {
  const stockMap = new Map<string, { stockDepot: number; stockChantiersTotal: number }>()
  for (const agg of aggregations) {
    if (!stockMap.has(agg.articleId)) {
      stockMap.set(agg.articleId, { stockDepot: 0, stockChantiersTotal: 0 })
    }
    const current = stockMap.get(agg.articleId)!
    const sum = agg._sum.quantite || 0

    switch (agg.type) {
      case "Achat":
      case "Correction":
      case "Correction_Plus":
        current.stockDepot += sum
        break
      case "Correction_Moins":
        current.stockDepot -= sum
        break
      case "Depart":
        current.stockDepot -= sum
        current.stockChantiersTotal += sum
        break
      case "Retour":
        current.stockChantiersTotal -= sum
        current.stockDepot += sum
        break
      case "Consomme":
      case "Perte":
        if (agg.chantierId) {
          current.stockChantiersTotal -= sum
        } else {
          current.stockDepot -= sum
        }
        break
    }
  }

  stockMap.forEach((current) => {
    if (current.stockChantiersTotal < 0) {
      current.stockDepot += current.stockChantiersTotal
      current.stockChantiersTotal = 0
    }
  })

  return stockMap
}
