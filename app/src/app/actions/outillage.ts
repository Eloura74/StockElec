"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getOutillages() {
  return prisma.outillage.findMany({
    include: {
      chantier: true,
      mouvements: {
        orderBy: { date: 'desc' },
        take: 5
      }
    },
    orderBy: { nom: 'asc' }
  })
}

export async function createOutillage(formData: FormData) {
  const nom = formData.get("nom") as string
  const marque = formData.get("marque") as string || null
  const reference = (formData.get("reference") as string)?.trim() || null
  const valeur = parseFloat(formData.get("valeur") as string || "0")
  
  await prisma.outillage.create({
    data: {
      nom,
      marque,
      reference,
      valeur,
      statut: "Disponible"
    }
  })

  revalidatePath("/outillage")
  revalidatePath("/")
}

export async function updateOutillage(formData: FormData) {
  const id = formData.get("id") as string
  const nom = formData.get("nom") as string
  const marque = formData.get("marque") as string || null
  const reference = (formData.get("reference") as string)?.trim() || null
  const valeur = parseFloat(formData.get("valeur") as string || "0")

  if (id) {
    await prisma.outillage.update({
      where: { id },
      data: {
        nom,
        marque,
        reference,
        valeur
      }
    })
    revalidatePath("/outillage")
    revalidatePath("/")
  }
}

export async function deleteOutillage(id: string) {
  await prisma.outillage.delete({
    where: { id }
  })
  revalidatePath("/outillage")
  revalidatePath("/")
}

export async function emprunterOutillage(formData: FormData) {
  const outillageId = formData.get("outillageId") as string
  const chantierId = formData.get("chantierId") as string || null
  const utilisateur = formData.get("utilisateur") as string || "Anonyme"
  const type = formData.get("type") as string // "Emprunt", "Retour", "Réparation", "Perte"
  const observation = formData.get("observation") as string || ""

  // Si on emprunte
  if (type === "Emprunt" && chantierId) {
    await prisma.$transaction([
      prisma.mouvementOutillage.create({
        data: { outillageId, type, chantierId, utilisateur, observation }
      }),
      prisma.outillage.update({
        where: { id: outillageId },
        data: { statut: "En Chantier", chantierId, utilisateur }
      })
    ])
  } 
  // Si on retourne
  else if (type === "Retour") {
    await prisma.$transaction([
      prisma.mouvementOutillage.create({
        data: { outillageId, type, chantierId: null, utilisateur, observation }
      }),
      prisma.outillage.update({
        where: { id: outillageId },
        data: { statut: "Disponible", chantierId: null, utilisateur: null }
      })
    ])
  }
  // Si en réparation ou perte
  else if (type === "Réparation" || type === "Perte") {
    await prisma.$transaction([
      prisma.mouvementOutillage.create({
        data: { outillageId, type, chantierId: null, utilisateur, observation }
      }),
      prisma.outillage.update({
        where: { id: outillageId },
        data: { statut: type === "Réparation" ? "En Réparation" : "Perdu", chantierId: null, utilisateur: null }
      })
    ])
  }

  revalidatePath("/outillage")
  revalidatePath("/")
}
