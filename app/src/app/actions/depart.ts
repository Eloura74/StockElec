"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type DepartInput = {
  chantierId: string,
  username: string,
  lignes: { articleId: string, quantite: number }[]
}

export async function validerDepartMatin({ chantierId, username, lignes }: DepartInput) {
  const session = await getSession()
  if (!session) return { error: "Non autorisé" }

  if (!lignes || lignes.length === 0) return { error: "Panier vide" }
  if (!chantierId) return { error: "Chantier manquant" }

  try {
    // Exécuter en transaction pour éviter les erreurs partielles
    await prisma.$transaction(async (tx: any) => {
      for (const ligne of lignes) {
        
        const article = await tx.article.findUnique({ where: { id: ligne.articleId } })
        if (!article) throw new Error("Article introuvable")

        // Créer le mouvement
        await tx.mouvement.create({
          data: {
            articleId: ligne.articleId,
            type: 'Depart',
            quantite: ligne.quantite,
            chantierId: chantierId,
            utilisateur: username // Le nom du Chef d'équipe !
          }
        })
      }
    })

    revalidatePath("/depart-matin")
    revalidatePath("/catalogue")
    revalidatePath(`/chantiers/${chantierId}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Erreur depart-matin:", error)
    return { error: error.message || "Erreur lors de l'enregistrement." }
  }
}
