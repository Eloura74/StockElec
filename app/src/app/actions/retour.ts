"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type TypeMouvementChantier = "Retour" | "Consomme" | "Perte"

export type RetourLigneInput = {
  articleId: string
  quantite: number
  /** Par défaut "Retour" (retour au dépôt). Peut aussi être "Consomme" (posé sur chantier) ou "Perte". */
  type?: TypeMouvementChantier
}

type RetourInput = {
  chantierId: string
  username: string
  lignes: RetourLigneInput[]
  observation?: string
}

const TYPES_AUTORISES: TypeMouvementChantier[] = ["Retour", "Consomme", "Perte"]

export async function validerRetourChantier(data: RetourInput) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Non autorisé")

    const { chantierId, username, lignes, observation } = data
    if (!chantierId) throw new Error("Chantier manquant")
    if (!lignes || lignes.length === 0) throw new Error("Aucune ligne à enregistrer")

    await prisma.$transaction(async (tx) => {
      for (const ligne of lignes) {
        const qte = Math.floor(Number(ligne.quantite) || 0)
        if (qte <= 0) continue

        const type: TypeMouvementChantier =
          ligne.type && TYPES_AUTORISES.includes(ligne.type) ? ligne.type : "Retour"

        const article = await tx.article.findUnique({ where: { id: ligne.articleId } })
        if (!article) throw new Error("Article introuvable")

        await tx.mouvement.create({
          data: {
            type,
            quantite: qte,
            articleId: ligne.articleId,
            chantierId,
            utilisateur: session.username || username,
            observation: observation || null,
          }
        })
      }
    })

    revalidatePath("/chantiers")
    revalidatePath(`/chantiers/${chantierId}`)
    revalidatePath("/catalogue")
    revalidatePath("/mouvements")
    revalidatePath("/reassort")
    revalidatePath("/depart-matin")
    revalidatePath("/")

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement."
    console.error("Erreur retour chantier:", error)
    return { success: false, error: message }
  }
}
