"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type RetourInput = {
  chantierId: string
  username: string
  lignes: { articleId: string; quantite: number }[]
  observation?: string
}

export async function validerRetourChantier(data: RetourInput) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Non autorisé")

    const { chantierId, username, lignes, observation } = data

    await prisma.$transaction(async (tx) => {
      for (const ligne of lignes) {
        if (ligne.quantite <= 0) continue

        const article = await tx.article.findUnique({ where: { id: ligne.articleId } })
        if (!article) throw new Error("Article introuvable")

        // Créer le mouvement de type "Retour"
        await tx.mouvement.create({
          data: {
            type: "Retour",
            quantite: ligne.quantite,
            articleId: ligne.articleId,
            chantierId: chantierId,
            utilisateur: username,
            observation: observation || null,
          }
        })
      }
    })

    revalidatePath("/chantiers")
    revalidatePath("/mouvements")
    revalidatePath("/depart-matin")
    
    return { success: true }
  } catch (error: any) {
    console.error("Erreur retour chantier:", error)
    return { success: false, error: error.message }
  }
}
