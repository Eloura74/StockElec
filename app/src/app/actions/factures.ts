'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { parseDateFlexible } from '@/lib/date-parser'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import {
  cleReference,
  construireIndexCatalogue,
  indexerArticleDansCatalogue,
  trouverArticleCatalogue,
} from '@/lib/article-matching'
import { parseNombre } from '@/lib/import-articles'

export interface SaveFactureOptions {
  entreprise?: string
  totalHT?: number | null
  totalTVA?: number | null
  totalTTC?: number | null
  dateEcheance?: string | Date | null
  modePaiement?: string | null
  dateFacture?: string | Date | null
  /** Synchroniser automatiquement le Catalogue et le Stock Dépôt (défaut: true) */
  syncStock?: boolean
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

    // 2. Pré-chargement du catalogue complet, des alias et de l'historique (zéro doublon)
    const [tousArticles, tousAliases, historicalPrices] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          reference: true,
          designation: true,
          codeBarre: true,
          fournisseur: true,
          referenceFournisseur: true,
          prixUnitaire: true,
        },
      }),
      prisma.referenceAlias.findMany(),
      prisma.ligneFactureFournisseur.findMany({
        where: {
          factureId: { not: facture.id },
          prixUnitaire: { gt: 0 },
        },
        include: {
          facture: true,
        },
      }),
    ])

    const indexCatalogue = construireIndexCatalogue(tousArticles, tousAliases)

    // Indexation de l'historique par référence exacte ET par clé normalisée
    const historyByKey = new Map<string, any[]>()
    for (const hp of historicalPrices) {
      const k = cleReference(hp.reference)
      if (!k) continue
      if (!historyByKey.has(k)) {
        historyByKey.set(k, [])
      }
      historyByKey.get(k)!.push(hp)
    }

    const syncStockActif = options.syncStock !== false
    const resultLignes = []

    for (const ligne of lignes) {
      const rawRef = String(ligne.originalReference || ligne.reference || '').trim()
      const refSaisie = String(ligne.reference || rawRef || '').trim()

      // Recherche universelle dans le Catalogue (Alias, Réf exacte, Réf normalisée, EAN, Réf fournisseur)
      const rapprochement = trouverArticleCatalogue(indexCatalogue, {
        reference: refSaisie,
        referenceFournisseur: rawRef || refSaisie,
        codeBarre: ligne.codeBarre ? String(ligne.codeBarre) : null,
        fournisseur,
      })
      let articleCatalogue = rapprochement.article

      const referenceToUse = articleCatalogue
        ? articleCatalogue.reference
        : rapprochement.referenceCanonique || refSaisie || `REF-${Date.now()}`

      const qte = parseInt(String(ligne.quantite), 10) || 1
      let pu = Math.max(0, parseNombre(ligne.prixUnitaire) ?? 0)

      // Protection anti-anomalie tarif /1000m ou /100 (câbles, visserie, etc.)
      const totalHTFacture = options.totalHT || 0
      if (totalHTFacture > 0 && (qte * pu) > totalHTFacture * 1.05) {
        if ((qte * (pu / 1000)) <= totalHTFacture * 1.1) {
          pu = Math.round((pu / 1000) * 10000) / 10000
        } else if ((qte * (pu / 100)) <= totalHTFacture * 1.1) {
          pu = Math.round((pu / 100) * 10000) / 10000
        }
      }

      // Historique de factures pour cette référence (canonique ou brute fournisseur)
      const cleCanon = cleReference(referenceToUse)
      const cleBrute = cleReference(rawRef)
      const historySet = new Map<string, any>()
      for (const item of historyByKey.get(cleCanon) || []) {
        historySet.set(item.id, item)
      }
      if (cleBrute && cleBrute !== cleCanon) {
        for (const item of historyByKey.get(cleBrute) || []) {
          historySet.set(item.id, item)
        }
      }
      const history = Array.from(historySet.values())

      let previousPriceLigne = null
      if (history.length > 0) {
        // On trie l'historique par date décroissante pour obtenir le prix le plus récent
        const sortedHistory = [...history].sort(
          (a, b) => b.facture.dateFacture.getTime() - a.facture.dateFacture.getTime()
        )
        previousPriceLigne = sortedHistory[0]
      }

      // Fallback sur le prix unitaire du Catalogue si aucune facture précédente n'existe !
      const prixCatalogue =
        articleCatalogue && Number(articleCatalogue.prixUnitaire) > 0
          ? Number(articleCatalogue.prixUnitaire)
          : null

      const prixPrecedent = previousPriceLigne
        ? previousPriceLigne.prixUnitaire
        : prixCatalogue

      const dateFacturePrecedente = previousPriceLigne
        ? previousPriceLigne.facture.dateFacture
        : null
      const numeroFacturePrecedente = previousPriceLigne
        ? previousPriceLigne.facture.numeroFacture
        : prixCatalogue !== null
          ? 'CATALOGUE'
          : null
      const fournisseurPrecedent = previousPriceLigne
        ? previousPriceLigne.facture.fournisseur
        : prixCatalogue !== null
          ? articleCatalogue?.fournisseur
            ? `Catalogue ${articleCatalogue.fournisseur}`
            : 'Catalogue'
          : null

      const alerteHausse =
        pu > 0 &&
        prixPrecedent !== null &&
        Number(prixPrecedent) > 0 &&
        pu > Number(prixPrecedent) + 0.0001

      let alerteBaisse = false
      if (pu > 0 && prixPrecedent !== null && Number(prixPrecedent) > 0) {
        if (pu < Number(prixPrecedent) - 0.0001) {
          alerteBaisse = true
        } else if (history.length > 0) {
          const avg =
            history.reduce((acc, curr) => acc + curr.prixUnitaire, 0) /
            history.length
          if (pu < avg * 0.95) {
            alerteBaisse = true
          }
        }
      }

      // Synchronisation Catalogue & Alias (anti-doublon)
      if (articleCatalogue) {
        // Si la référence brute fournisseur diffère de la référence canonique, mémoriser l'équivalence
        if (rawRef && cleReference(rawRef) !== cleReference(articleCatalogue.reference)) {
          await prisma.referenceAlias
            .upsert({
              where: {
                fournisseur_aliasFournisseur: {
                  fournisseur,
                  aliasFournisseur: rawRef,
                },
              },
              update: { referenceCanonique: articleCatalogue.reference },
              create: {
                fournisseur,
                aliasFournisseur: rawRef,
                referenceCanonique: articleCatalogue.reference,
              },
            })
            .catch(() => {})
        }

        // Enrichir l'article existant s'il lui manque sa référence fournisseur ou son prix unitaire
        const champsEnrichis: Record<string, any> = {}
        if (!articleCatalogue.referenceFournisseur && rawRef) {
          champsEnrichis.referenceFournisseur = rawRef
          articleCatalogue.referenceFournisseur = rawRef
        }
        if (!articleCatalogue.fournisseur && fournisseur) {
          champsEnrichis.fournisseur = fournisseur
          articleCatalogue.fournisseur = fournisseur
        }
        if ((Number(articleCatalogue.prixUnitaire) === 0 || !articleCatalogue.prixUnitaire) && pu > 0) {
          champsEnrichis.prixUnitaire = pu
          articleCatalogue.prixUnitaire = pu
        }
        if (Object.keys(champsEnrichis).length > 0) {
          await prisma.article.update({
            where: { id: articleCatalogue.id },
            data: champsEnrichis,
          })
          indexerArticleDansCatalogue(indexCatalogue, articleCatalogue)
        }
      } else if (syncStockActif && referenceToUse) {
        // Créer automatiquement l'article dans le Catalogue s'il n'existe pas encore
        const cree = await prisma.article.create({
          data: {
            reference: referenceToUse,
            designation: (ligne.designation || referenceToUse).slice(0, 200),
            fournisseur,
            referenceFournisseur: rawRef || referenceToUse,
            prixUnitaire: pu > 0 ? pu : 0,
            categorie: 'À classer',
            unite: 'u',
            stockInitial: 0,
          },
        })
        articleCatalogue = cree
        indexerArticleDansCatalogue(indexCatalogue, cree)
      }

      const diffUnitaire = alerteHausse && prixPrecedent ? pu - Number(prixPrecedent) : 0
      const montantEstimeAvoir = diffUnitaire * qte

      const savedLigne = await prisma.ligneFactureFournisseur.create({
        data: {
          factureId: facture.id,
          reference: referenceToUse,
          designation: ligne.designation || articleCatalogue?.designation || referenceToUse,
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

      // Synchronisation du stock Dépôt si la ligne est affectée au STOCK
      const affectation = String(ligne.chantier || 'STOCK').trim().toUpperCase()
      if (syncStockActif && affectation === 'STOCK' && qte > 0 && articleCatalogue) {
        await prisma.mouvement.create({
          data: {
            type: 'Achat',
            quantite: qte,
            articleId: articleCatalogue.id,
            utilisateur: (session as any).username || 'Admin',
            observation: `Facture ${fournisseur} n°${numeroFacture} (#FACTURE:${facture.id})`,
          },
        })
      }
      
      resultLignes.push(savedLigne)
    }

    revalidatePath('/fournisseurs')
    revalidatePath('/catalogue')
    revalidatePath('/mouvements')
    revalidatePath('/reassort')
    revalidatePath('/depart-matin')
    
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

    // Supprimer les mouvements de stock Dépôt générés automatiquement par cette facture
    await prisma.mouvement.deleteMany({
      where: {
        observation: {
          contains: `(#FACTURE:${factureId})`,
        },
      },
    })

    await prisma.factureFournisseur.delete({
      where: { id: factureId }
    })
    
    await logAudit('SUPPRESSION', 'FACTURE', `La facture ${facture.fournisseur} n°${facture.numeroFacture || '?'} a été supprimée.`)
    
    revalidatePath('/fournisseurs')
    revalidatePath('/catalogue')
    revalidatePath('/mouvements')
    revalidatePath('/reassort')
    revalidatePath('/depart-matin')
    return { success: true }
  } catch (error: any) {
    console.error("Erreur suppression facture:", error)
    return { success: false, error: error?.message || "Impossible de supprimer la facture" }
  }
}
