"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
  const adresse = formData.get("adresse") as string
  const statut = formData.get("statut") as string

  if (id) {
    await prisma.chantier.update({
      where: { id },
      data: {
        nom,
        adresse,
        statut
      }
    })
    revalidatePath("/chantiers")
    revalidatePath(`/chantiers/${id}`)
  }
}
