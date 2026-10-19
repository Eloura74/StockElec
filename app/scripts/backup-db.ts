/**
 * SCRIPT DE SAUVEGARDE COMPLÈTE DE LA BASE DE DONNÉES
 * 
 * Exporte l'intégralité des tables dans un fichier JSON horodaté :
 * dossier : app/backups/backup-YYYY-MM-DD_HH-mm-ss.json
 * 
 * UTILISATION :
 * npm run backup
 * ou : npx tsx scripts/backup-db.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pgUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"

const prisma = new PrismaClient({
  datasources: { db: { url: pgUrl } }
})

async function main() {
  console.log('=================================================================')
  console.log('💾 CRÉATION D\'UN INSTANTANÉ COMPLET DE LA BASE DE DONNÉES')
  console.log('=================================================================')
  console.log(`Base ciblée : ${pgUrl.split('@')[1] || 'PostgreSQL'}\n`)

  const [
    users,
    factures,
    lignesFactures,
    chantiers,
    outillages,
    mouvementsOutillage,
    articles,
    mouvements,
    configMail,
    aliases
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.factureFournisseur.findMany(),
    prisma.ligneFactureFournisseur.findMany(),
    prisma.chantier.findMany(),
    prisma.outillage.findMany(),
    prisma.mouvementOutillage.findMany(),
    prisma.article.findMany(),
    prisma.mouvement.findMany(),
    prisma.configMail.findMany(),
    prisma.referenceAlias.findMany(),
  ])

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupsDir = path.resolve(__dirname, '../backups')

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }

  const backupFilePath = path.join(backupsDir, `backup-${timestamp}.json`)

  const payload = {
    metadata: {
      date: new Date().toISOString(),
      version: '1.0',
      database: pgUrl.split('@')[1] || 'PostgreSQL',
      counts: {
        users: users.length,
        factures: factures.length,
        lignesFactures: lignesFactures.length,
        chantiers: chantiers.length,
        outillages: outillages.length,
        mouvementsOutillage: mouvementsOutillage.length,
        articles: articles.length,
        mouvements: mouvements.length,
        configMail: configMail.length,
        aliases: aliases.length
      }
    },
    tables: {
      users,
      factures,
      lignesFactures,
      chantiers,
      outillages,
      mouvementsOutillage,
      articles,
      mouvements,
      configMail,
      aliases
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(payload, null, 2), 'utf-8')
  const stats = fs.statSync(backupFilePath)
  const sizeKB = Math.round(stats.size / 1024)

  console.log('--- STATISTIQUES DE LA SAUVEGARDE ---')
  console.log(`• Utilisateurs :            ${users.length}`)
  console.log(`• Factures :                ${factures.length}`)
  console.log(`• Lignes de factures :      ${lignesFactures.length}`)
  console.log(`• Chantiers :               ${chantiers.length}`)
  console.log(`• Outillage :               ${outillages.length}`)
  console.log(`• Articles en stock :       ${articles.length}`)
  console.log(`• Mouvements de stock :     ${mouvements.length}`)
  console.log(`• Fichier généré :          ${backupFilePath}`)
  console.log(`• Taille de l'archive :     ${sizeKB} Ko`)
  console.log('-------------------------------------')
  console.log('✅ Sauvegarde réalisée avec succès !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
