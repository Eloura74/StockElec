"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculerStocksDepuisAgregats, normaliserUnite } from "@/lib/stockUtils"
import { getSession } from "@/lib/auth"
import {
  construireIndexCatalogue,
  trouverArticleCatalogue,
} from "@/lib/article-matching"
import { parseNombre } from "@/lib/import-articles"

// Les server actions sont appelables directement : le middleware ne suffit pas à les protéger.
async function exigerSession(gerantSeulement = false) {
  const session = await getSession()
  if (!session || (gerantSeulement && session.role !== "GERANT")) {
    throw new Error("Non autorisé")
  }
  return session
}

export async function getArticles() {
  const articles = await prisma.article.findMany({
    orderBy: { reference: 'asc' }
  })
  return articles.map(art => ({
    ...art,
    unite: normaliserUnite(art.unite),
  }))
}

/**
 * Récupère uniquement les articles "actifs" (ayant un stock initial non nul,
 * un seuil d'alerte configuré, ou au moins un mouvement enregistré).
 * Sur un catalogue de 78 000+ tarifs fournisseurs importés, cela évite de charger
 * 78 000 lignes à stock 0 sur chaque changement d'onglet tout en conservant 100 %
 * des stocks réels, valorisations et alertes.
 */
export async function getArticlesActifsAvecStocks() {
  const aggregations = await prisma.mouvement.groupBy({
    by: ['articleId', 'type', 'chantierId'],
    _sum: { quantite: true }
  })

  const stockMap = calculerStocksDepuisAgregats(aggregations)
  const articleIdsAvecMouvements = Array.from(stockMap.keys())

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { stockInitial: { not: 0 } },
        { stockMinimum: { gt: 0 } },
        ...(articleIdsAvecMouvements.length > 0
          ? [{ id: { in: articleIdsAvecMouvements } }]
          : []),
      ],
    },
    orderBy: { reference: 'asc' },
  })

  return articles.map(art => {
    const s = stockMap.get(art.id) || { stockDepot: 0, stockChantiersTotal: 0 }
    const stockDepotFinal = art.stockInitial + s.stockDepot
    return {
      ...art,
      unite: normaliserUnite(art.unite),
      stockInfo: {
        stockInitial: art.stockInitial,
        stockDepot: stockDepotFinal,
        stockChantiersTotal: s.stockChantiersTotal,
        enAlerte: art.stockMinimum > 0 ? stockDepotFinal <= art.stockMinimum : stockDepotFinal < 0
      }
    }
  })
}

/**
 * Recherche rapide côté serveur dans tout le catalogue (78 000+ articles)
 * avec calcul exact du stock pour les résultats retournés.
 */
export async function rechercherArticlesCatalogue(query: string, limit = 40) {
  const q = query.trim()
  if (!q) return []

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { reference: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { referenceFournisseur: { contains: q, mode: 'insensitive' } },
        { marque: { contains: q, mode: 'insensitive' } },
        { emplacement: { contains: q, mode: 'insensitive' } },
        { codeBarre: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: [{ stockInitial: 'desc' }, { reference: 'asc' }],
  })

  if (articles.length === 0) return []

  const ids = articles.map(a => a.id)
  const aggregations = await prisma.mouvement.groupBy({
    by: ['articleId', 'type', 'chantierId'],
    where: { articleId: { in: ids } },
    _sum: { quantite: true },
  })
  const stockMap = calculerStocksDepuisAgregats(aggregations)

  return articles.map(art => {
    const s = stockMap.get(art.id) || { stockDepot: 0, stockChantiersTotal: 0 }
    const stockDepotFinal = art.stockInitial + s.stockDepot
    return {
      ...art,
      unite: normaliserUnite(art.unite),
      stockInfo: {
        stockInitial: art.stockInitial,
        stockDepot: stockDepotFinal,
        stockChantiersTotal: s.stockChantiersTotal,
        enAlerte: art.stockMinimum > 0 ? stockDepotFinal <= art.stockMinimum : stockDepotFinal < 0,
      },
    }
  })
}

/**
 * Recherche instantanée d'un article par son code-barres ou sa référence exacte.
 */
