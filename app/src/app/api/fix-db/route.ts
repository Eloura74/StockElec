import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const lignes = await prisma.ligneFactureFournisseur.findMany({
      orderBy: { facture: { dateFacture: 'asc' } },
      include: { facture: true }
    })

    let updatedCount = 0

    for (const ligne of lignes) {
      if (ligne.prixUnitaire <= 0) continue

      const bestPriceLigne = await prisma.ligneFactureFournisseur.findFirst({
        where: {
          reference: ligne.reference,
          prixUnitaire: { gt: 0 },
          id: { not: ligne.id },
          facture: {
            dateFacture: { lte: ligne.facture.dateFacture }
          }
        },
        orderBy: { prixUnitaire: 'asc' },
        include: { facture: true }
      })

      if (bestPriceLigne) {
        const prixPrecedent = bestPriceLigne.prixUnitaire
        const alerteHausse = Number(ligne.prixUnitaire) > Number(prixPrecedent)
        
        const diffUnitaire = alerteHausse ? Number(ligne.prixUnitaire) - Number(prixPrecedent) : 0
        const montantEstimeAvoir = diffUnitaire * (ligne.quantite || 1)
        
        if (
          ligne.prixUnitairePrecedent !== prixPrecedent ||
          ligne.fournisseurPrecedent !== bestPriceLigne.facture.fournisseur ||
          ligne.alerteHausse !== alerteHausse
        ) {
          await prisma.ligneFactureFournisseur.update({
            where: { id: ligne.id },
            data: {
              prixUnitairePrecedent: prixPrecedent,
              fournisseurPrecedent: bestPriceLigne.facture.fournisseur,
              dateFacturePrecedente: bestPriceLigne.facture.dateFacture,
              numeroFacturePrecedente: bestPriceLigne.facture.numeroFacture,
              alerteHausse: alerteHausse,
              statutAvoir: alerteHausse && !ligne.statutAvoir ? 'A_RECLAMER' : ligne.statutAvoir,
              montantAvoir: alerteHausse && !ligne.montantAvoir ? montantEstimeAvoir : ligne.montantAvoir,
            }
          })
          updatedCount++
        }
      } else {
        if (ligne.prixUnitairePrecedent !== null) {
          await prisma.ligneFactureFournisseur.update({
            where: { id: ligne.id },
            data: {
              prixUnitairePrecedent: null,
              fournisseurPrecedent: null,
              dateFacturePrecedente: null,
              numeroFacturePrecedente: null,
              alerteHausse: false,
              statutAvoir: null,
              montantAvoir: null,
            }
          })
          updatedCount++
        }
      }
    }

    return NextResponse.json({ success: true, message: `Terminé ! ${updatedCount} lignes corrigées.` })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
