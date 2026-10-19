'use server'

import prisma from '@/lib/prisma'

export async function getAchatsParChantier() {
  try {
    const lignes = await prisma.ligneFactureFournisseur.findMany({
      where: {
        chantier: {
          not: null,
          notIn: ["", "STOCK", "Stock", "stock"]
        }
      },
      include: {
        facture: true
      }
    })

    const stats: Record<string, { totalAchats: number, fournisseurs: Set<string>, lignes: any[], datePremierAchat: Date | null, dateDernierAchat: Date | null }> = {}

    lignes.forEach(l => {
      const c = l.chantier!.trim()
      if (!c) return

      if (!stats[c]) {
        stats[c] = { totalAchats: 0, fournisseurs: new Set(), lignes: [], datePremierAchat: null, dateDernierAchat: null }
      }
      
      let coutLigne = l.quantite * l.prixUnitaire
      const fTotal = l.facture?.totalHT || 0
      
      // Sécurité anti-anomalie : si une ligne dépasse le total HT de sa facture (tarif /1000 ou /100)
      if (fTotal > 0 && coutLigne > fTotal * 1.05) {
        if (coutLigne / 1000 <= fTotal * 1.1) {
          coutLigne = coutLigne / 1000
        } else if (coutLigne / 100 <= fTotal * 1.1) {
          coutLigne = coutLigne / 100
        } else {
          coutLigne = Math.min(coutLigne, fTotal)
        }
      }

      stats[c].totalAchats += coutLigne
      
      const dateFacture = l.facture?.dateFacture
      if (dateFacture) {
        if (!stats[c].datePremierAchat || dateFacture < stats[c].datePremierAchat) {
          stats[c].datePremierAchat = dateFacture
        }
        if (!stats[c].dateDernierAchat || dateFacture > stats[c].dateDernierAchat) {
          stats[c].dateDernierAchat = dateFacture
        }
      }

      if (l.facture?.fournisseur) {
        stats[c].fournisseurs.add(l.facture.fournisseur)
      }
      stats[c].lignes.push({
        reference: l.reference,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        total: coutLigne,
        fournisseur: l.facture?.fournisseur || 'Inconnu',
        date: dateFacture
      })
    })

    return Object.entries(stats).map(([nom, data]) => ({
      nom,
      totalAchats: data.totalAchats,
      fournisseurs: Array.from(data.fournisseurs),
      nbLignes: data.lignes.length,
      datePremierAchat: data.datePremierAchat,
      dateDernierAchat: data.dateDernierAchat,
      lignes: data.lignes.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    })).sort((a, b) => b.totalAchats - a.totalAchats)
  } catch (error) {
    console.error("Erreur getAchatsParChantier:", error)
    return []
  }
}
