"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function corrigerStock(articleId: string, vraiStock: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "GERANT") {
      throw new Error("Non autorisé")
    }

    await prisma.$transaction(async (tx) => {
      // Calculer le stock actuel
      const mouvements = await tx.mouvement.findMany({
        where: { articleId }
      })

      let stockActuel = 0
      for (const m of mouvements) {
        if (['Achat', 'Retour', 'Correction_Plus'].includes(m.type)) stockActuel += m.quantite
        if (['Depart', 'Consomme', 'Perte', 'Correction_Moins'].includes(m.type)) stockActuel -= m.quantite
      }

      const difference = vraiStock - stockActuel

      if (difference === 0) {
        throw new Error("Le stock est déjà à " + vraiStock)
      }

      const type = difference > 0 ? "Correction_Plus" : "Correction_Moins"
      const quantite = Math.abs(difference)

      await tx.mouvement.create({
        data: {
          type,
          quantite,
          articleId,
          utilisateur: session.username,
          observation: `Inventaire rapide (Ancien stock: ${stockActuel})`
        }
      })
    })

    revalidatePath("/inventaire-rapide")
    revalidatePath("/mon-stock")
    revalidatePath("/mouvements")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
