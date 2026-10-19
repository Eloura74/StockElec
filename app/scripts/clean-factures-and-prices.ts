/**
 * SCRIPT DE NETTOYAGE DES FACTURES ET CORRECTION DES PRIX AU 1000m
 * 
 * Ce script :
 * 1. Supprime les factures importées en doublon (garde 1 exemplaire unique par fournisseur/numéro)
 * 2. Corrige les prix unitaires des câbles et fournitures stockés par erreur au tarif /1000m ou /100
 * 3. Rétablit le coût réel d'achats dans la rentabilité chantiers
 * 
 * UTILISATION :
 * - Simulation (Dry-run) :
 *   npx tsx scripts/clean-factures-and-prices.ts
 * 
 * - Application réelle :
 *   npx tsx scripts/clean-factures-and-prices.ts --confirm
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const pgUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"

const prisma = new PrismaClient({
  datasources: { db: { url: pgUrl } }
})

async function main() {
  const isConfirm = process.argv.includes('--confirm')

  console.log('=================================================================')
  console.log('🛠️  CORRECTION DES FACTURES & DES PRIX EN BASE')
  console.log('=================================================================')
  console.log(`Base ciblée : ${pgUrl.split('@')[1] || 'PostgreSQL'}\n`)

  // --- PARTIE 1 : ANALYSE DES FACTURES EN DOUBLON ---
  const allFactures = await prisma.factureFournisseur.findMany({
    include: { _count: { select: { lignes: true } } },
    orderBy: { createdAt: 'asc' }
  })

  const facturesMap = new Map<string, typeof allFactures>()
  for (const f of allFactures) {
    const key = `${(f.fournisseur || '').trim().toLowerCase()}__${(f.numeroFacture || '').trim().toLowerCase()}`
    if (!facturesMap.has(key)) facturesMap.set(key, [])
    facturesMap.get(key)!.push(f)
  }

  const factureIdsToDelete: string[] = []
  let totalDoublonsFactures = 0

  for (const [key, list] of facturesMap.entries()) {
    if (list.length > 1) {
      // Trier pour garder celui qui a le plus de lignes, ou le plus ancien
      list.sort((a, b) => b._count.lignes - a._count.lignes || a.createdAt.getTime() - b.createdAt.getTime())
      const kept = list[0]
      const toDelete = list.slice(1)
      totalDoublonsFactures += toDelete.length
      for (const d of toDelete) {
        factureIdsToDelete.push(d.id)
      }
    }
  }

  console.log('--- 1. AUDIT DES FACTURES EN DOUBLE ---')
  console.log(`• Total factures actuelles :        ${allFactures.length}`)
  console.log(`• Factures uniques à conserver :    ${facturesMap.size}`)
  console.log(`• Factures doublons à supprimer :   ${factureIdsToDelete.length}\n`)

  // --- PARTIE 2 : ANALYSE DES PRIX AU 1000m / 100 ---
  const allLignes = await prisma.ligneFactureFournisseur.findMany({
    where: {
      factureId: { notIn: factureIdsToDelete } // Analyser uniquement sur les factures conservées
    },
    include: { facture: true }
  })

  const lignesToUpdate: { id: string; oldPU: number; newPU: number; reason: string }[] = []

  for (const l of allLignes) {
    const fTotal = l.facture.totalHT || 0
    if (fTotal <= 0) continue

    const lineCost = l.quantite * l.prixUnitaire
    if (lineCost > fTotal * 1.05) {
      let newPU = l.prixUnitaire
      let reason = ""

      const isCable = /cable|u1000|r2v|ar2v|h07|touret|fhp|couronne/i.test(l.designation) || /cable|u1000|r2v|ar2v/i.test(l.reference)
      const isPer100 = /\/100|\/ 100|x 100|x100|boite|vis|cheville|ecrou|collier|borne|connect/i.test(l.designation)

      if (isCable && (l.quantite * (l.prixUnitaire / 1000)) <= fTotal * 1.1) {
        newPU = Math.round((l.prixUnitaire / 1000) * 10000) / 10000
        reason = "Câble au 1000m -> divisé par 1000"
      } else if (isPer100 && (l.quantite * (l.prixUnitaire / 100)) <= fTotal * 1.1) {
        newPU = Math.round((l.prixUnitaire / 100) * 10000) / 10000
        reason = "Visserie/Bornes au 100 -> divisé par 100"
      } else if (l.quantite > 0 && (l.quantite * (l.prixUnitaire / 1000)) <= fTotal * 1.1) {
        newPU = Math.round((l.prixUnitaire / 1000) * 10000) / 10000
        reason = "Dépassement majeur -> tarif au 1000"
      } else if (l.quantite > 0 && (l.quantite * (l.prixUnitaire / 100)) <= fTotal * 1.1) {
        newPU = Math.round((l.prixUnitaire / 100) * 10000) / 10000
        reason = "Dépassement majeur -> tarif au 100"
      } else if (l.quantite > 0 && l.prixUnitaire > fTotal) {
        newPU = Math.round((fTotal / l.quantite) * 100) / 100
        reason = "PU supérieur à la facture entière"
      }

      if (newPU !== l.prixUnitaire) {
        lignesToUpdate.push({ id: l.id, oldPU: l.prixUnitaire, newPU, reason })
      }
    }
  }

  console.log('--- 2. AUDIT DES PRIX AU 1000m / 100 ---')
  console.log(`• Lignes avec prix erroné (> total facture) : ${lignesToUpdate.length}\n`)

  if (!isConfirm) {
    console.log('⚠️  MODE SIMULATION (DRY-RUN) ACTIF')
    console.log('Aucune donnée n\'a été modifiée.')
    console.log('\nPour appliquer RÉELLEMENT ces corrections en base, lancez :')
    console.log('👉 npx tsx scripts/clean-factures-and-prices.ts --confirm\n')
    return
  }

  console.log('🚨 APPLICATION DES CORRECTIONS EN COURS...\n')

  // 1. Supprimer les doublons de factures
  if (factureIdsToDelete.length > 0) {
    const delResult = await prisma.factureFournisseur.deleteMany({
      where: { id: { in: factureIdsToDelete } }
    })
    console.log(`✅ ${delResult.count} facture(s) en doublon supprimée(s) (ainsi que leurs lignes orphelines).`)
  }

  // 2. Corriger les lignes avec prix erronés
  let updatedCount = 0
  for (const item of lignesToUpdate) {
    await prisma.ligneFactureFournisseur.update({
      where: { id: item.id },
      data: { prixUnitaire: item.newPU }
    })
    updatedCount++
  }
  console.log(`✅ ${updatedCount} ligne(s) de facture corrigée(s) avec le prix unitaire réel net.`)

  // 3. Vérification finale
  const remainingFactures = await prisma.factureFournisseur.count()
  const remainingLignes = await prisma.ligneFactureFournisseur.count()

  console.log('\n--- VÉRIFICATION FINALE ---')
  console.log(`• Factures nettes restantes : ${remainingFactures}`)
  console.log(`• Lignes nettes restantes :   ${remainingLignes}`)
  console.log('---------------------------')
  console.log('🎉 Base assainie avec succès !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
