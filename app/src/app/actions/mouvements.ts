"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculerStocksDepuisAgregats } from "@/lib/stockUtils"
import { getSession } from "@/lib/auth"

export async function getMouvements(options?: { startDate?: Date, endDate?: Date }) {
  const where: any = {}
  if (options?.startDate || options?.endDate) {
    where.date = {}
    if (options.startDate) where.date.gte = options.startDate
    if (options.endDate) where.date.lte = options.endDate
  }

  return prisma.mouvement.findMany({
    where,
    include: {
      article: true,
      chantier: true
    },
    orderBy: { date: 'desc' },
    take: options?.startDate || options?.endDate ? 2000 : 200
  })
}

export async function createMouvement(formData: FormData) {
  const articleId = formData.get("articleId") as string
  const type = formData.get("type") as string
  const quantite = parseInt(formData.get("quantite") as string)
  const chantierId = formData.get("chantierId") as string || null
  const utilisateur = formData.get("utilisateur") as string || "Anonyme"
  const observation = formData.get("observation") as string || ""

  // Transaction pour créer le mouvement ET mettre à jour le stock
  // Dans une V3 complète, on aurait un StockEmplacement, 
  // mais ici on garde l'approche simple : on ne trace que Mouvement
  
  await prisma.mouvement.create({
    data: {
      articleId,
      type,
      quantite,
      chantierId: chantierId === "" ? null : chantierId,
      utilisateur,
      observation
    }
  })
  revalidatePath("/mouvements")
  revalidatePath("/catalogue")
  revalidatePath("/reassort")
  revalidatePath("/")
}

export async function deleteMouvement(id: string) {
  // Not used anymore directly by the UI to avoid data loss. Kept for admin use.
  await prisma.mouvement.delete({
    where: { id }
  })
  revalidatePath("/mouvements")
  revalidatePath("/catalogue")
  revalidatePath("/reassort")
  revalidatePath("/")
}

export async function annulerMouvement(id: string) {
  const mvt = await prisma.mouvement.findUnique({ where: { id } })
  if (!mvt) return;

  let typeInverse = "";
  if (mvt.type === "Achat" || mvt.type === "Retour" || mvt.type === "Correction_Plus") {
    typeInverse = "Correction_Moins";
  } else {
    typeInverse = "Correction_Plus";
  }

  await prisma.mouvement.create({
    data: {
      type: typeInverse,
      quantite: mvt.quantite,
      articleId: mvt.articleId,
      chantierId: mvt.chantierId,
      utilisateur: "Système",
      observation: `Annulation du mouvement ${mvt.type} du ${mvt.date.toLocaleDateString("fr-FR")}`
    }
  });

  revalidatePath("/mouvements")
  revalidatePath("/catalogue")
  revalidatePath("/reassort")
  revalidatePath("/")
}

export async function entrerStock(articleId: string, quantite: number) {
  await prisma.mouvement.create({
    data: {
      type: "Achat",
      quantite,
      articleId,
      observation: "Mise à jour rapide du stock",
      utilisateur: "Système"
    }
  })
  revalidatePath("/catalogue")
  revalidatePath("/reassort")
  revalidatePath("/")
}

export async function entrerStockRapide(formData: FormData) {
  const articleId = formData.get("articleId") as string
  const quantite = parseInt(formData.get("quantite") as string || "1")
  
  if (articleId && quantite > 0) {
    await entrerStock(articleId, quantite)
    revalidatePath(`/catalogue/${articleId}`)
  }
}

export async function ajusterStockDirect(formData: FormData) {
  const articleId = formData.get("articleId") as string
  const mode = (formData.get("mode") as string) || "entree"
  const valeur = parseInt(formData.get("quantite") as string || "0", 10)
  if (!articleId || Number.isNaN(valeur)) return

  const session = await getSession()
  const auteur = session?.username || "Gérant"

  if (mode === "entree" && valeur > 0) {
    await prisma.mouvement.create({
      data: {
        type: "Achat",
        quantite: valeur,
        articleId,
        utilisateur: auteur,
        observation: "Entrée rapide depuis la fiche article",
      },
    })
  } else if (mode === "sortie" && valeur > 0) {
    await prisma.mouvement.create({
      data: {
        type: "Correction_Moins",
        quantite: valeur,
        articleId,
        utilisateur: auteur,
        observation: "Sortie / retrait direct depuis la fiche article",
      },
    })
  } else if (mode === "fixer" && valeur >= 0) {
    const article = await prisma.article.findUnique({ where: { id: articleId } })
    if (!article) return
    const agregats = await prisma.mouvement.groupBy({
      by: ["articleId", "type", "chantierId"],
      where: { articleId },
      _sum: { quantite: true },
    })
    const s = calculerStocksDepuisAgregats(agregats).get(articleId)
    const stockActuel = article.stockInitial + (s?.stockDepot ?? 0)
    const delta = valeur - stockActuel
    if (delta !== 0) {
      await prisma.mouvement.create({
        data: {
          type: delta > 0 ? "Correction_Plus" : "Correction_Moins",
          quantite: Math.abs(delta),
          articleId,
          utilisateur: auteur,
          observation: `Ajustement direct du stock réel (${stockActuel} → ${valeur})`,
        },
      })
    }
  }

  revalidatePath("/catalogue")
  revalidatePath(`/catalogue/${articleId}`)
  revalidatePath("/mouvements")
  revalidatePath("/reassort")
  revalidatePath("/inventaire")
  revalidatePath("/")
}

export async function corrigerStock(formData: FormData) {
  const articleId = formData.get("articleId") as string
  const ecart = parseInt(formData.get("ecart") as string)
  const observation = formData.get("observation") as string || "Inventaire : Ajustement automatique"
  
  if (articleId && ecart !== 0 && !isNaN(ecart)) {
    await prisma.mouvement.create({
      data: {
        type: "Correction",
        quantite: ecart, // Can be positive or negative
        articleId,
        observation: observation,
        utilisateur: "Système"
      }
    })
    
    revalidatePath("/inventaire")
    revalidatePath("/catalogue")
    revalidatePath("/reassort")
    revalidatePath("/")
  }
}
