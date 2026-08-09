'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createAlias(fournisseur: string, aliasFournisseur: string, referenceCanonique: string) {
  try {
    const alias = await prisma.referenceAlias.upsert({
      where: {
        fournisseur_aliasFournisseur: {
          fournisseur,
          aliasFournisseur,
        }
      },
      update: {
        referenceCanonique,
      },
      create: {
        fournisseur,
        aliasFournisseur,
        referenceCanonique,
      }
    })
    
    revalidatePath('/fournisseurs')
    return { success: true, alias }
  } catch (error) {
    console.error("Erreur création alias:", error)
    return { success: false, error: "Erreur serveur" }
  }
}
