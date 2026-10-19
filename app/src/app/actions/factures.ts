'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { parseDateFlexible } from '@/lib/date-parser'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export interface SaveFactureOptions {
  entreprise?: string
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
    const session = await getSession()
    if (!session) return { success: false, error: "Non autorisé." }

    const dateFactureParsed = parseDateFlexible(options.dateFacture) || new Date()

    const dateEcheanceParsed = parseDateFlexible(options.dateEcheance)

    // Vérification anti-doublon de facture
    if (numeroFacture && numeroFacture.trim()) {
      const existing = await prisma.factureFournisseur.findFirst({
        where: {
          fournisseur: { equals: fournisseur.trim(), mode: 'insensitive' },
          numeroFacture: { equals: numeroFacture.trim(), mode: 'insensitive' }
        }
      })
      if (existing) {
        return { 
          success: false, 
          error: `La facture ${numeroFacture} du fournisseur ${fournisseur} existe déjà dans le système. Aucun doublon créé.` 
        }
      }
    }

    // 1. Sauvegarde de l'en-tête de facture
    const facture = await prisma.factureFournisseur.create({
      data: {
        entreprise: options.entreprise || 'CedricElec',
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

    // 2. Pré-chargement des alias et de l'historique pour éviter les requêtes N+1
    const referenceList = lignes.map(l => l.reference)
    const aliases = await prisma.referenceAlias.findMany({
      where: {
        fournisseur: fournisseur,
        aliasFournisseur: { in: referenceList }
      }
    })
    const aliasMap = new Map(aliases.map(a => [a.aliasFournisseur, a.referenceCanonique]))

    const canonicalRefs = Array.from(new Set(lignes.map(l => aliasMap.get(l.reference) || l.reference)))
    
    const historicalPrices = await prisma.ligneFactureFournisseur.findMany({
      where: {
        reference: { in: canonicalRefs },
        prixUnitaire: { gt: 0 }
      },
      include: {
        facture: true
      }
    })

    const historyMap = new Map<string, any[]>()
    for (const hp of historicalPrices) {
      if (!historyMap.has(hp.reference)) {
        historyMap.set(hp.reference, [])
      }
      historyMap.get(hp.reference)!.push(hp)
    }

    const resultLignes = []

    for (const ligne of lignes) {
      const referenceToUse = aliasMap.get(ligne.reference) || ligne.reference
      const history = historyMap.get(referenceToUse) || []

      let previousPriceLigne = null
      if (history.length > 0) {
        // On trie l'historique par date décroissante pour obtenir le prix le plus récent
        const sortedHistory = [...history].sort((a, b) => b.facture.dateFacture.getTime() - a.facture.dateFacture.getTime())
        previousPriceLigne = sortedHistory[0]
      }

      const prixPrecedent = previousPriceLigne ? previousPriceLigne.prixUnitaire : null
      const dateFacturePrecedente = previousPriceLigne ? previousPriceLigne.facture.dateFacture : null
      const numeroFacturePrecedente = previousPriceLigne ? previousPriceLigne.facture.numeroFacture : null
      const fournisseurPrecedent = previousPriceLigne ? previousPriceLigne.facture.fournisseur : null
      
      const alerteHausse = prixPrecedent !== null && Number(ligne.prixUnitaire) > Number(prixPrecedent)

      let alerteBaisse = false
      if (history.length > 0) {
        const avg = history.reduce((acc, curr) => acc + curr.prixUnitaire, 0) / history.length
        if (Number(ligne.prixUnitaire) < avg * 0.95 && Number(ligne.prixUnitaire) > 0) {
          alerteBaisse = true
        }
      }

      const qte = parseInt(String(ligne.quantite), 10) || 1
      let pu = parseFloat(String(ligne.prixUnitaire)) || 0

      // Protection anti-anomalie tarif /1000m ou /100 (câbles, visserie, etc.)
      const totalHTFacture = options.totalHT || 0
      if (totalHTFacture > 0 && (qte * pu) > totalHTFacture * 1.05) {
        if ((qte * (pu / 1000)) <= totalHTFacture * 1.1) {
          pu = Math.round((pu / 1000) * 10000) / 10000
        } else if ((qte * (pu / 100)) <= totalHTFacture * 1.1) {
          pu = Math.round((pu / 100) * 10000) / 10000
        }
      }

      const diffUnitaire = alerteHausse && prixPrecedent ? pu - Number(prixPrecedent) : 0
      const montantEstimeAvoir = diffUnitaire * qte

      const savedLigne = await prisma.ligneFactureFournisseur.create({
        data: {
          factureId: facture.id,
          reference: referenceToUse,
          designation: ligne.designation,
          quantite: qte,
          prixUnitaire: pu,
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
    const session = await getSession()
    if (!session) return { success: false, error: "Non autorisé." }

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
    const session = await getSession()
    if (!session) return { success: false, error: "Non autorisé." }

    const facture = await prisma.factureFournisseur.findUnique({ where: { id: factureId } })
    if (!facture) return { success: false, error: "Facture introuvable." }

    await prisma.factureFournisseur.delete({
      where: { id: factureId }
    })
    
    await logAudit('SUPPRESSION', 'FACTURE', `La facture ${facture.fournisseur} n°${facture.numeroFacture || '?'} a été supprimée.`)
    
    revalidatePath('/fournisseurs')
    return { success: true }
  } catch (error: any) {
    console.error("Erreur suppression facture:", error)
    return { success: false, error: error?.message || "Impossible de supprimer la facture" }
  }
}