export async function trouverArticleParCodeBarre(code: string) {
  const trimmed = code.trim()
  if (!trimmed) return null

  const art = await prisma.article.findFirst({
    where: {
      OR: [
        { codeBarre: trimmed },
        { reference: { equals: trimmed, mode: 'insensitive' } },
        { referenceFournisseur: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
  })

  if (!art) return null

  const aggregations = await prisma.mouvement.groupBy({
    by: ['articleId', 'type', 'chantierId'],
    where: { articleId: art.id },
    _sum: { quantite: true },
  })
  const stockMap = calculerStocksDepuisAgregats(aggregations)
  const s = stockMap.get(art.id) || { stockDepot: 0, stockChantiersTotal: 0 }
  const stockDepotFinal = art.stockInitial + s.stockDepot

  return {
    ...art,
    unite: normaliserUnite(art.unite),
    stockInfo: {
      stockInitial: art.stockInitial,
      stockDepot: stockDepotFinal,
      stockChantiersTotal: s.stockChantiersTotal,
      enAlerte: art.stockMinimum > 0 ? stockDepotFinal <= art.stockMinimum : stockDepotFinal < 0,
    },
  }
}

export async function getArticlesWithStocks() {
  const articles = await prisma.article.findMany({
    orderBy: { reference: 'asc' }
  })
  
  const aggregations = await prisma.mouvement.groupBy({
    by: ['articleId', 'type', 'chantierId'],
    _sum: { quantite: true }
  })
  
  const stockMap = calculerStocksDepuisAgregats(aggregations)

  return articles.map(art => {
    const s = stockMap.get(art.id) || { stockDepot: 0, stockChantiersTotal: 0 }
    const stockDepotFinal = art.stockInitial + s.stockDepot
    return {
      ...art,
      unite: normaliserUnite(art.unite),
      stockInfo: {
        stockInitial: art.stockInitial,
        stockDepot: stockDepotFinal,
        stockChantiersTotal: s.stockChantiersTotal,
        enAlerte: art.stockMinimum > 0 ? stockDepotFinal <= art.stockMinimum : stockDepotFinal < 0
      }
    }
  })
}

export async function createArticle(formData: FormData) {
  await exigerSession()
  const reference = (formData.get("reference") as string)?.trim()
  const designation = formData.get("designation") as string
  const categorie = formData.get("categorie") as string
  const unite = normaliserUnite(formData.get("unite") as string)
  const stockMinimum = parseInt(formData.get("stockMinimum") as string || "0")
  const stockInitial = parseInt(formData.get("stockInitial") as string || "0")
  const prixUnitaire = Math.max(0, parseNombre(formData.get("prixUnitaire")) ?? 0)
  const quantiteParBoite = parseInt(formData.get("quantiteParBoite") as string || "1")
  const retourAttendu = formData.get("retourAttendu") === "on"
  const referenceFournisseur = (formData.get("referenceFournisseur") as string)?.trim() || null
  const fournisseur = (formData.get("fournisseur") as string)?.trim() || null
  const marque = (formData.get("marque") as string)?.trim() || null
  const emplacement = (formData.get("emplacement") as string)?.trim() || null
  const codeBarre = (formData.get("codeBarre") as string)?.trim() || null

  const [tousArticles, tousAliases] = await Promise.all([
    prisma.article.findMany(),
    prisma.referenceAlias.findMany(),
  ])
  const index = construireIndexCatalogue(tousArticles, tousAliases)
  const existant = trouverArticleCatalogue(index, {
    reference,
    codeBarre,
    fournisseur,
    referenceFournisseur,
  }).article

  if (existant) {
    await prisma.article.update({
      where: { id: existant.id },
      data: {
        designation: designation || existant.designation,
        categorie: categorie || existant.categorie,
        unite: unite || existant.unite,
        stockMinimum: stockMinimum || existant.stockMinimum,
        quantiteParBoite: quantiteParBoite || existant.quantiteParBoite,
        ...(prixUnitaire > 0 ? { prixUnitaire } : {}),
        ...(referenceFournisseur ? { referenceFournisseur } : {}),
        ...(fournisseur ? { fournisseur } : {}),
        ...(marque ? { marque } : {}),
        ...(emplacement ? { emplacement } : {}),
        ...(codeBarre ? { codeBarre } : {}),
        retourAttendu,
      } as any,
    })
  } else {
    await prisma.article.create({
      data: {
        reference,
        designation,
        categorie,
        unite,
        stockInitial,
        stockMinimum,
        quantiteParBoite,
        prixUnitaire,
        referenceFournisseur,
        fournisseur,
        marque,
        emplacement,
        codeBarre,
        retourAttendu,
      } as any
    })
  }

  revalidatePath("/catalogue")
  revalidatePath("/mouvements")
  revalidatePath("/reassort")
}

export async function deleteArticle(id: string) {
  await exigerSession(true)
  await prisma.article.delete({
    where: { id }
  })
  revalidatePath("/catalogue")
  revalidatePath("/mouvements")
  revalidatePath("/reassort")
}

export async function updateArticle(formData: FormData) {
  await exigerSession()
  const id = formData.get("id") as string
  const reference = formData.get("reference") as string
  const designation = formData.get("designation") as string
  const categorie = formData.get("categorie") as string
  const unite = normaliserUnite(formData.get("unite") as string)
  const stockMinimum = parseInt(formData.get("stockMinimum") as string || "0")
  const quantiteParBoite = parseInt(formData.get("quantiteParBoite") as string || "1")
  const prixUnitaire = Math.max(0, parseNombre(formData.get("prixUnitaire")) ?? 0)
  const referenceFournisseur = (formData.get("referenceFournisseur") as string)?.trim() || null
  const fournisseur = (formData.get("fournisseur") as string)?.trim() || null
  const marque = (formData.get("marque") as string)?.trim() || null
  const emplacement = (formData.get("emplacement") as string)?.trim() || null
  const codeBarre = (formData.get("codeBarre") as string)?.trim() || null
  const retourAttendu = formData.get("retourAttendu") === "on"

  if (id) {
    await prisma.article.update({
      where: { id },
      data: {
        reference,
        designation,
        categorie,
        unite,
        stockMinimum,
        quantiteParBoite,
        prixUnitaire,
        referenceFournisseur,
        fournisseur,
        marque,
        emplacement,
        codeBarre,
        retourAttendu,
      } as any
    })
    revalidatePath("/catalogue")
    revalidatePath(`/catalogue/${id}`)
    revalidatePath("/mouvements")
    revalidatePath("/reassort")
    revalidatePath("/")
  }
}

export async function creerArticleEtStock(formData: FormData) {
  await exigerSession()
  const reference = (formData.get("reference") as string)?.trim() || ""
  const designation = formData.get("designation") as string
  const fournisseur = (formData.get("fournisseur") as string)?.trim() || null
  const codeBarre = (formData.get("codeBarre") as string)?.trim() || null
  const quantiteReelle = parseInt(formData.get("quantiteReelle") as string || "0")
  const observation = formData.get("observation") as string || "Création via Scan & Go"

  const [tousArticles, tousAliases] = await Promise.all([
    prisma.article.findMany(),
    prisma.referenceAlias.findMany(),
  ])
  const index = construireIndexCatalogue(tousArticles, tousAliases)
  const existant = trouverArticleCatalogue(index, {
    reference,
    codeBarre,
    fournisseur,
    referenceFournisseur: reference,
  }).article

  const article = existant
    ? await prisma.article.update({
        where: { id: existant.id },
        data: {
          ...(codeBarre && !existant.codeBarre ? { codeBarre } : {}),
          ...(fournisseur && !existant.fournisseur ? { fournisseur } : {}),
        },
      })
    : await prisma.article.create({
        data: {
          reference: reference || `REF-${Date.now()}`,
          designation,
          fournisseur,
          codeBarre,
          stockInitial: 0,
          categorie: "À classer",
          unite: "u"
        } as any
      })

  if (quantiteReelle > 0) {
    await prisma.mouvement.create({
      data: {
        type: "Correction",
        quantite: quantiteReelle,
        articleId: article.id,
        observation: observation,
        utilisateur: "Magasinier"
      }
    })
  }

  revalidatePath("/inventaire")
  revalidatePath("/catalogue")
  
  return article.id
}

export async function updateInfosRapides(formData: FormData) {
  await exigerSession()
  const id = formData.get("id") as string
  const designation = (formData.get("designation") as string)?.trim()
  const fournisseur = (formData.get("fournisseur") as string)?.trim() || null
  const reference = (formData.get("reference") as string)?.trim() || null

  if (id) {
    await prisma.article.update({
      where: { id },
      data: {
        ...(designation ? { designation } : {}),
        ...(fournisseur !== null ? { fournisseur } : {}),
        ...(reference !== null ? { reference } : {})
      }
    })
    revalidatePath("/inventaire")
    revalidatePath("/catalogue")
  }
}
