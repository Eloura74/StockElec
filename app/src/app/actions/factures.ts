'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface SaveFactureOptions {
  totalHT?: number | null
  totalTVA?: number | null
  totalTTC?: number | null
  dateEcheance?: string | Date | null
  modePaiement?: string | null
  dateFacture?: string | Date | null
}

export async function saveFactureAndCheckPrices(
  fournisseur: string, 
  numeroFacture: string, 
  lignes: any[],
  options: SaveFactureOptions = {}
) {
  try {
    let dateFactureParsed = new Date()
    if (options.dateFacture) {
      const d = new Date(options.dateFacture)
      if (!isNaN(d.getTime())) dateFactureParsed = d
    }

    let dateEcheanceParsed: Date | null = null
    if (options.dateEcheance) {
      const d = new Date(options.dateEcheance)
      if (!isNaN(d.getTime())) dateEcheanceParsed = d
    }

    // 1. Sauvegarde de l'en-tête de facture
    const facture = await prisma.factureFournisseur.create({
      data: {
        fournisseur,
        numeroFacture,
        dateFacture: dateFactureParsed,
        totalHT: options.totalHT || null,
        totalTVA: options.totalTVA || null,
        totalTTC: options.totalTTC || null,
        dateEcheance: dateEcheanceParsed,
        modePaiement: options.modePaiement || null,
      }
    })

    const resultLignes = []

    for (const ligne of lignes) {
      // Résoudre l'alias éventuel
      const alias = await prisma.referenceAlias.findUnique({
        where: {
          fournisseur_aliasFournisseur: {
            fournisseur: fournisseur,
            aliasFournisseur: ligne.reference
          }
        }
      })
      const referenceToUse = alias ? alias.referenceCanonique : ligne.reference

      // Rechercher le meilleur prix historique pour cette référence tous fournisseurs confondus
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
      
      const alerteHausse = prixPrecedent !== null && Number(ligne.prixUnitaire) > Number(prixPrecedent)

      // Détecter une baisse significative (inférieur de 5% à la moyenne)
      let alerteBaisse = false
      const allPrices = await prisma.ligneFactureFournisseur.findMany({
        where: { reference: referenceToUse },
        select: { prixUnitaire: true }
      })
      if (allPrices.length > 0) {
        const avg = allPrices.reduce((acc, curr) => acc + curr.prixUnitaire, 0) / allPrices.length
        if (Number(ligne.prixUnitaire) < avg * 0.95) {
          alerteBaisse = true
        }
      }

      const diffUnitaire = alerteHausse && prixPrecedent ? Number(ligne.prixUnitaire) - Number(prixPrecedent) : 0
      const montantEstimeAvoir = diffUnitaire * (Number(ligne.quantite) || 1)

      const savedLigne = await prisma.ligneFactureFournisseur.create({
        data: {
          factureId: facture.id,
          reference: referenceToUse,
          designation: ligne.designation,
          quantite: parseInt(String(ligne.quantite), 10) || 1,
          prixUnitaire: parseFloat(String(ligne.prixUnitaire)) || 0,
          prixUnitairePrecedent: prixPrecedent,
          fournisseurPrecedent: fournisseurPrecedent,
          dateFacturePrecedente: dateFacturePrecedente,
          numeroFacturePrecedente: numeroFacturePrecedente,
          alerteHausse: alerteHausse,
          alerteBaisse: alerteBaisse,
          chantier: ligne.chantier || 'STOCK',
          statutAvoir: alerteHausse ? 'A_RECLAMER' : null,
          montantAvoir: alerteHausse ? montantEstimeAvoir : null,
        }
      })
      
      resultLignes.push(savedLigne)
    }

    revalidatePath('/fournisseurs')
    
    return { success: true, facture, lignes: resultLignes }
  } catch (error: any) {
    console.error("Erreur lors de la sauvegarde de la facture:", error)
    return { success: false, error: error?.message || "Erreur serveur" }
  }
}

export async function updateStatutAvoir(
  ligneId: string, 
  statutAvoir: string, 
  numeroAvoir?: string | null, 
  montantAvoir?: number | null
) {
  try {
    const dataToUpdate: any = { statutAvoir }
    if (numeroAvoir !== undefined) dataToUpdate.numeroAvoir = numeroAvoir
    if (montantAvoir !== undefined) dataToUpdate.montantAvoir = montantAvoir

    const updated = await prisma.ligneFactureFournisseur.update({
      where: { id: ligneId },
      data: dataToUpdate
    })

    revalidatePath('/fournisseurs')
    return { success: true, ligne: updated }
  } catch (error: any) {
    console.error("Erreur mise à jour statut avoir:", error)
    return { success: false, error: error?.message || "Erreur serveur" }
  }
}

export async function getFactures() {
  try {
    return await prisma.factureFournisseur.findMany({
      include: {
        lignes: true
      },
      orderBy: {
        dateFacture: 'desc'
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error)
    return []
  }
}

export async function getPriceHistory(reference: string) {
  try {
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
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique de prix:", error)
    return []
  }
}

export async function deleteFacture(factureId: string) {
  try {
    await prisma.factureFournisseur.delete({
      where: { id: factureId }
    })
    revalidatePath('/fournisseurs')
    return { success: true }
  } catch (error: any) {
    console.error("Erreur suppression facture:", error)
    return { success: false, error: error?.message || "Impossible de supprimer la facture" }
  }
}
