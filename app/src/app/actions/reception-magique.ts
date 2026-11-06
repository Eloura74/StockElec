"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type ReceptionItem = {
  reference: string
  designation: string
  quantite: number
}

export async function verifierReferencesConnues(references: string[]): Promise<string[]> {
  const cleanRefs = Array.from(new Set(references.map(r => r.trim()).filter(Boolean)))
  if (cleanRefs.length === 0) return []
  const matches = await prisma.article.findMany({
    where: {
      OR: [
        { reference: { in: cleanRefs } },
        { referenceFournisseur: { in: cleanRefs } },
      ],
    },
    select: {
      reference: true,
      referenceFournisseur: true,
    },
  })
  const result = new Set<string>()
  for (const m of matches) {
    if (m.reference) result.add(m.reference)
    if (m.referenceFournisseur) result.add(m.referenceFournisseur)
  }
  return Array.from(result)
}

export async function validerReceptionMagique(items: ReceptionItem[]) {
  try {
    const session = await getSession()
    if (!session || session.role !== "GERANT") {
      throw new Error("Non autorisé")
    }

    const report = {
      succes: 0,
      inconnus: [] as ReceptionItem[]
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.reference || item.quantite <= 0) continue
        
        // Chercher l'article par référence stricte
        const article = await tx.article.findFirst({
          where: {
            reference: item.reference
          }
        })

        if (article) {
          await tx.mouvement.create({
            data: {
              type: "Achat",
              quantite: item.quantite,
              articleId: article.id,
              utilisateur: session.username,
              observation: "Import Magique Fournisseur"
            }
          })
          report.succes++
        } else {
          report.inconnus.push(item)
        }
      }
    })

    revalidatePath("/mon-stock")
    revalidatePath("/mouvements")

    return { success: true, report }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
