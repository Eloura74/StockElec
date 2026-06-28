"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getArticles() {
  return prisma.article.findMany({
    include: { mouvements: true },
    orderBy: { reference: 'asc' }
  })
}

export async function createArticle(formData: FormData) {
  const reference = formData.get("reference") as string
  const designation = formData.get("designation") as string
  const categorie = formData.get("categorie") as string
  const unite = formData.get("unite") as string
  const stockMinimum = parseInt(formData.get("stockMinimum") as string || "0")
  const stockInitial = parseInt(formData.get("stockInitial") as string || "0")
  const prixUnitaire = parseFloat(formData.get("prixUnitaire") as string || "0")
  const quantiteParBoite = parseInt(formData.get("quantiteParBoite") as string || "1")
  const retourAttendu = formData.get("retourAttendu") === "on"
  const referenceFournisseur = formData.get("referenceFournisseur") as string || null
  const fournisseur = formData.get("fournisseur") as string || null
  const codeBarre = formData.get("codeBarre") as string || null

  await prisma.article.create({
    data: {
      reference,
      designation,
      categorie,
      unite,
      stockInitial,
      stockMinimum,
      quantiteParBoite,
      prixUnitaire,
      referenceFournisseur,
      fournisseur,
      codeBarre,
      retourAttendu,
    }
  })

  revalidatePath("/catalogue")
}

export async function deleteArticle(id: string) {
  await prisma.article.delete({
    where: { id }
  })
  revalidatePath("/catalogue")
}

export async function updateArticle(formData: FormData) {
  const id = formData.get("id") as string
  const reference = formData.get("reference") as string
  const designation = formData.get("designation") as string
  const categorie = formData.get("categorie") as string
  const unite = formData.get("unite") as string
  const stockMinimum = parseInt(formData.get("stockMinimum") as string || "0")
  const quantiteParBoite = parseInt(formData.get("quantiteParBoite") as string || "1")
  const prixUnitaire = parseFloat(formData.get("prixUnitaire") as string || "0")
  const referenceFournisseur = formData.get("referenceFournisseur") as string || null
  const fournisseur = formData.get("fournisseur") as string || null
  const codeBarre = formData.get("codeBarre") as string || null

  if (id) {
    await prisma.article.update({
      where: { id },
      data: {
        reference,
        designation,
        categorie,
        unite,
        stockMinimum,
        quantiteParBoite,
        prixUnitaire,
        referenceFournisseur,
        fournisseur,
        codeBarre,
      }
    })
    revalidatePath("/catalogue")
    revalidatePath(`/catalogue/${id}`)
    revalidatePath("/reassort")
    revalidatePath("/")
  }
}
