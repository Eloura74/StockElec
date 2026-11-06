"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function getOutillages() {
  const rows = await prisma.outillage.findMany({
    include: {
      chantier: true,
      mouvements: {
        orderBy: { date: 'desc' },
        take: 5
      }
    },
    orderBy: { nom: 'asc' }
  })

  const maintenant = Date.now()
  return rows.map((outil) => {
    let joursSortie: number | null = null
    if (outil.statut === "En Chantier") {
      const dernierEmprunt = outil.mouvements.find((m) => m.type === "Emprunt")
      const dateRef = dernierEmprunt?.date || outil.updatedAt
      if (dateRef) {
        joursSortie = Math.max(0, Math.floor((maintenant - new Date(dateRef).getTime()) / (1000 * 60 * 60 * 24)))
      }
    }
    return {
      ...outil,
      joursSortie,
    }
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

export async function retournerOutillageRapide(outillageId: string) {
  if (!outillageId) return
  const session = await getSession()
  const utilisateur = session?.username || "Gérant"

  await prisma.$transaction([
    prisma.mouvementOutillage.create({
      data: {
        outillageId,
        type: "Retour",
        chantierId: null,
        utilisateur,
        observation: "Retour rapide au dépôt en 1 clic",
      },
    }),
    prisma.outillage.update({
      where: { id: outillageId },
      data: { statut: "Disponible", chantierId: null, utilisateur: null },
    }),
  ])

  revalidatePath("/outillage")
  revalidatePath(`/outillage/${outillageId}`)
  revalidatePath("/")
}
