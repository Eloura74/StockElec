import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./dev.db'
const prisma = new PrismaClient()

async function main() {
  console.log("Démarrage de la correction des historiques de prix...")
  
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

  console.log(`Terminé ! ${updatedCount} lignes corrigées.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
