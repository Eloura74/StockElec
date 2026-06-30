"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculerResteSurChantier } from "@/lib/stockUtils"

export async function getChantiers() {
  return prisma.chantier.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createChantier(formData: FormData) {
  const nom = formData.get("nom") as string

  await prisma.chantier.create({
    data: {
      nom,
      statut: "Actif"
    }
  })

  revalidatePath("/chantiers")
}

export async function deleteChantier(id: string) {
  await prisma.chantier.delete({
    where: { id }
  })
  revalidatePath("/chantiers")
}

export async function updateChantier(formData: FormData) {
  const id = formData.get("id") as string
  const nom = formData.get("nom") as string
  const statut = formData.get("statut") as string

  if (id) {
    await prisma.chantier.update({
      where: { id },
      data: {
        nom,
        statut
      }
    })
    revalidatePath("/chantiers")
    revalidatePath(`/chantiers/${id}`)
  }
}

export async function cloturerChantier(id: string) {
  // 1. Fetch chantier with its movements
  const chantier = await prisma.chantier.findUnique({
    where: { id },
    include: { mouvements: true }
  })

  if (!chantier) return

  // 2. Compute remaining stock on site
  const restes = calculerResteSurChantier(chantier.mouvements)

  // 3. Create auto-returns for remaining items
  const mouvementsARetourner = Object.entries(restes)
    .filter(([articleId, qty]) => qty > 0)
    .map(([articleId, qty]) => ({
      articleId,
      chantierId: id,
      type: "Retour",
      quantite: qty,
      utilisateur: "Système",
      observation: "Retour automatique suite à la clôture du chantier"
    }))

  if (mouvementsARetourner.length > 0) {
    await prisma.mouvement.createMany({
      data: mouvementsARetourner
    })
  }

  // 4. Also return all Outillages assigned to this chantier
  await prisma.outillage.updateMany({
    where: { chantierId: id },
    data: { 
      statut: "Disponible",
      chantierId: null,
      utilisateur: null
    }
  })

  // 5. Update status
  await prisma.chantier.update({
    where: { id },
    data: { statut: "Terminé" }
  })

  revalidatePath("/chantiers")
  revalidatePath(`/chantiers/${id}`)
  revalidatePath("/catalogue")
  revalidatePath("/outillage")
}
