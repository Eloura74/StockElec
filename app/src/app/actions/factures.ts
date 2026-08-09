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
      // 1. Résoudre l'alias éventuel
      const alias = await prisma.referenceAlias.findUnique({
        where: {
          fournisseur_aliasFournisseur: {
            fournisseur: fournisseur,
            aliasFournisseur: ligne.reference
          }
        }
      })
      const referenceToUse = alias ? alias.referenceCanonique : ligne.reference

      // 2. Rechercher le meilleur prix historique pour cette référence tous fournisseurs confondus
      const bestPriceLigne = await prisma.ligneFactureFournisseur.findFirst({
        where: {
          reference: referenceToUse,
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

      // 3. Détecter une baisse significative (ex: inférieur de 5% à la moyenne)
      let alerteBaisse = false
      const allPrices = await prisma.ligneFactureFournisseur.findMany({
        where: { reference: referenceToUse },
        select: { prixUnitaire: true }
      })
      if (allPrices.length > 0) {
        const avg = allPrices.reduce((acc, curr) => acc + curr.prixUnitaire, 0) / allPrices.length
        if (ligne.prixUnitaire < avg * 0.95) { // Baisse d'au moins 5% par rapport à la moyenne
          alerteBaisse = true
        }
      }

      const savedLigne = await prisma.ligneFactureFournisseur.create({
        data: {
          factureId: facture.id,
          reference: referenceToUse, // On enregistre sous la référence canonique
          designation: ligne.designation,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          prixUnitairePrecedent: prixPrecedent,
          fournisseurPrecedent: fournisseurPrecedent,
          dateFacturePrecedente: dateFacturePrecedente,
          numeroFacturePrecedente: numeroFacturePrecedente,
          alerteHausse: alerteHausse,
          alerteBaisse: alerteBaisse
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

export async function getPriceHistory(reference: string) {
  return await prisma.ligneFactureFournisseur.findMany({
    where: { reference },
    include: {
      facture: true
    },
    orderBy: {
      facture: {
        dateFacture: 'asc'
      }
    }
  })
}
