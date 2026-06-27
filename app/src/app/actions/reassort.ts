"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function marquerFournisseurCommeCommande(lignesCommande: { articleId: string, quantiteUnites: number }[]) {
  const date = new Date()
  
  const mouvements = lignesCommande.map(ligne => ({
    articleId: ligne.articleId,
    type: "Achat",
    quantite: ligne.quantiteUnites,
    date: date,
    utilisateur: "Système (Réassort Auto)",
    observation: "Commande de réassort automatique"
  }))

  await prisma.mouvement.createMany({
    data: mouvements
  })

  revalidatePath("/reassort")
  revalidatePath("/catalogue")
  revalidatePath("/mouvements")
  revalidatePath("/")
}
