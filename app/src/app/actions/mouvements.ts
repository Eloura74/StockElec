"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getMouvements() {
  return prisma.mouvement.findMany({
    include: {
      article: true,
      chantier: true
    },
    orderBy: { date: 'desc' }
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
  await prisma.mouvement.delete({
    where: { id }
  })
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
  }
}
