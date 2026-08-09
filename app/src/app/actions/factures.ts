'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveFactureAndCheckPrices(fournisseur: string, numeroFacture: string, lignes: any[]) {
  try {
    // On sauvegarde d'abord la facture
    const facture = await prisma.factureFournisseur.create({
      data: {
        fournisseur,
        numeroFacture,
        dateFacture: new Date(),
      }
    })

    const resultLignes = []

    for (const ligne of lignes) {
      // Rechercher le meilleur prix historique pour cette référence tous fournisseurs confondus
      const bestPriceLigne = await prisma.ligneFactureFournisseur.findFirst({
        where: {
          reference: ligne.reference,
        },
        orderBy: {
          prixUnitaire: 'asc'
        },
        include: {
          facture: true
        }
      })

      const prixPrecedent = bestPriceLigne ? bestPriceLigne.prixUnitaire : null
      const dateFacturePrecedente = bestPriceLigne ? bestPriceLigne.facture.dateFacture : null
      const numeroFacturePrecedente = bestPriceLigne ? bestPriceLigne.facture.numeroFacture : null
      const fournisseurPrecedent = bestPriceLigne ? bestPriceLigne.facture.fournisseur : null
      
      const alerteHausse = prixPrecedent !== null && ligne.prixUnitaire > prixPrecedent

      const savedLigne = await prisma.ligneFactureFournisseur.create({
        data: {
          factureId: facture.id,
          reference: ligne.reference,
          designation: ligne.designation,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          prixUnitairePrecedent: prixPrecedent,
          fournisseurPrecedent: fournisseurPrecedent,
          dateFacturePrecedente: dateFacturePrecedente,
          numeroFacturePrecedente: numeroFacturePrecedente,
          alerteHausse: alerteHausse
        }
      })
      
      resultLignes.push(savedLigne)
    }

    revalidatePath('/fournisseurs')
    
    return { success: true, facture, lignes: resultLignes }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la facture:", error)
    return { success: false, error: "Erreur serveur" }
  }
}

export async function getFactures() {
  return await prisma.factureFournisseur.findMany({
    include: {
      lignes: true
    },
    orderBy: {
      dateFacture: 'desc'
    }
  })
}
