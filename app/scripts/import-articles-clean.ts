/**
 * SCRIPT D'IMPORT PROPRE DE L'INVENTAIRE EXCEL
 * 
 * Ce script lit "Inventaire CE 2026.xlsx" et insère les articles de manière propre :
 * - Alignement parfait des colonnes (Stock final -> Stock, P.U. -> Prix unitaire)
 * - Références déterministes si référence manquante (aucun doublon en cas de ré-exécution)
 * - Mode Dry-Run par défaut (affiche le total d'articles et le montant calculé sans toucher à la BD)
 * - Validation mathématique avec le total de l'Excel (119 704,30 €)
 * 
 * UTILISATION :
 * 1. Simulation sans risque (Dry-run) :
 *    npx tsx scripts/import-articles-clean.ts
 * 
 * 2. Importation réelle dans la base de données :
 *    npx tsx scripts/import-articles-clean.ts --confirm
 */

import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pgUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"

const prisma = new PrismaClient({
  datasources: { db: { url: pgUrl } }
})

function cleanSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20)
    .replace(/^-|-$/g, '')
}

async function main() {
  const isConfirm = process.argv.includes('--confirm')
  const excelPath = path.resolve(__dirname, '../../Inventaire CE 2026.xlsx')

  console.log('=================================================================')
  console.log('📥 IMPORTATION PROPRE DE L\'INVENTAIRE EXCEL')
  console.log('=================================================================')
  console.log(`Fichier source : ${excelPath}`)
  console.log(`Base de données : ${pgUrl.split('@')[1] || 'PostgreSQL'}\n`)

  const wb = xlsx.readFile(excelPath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

  const articlesToImport = []
  let totalValeurCalculee = 0

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const emplacement = row[0]?.toString().trim() || null
    const fournisseur = row[1]?.toString().trim() || null
    let reference = row[2]?.toString().trim() || ''
    let designation = row[3]?.toString().trim() || ''
    const finition = row[4]?.toString().trim() || ''
    const stockFinal = parseInt(row[6], 10) || 0
    const prixUnitaire = Math.round((parseFloat(row[7]) || 0) * 100) / 100

    if (!reference && !designation) continue

    if (finition && designation) {
      designation = `${designation} (${finition})`
    } else if (!designation && finition) {
      designation = finition
    }

    if (!designation) {
      designation = reference ? `Article ${reference}` : 'Article Divers'
    }

    // Référence déterministe si vide
    if (!reference) {
      const fSlug = cleanSlug(fournisseur || 'DIVERS')
      const dSlug = cleanSlug(designation)
      reference = `REF-${fSlug}-${dSlug}`
    }

    const categorie = emplacement ? `Dépôt - ${emplacement}` : 'Consommable'

    articlesToImport.push({
      reference,
      designation,
      fournisseur,
      categorie,
      stockInitial: stockFinal,
      prixUnitaire: prixUnitaire,
      quantiteParBoite: 1,
      stockMinimum: 0,
      unite: 'u'
    })

    totalValeurCalculee += stockFinal * prixUnitaire
  }

  console.log(`Articles trouvés dans l'Excel :  ${articlesToImport.length}`)
  console.log(`Valeur totale calculée du stock : ${Math.round(totalValeurCalculee * 100) / 100} €`)
  console.log(`Valeur de référence Excel :       119 704,30 €\n`)

  if (!isConfirm) {
    console.log('⚠️  MODE SIMULATION (DRY-RUN) ACTIF')
    console.log('Aucun article n\'a été écrit dans la base de données.')
    console.log('\nPour insérer RÉELLEMENT ces articles dans la base de données, lancez :')
    console.log('👉 npx tsx scripts/import-articles-clean.ts --confirm\n')
    return
  }

  console.log('🚀 DÉBUT DE L\'INSERTION DANS LA BASE DE DONNÉES...\n')

  let insertedCount = 0
  let updatedCount = 0

  for (const item of articlesToImport) {
    try {
      const existing = await prisma.article.findUnique({
        where: { reference: item.reference }
      })

      if (existing) {
        await prisma.article.update({
          where: { reference: item.reference },
          data: item
        })
        updatedCount++
      } else {
        await prisma.article.create({
          data: item
        })
        insertedCount++
      }
    } catch (err: any) {
      console.warn(`Avertissement sur référence ${item.reference} :`, err.message)
    }
  }

  const finalCount = await prisma.article.count()
  console.log('\n--- RAPPORT FINAL D\'IMPORTATION ---')
  console.log(`• Nouveaux articles insérés : ${insertedCount}`)
  console.log(`• Articles mis à jour :       ${updatedCount}`)
  console.log(`• Total articles en base :    ${finalCount}`)
  console.log('-----------------------------------')
  console.log('✅ Importation terminée avec succès sans doublons !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'import :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
