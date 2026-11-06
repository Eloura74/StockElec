"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculerResteSurChantier } from "@/lib/stockUtils"
import { logAudit } from "@/lib/audit"
import { chargerAdressesChantiers, sauvegarderAdresseChantier } from "@/lib/chantier-adresse"

export async function getChantiers() {
  const [chantiers, adressesMap] = await Promise.all([
    prisma.chantier.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    chargerAdressesChantiers(),
  ])
  return chantiers.map(c => ({
    ...c,
    adresse: adressesMap.get(c.id) || null,
  }))
}

export async function createChantier(formData: FormData) {
  const nom = (formData.get("nom") as string)?.trim()
  const adresse = (formData.get("adresse") as string)?.trim() || null
  if (!nom) return

  const chantier = await prisma.chantier.create({
    data: {
      nom,
      statut: "Actif"
    }
  })

  if (adresse) {
    await sauvegarderAdresseChantier(chantier.id, adresse)
  }

  revalidatePath("/chantiers")
}

export async function deleteChantier(id: string) {
  const chantier = await prisma.chantier.findUnique({ where: { id } })
  if (!chantier) return

  await prisma.chantier.delete({
    where: { id }
  })
  
  await logAudit('SUPPRESSION', 'CHANTIER', `Le chantier "${chantier.nom}" a été supprimé définitivement.`)
  
  revalidatePath("/chantiers")
}

export async function updateChantier(formData: FormData) {
  const id = formData.get("id") as string
  const nom = (formData.get("nom") as string)?.trim()
  const statut = formData.get("statut") as string
  const adresse = (formData.get("adresse") as string)?.trim() || null

  if (id && nom) {
    await prisma.chantier.update({
      where: { id },
      data: {
        nom,
        statut
      }
    })
    await sauvegarderAdresseChantier(id, adresse)
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

  await logAudit('MODIFICATION', 'CHANTIER', `Le chantier "${chantier.nom}" a été clôturé avec rapatriement automatique du matériel.`)

  revalidatePath("/chantiers")
  revalidatePath(`/chantiers/${id}`)
  revalidatePath("/catalogue")
  revalidatePath("/outillage")
}
