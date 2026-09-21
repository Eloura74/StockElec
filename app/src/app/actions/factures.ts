'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { parseDateFlexible } from '@/lib/date-parser'

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
    const dateFactureParsed = parseDateFlexible(options.dateFacture) || new Date()

    const dateEcheanceParsed = parseDateFlexible(options.dateEcheance)

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

      // Rechercher le meilleur prix historique pour cette référence tous fournisseurs confondus (hors avoirs/gratuités)
      const bestPriceLigne = await prisma.ligneFactureFournisseur.findFirst({
        where: {
          reference: referenceToUse,
          prixUnitaire: { gt: 0 }
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
        where: { 
          reference: referenceToUse,
          prixUnitaire: { gt: 0 }
        },
        select: { prixUnitaire: true }
      })
      if (allPrices.length > 0) {
        const avg = allPrices.reduce((acc, curr) => acc + curr.prixUnitaire, 0) / allPrices.length
        if (Number(ligne.prixUnitaire) < avg * 0.95 && Number(ligne.prixUnitaire) > 0) {
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
      where: { 
        reference,
        prixUnitaire: { gt: 0 } // Ignorer les avoirs et gratuités
      },
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

export async function getMultiReferencesPrices(references: string[]) {
  try {
    const refs = Array.from(new Set(references))
    const results: Record<string, { prix: number, fournisseur: string, date: Date }> = {}
    
    // Find best price for each reference
    for (const ref of refs) {
      const best = await prisma.ligneFactureFournisseur.findFirst({
        where: { reference: ref },
        orderBy: { prixUnitaire: 'asc' },
        include: { facture: true }
      })
      if (best) {
        results[ref] = {
          prix: best.prixUnitaire,
          fournisseur: best.facture.fournisseur,
          date: best.facture.dateFacture
        }
      }
    }
    return results
  } catch (error) {
    console.error("Erreur getMultiReferencesPrices:", error)
    return {}
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
