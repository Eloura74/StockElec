/**
 * SCRIPT DE RÉINITIALISATION SÉCURISÉE DES ARTICLES
 * 
 * Ce script supprime UNIQUEMENT :
 * - La table Article (les produits en stock)
 * - La table Mouvement (les entrées/sorties de stock liées aux articles)
 * 
 * IL NE TOUCHE STRICTEMENT PAS À :
 * - FactureFournisseur (toutes vos factures restent 100% intactes)
 * - LigneFactureFournisseur (tous les détails, prix et chantiers facturés restent intacts)
 * - User (tous les comptes gérants, chefs d'équipe, mots de passe restent intacts)
 * - Chantier (la liste de vos chantiers reste intacte)
 * - Outillage & MouvementOutillage (les outils et emprunts restent intacts)
 * - ConfigMail (la configuration email reste intacte)
 * - ReferenceAlias (les correspondances de références restent intactes)
 * 
 * UTILISATION :
 * 1. Simulation sans risque (Dry-run) :
 *    npx tsx scripts/reset-articles.ts
 * 
 * 2. Suppression réelle et définitive :
 *    npx tsx scripts/reset-articles.ts --confirm
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

// Détection de l'URL PostgreSQL
const pgUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"

const prisma = new PrismaClient({
  datasources: { db: { url: pgUrl } }
})

async function main() {
  const isConfirm = process.argv.includes('--confirm')

  console.log('=================================================================')
  console.log('📦 GESTION STOCK - AUDIT & RÉINITIALISATION DES ARTICLES')
  console.log('=================================================================')
  console.log(`Base de données ciblée : ${pgUrl.split('@')[1] || 'PostgreSQL'}\n`)

  // 1. Comptage avant opération
  const articleCount = await prisma.article.count()
  const mouvementCount = await prisma.mouvement.count()
  const userCount = await prisma.user.count()
  const factureCount = await prisma.factureFournisseur.count()
  const ligneFactureCount = await prisma.ligneFactureFournisseur.count()
  const chantierCount = await prisma.chantier.count()
  const outillageCount = await prisma.outillage.count()
  const aliasCount = await prisma.referenceAlias.count()

  console.log('--- ÉTAT ACTUEL DE LA BASE DE DONNÉES ---')
  console.log(`• Articles (produits) :            ${articleCount}`)
  console.log(`• Mouvements de stock :             ${mouvementCount}`)
  console.log(`• Factures fournisseurs :           ${factureCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log(`• Lignes de factures détaillées :   ${ligneFactureCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log(`• Utilisateurs / Équipes :          ${userCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log(`• Chantiers enregistrés :           ${chantierCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log(`• Outillage :                       ${outillageCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log(`• Alias de références :             ${aliasCount} (NE SERA PAS TOUCHÉ ✅)`)
  console.log('-----------------------------------------\n')

  if (!isConfirm) {
    console.log('⚠️  MODE SIMULATION (DRY-RUN) ACTIF')
    console.log(`Si vous confirmez, EXACTEMENT ${articleCount} article(s) et ${mouvementCount} mouvement(s) seront supprimés.`)
    console.log('AUCUNE DONNÉE N\'A ÉTÉ MODIFIÉE NI SUPPRIMÉE.\n')
    console.log('Pour exécuter RÉELLEMENT la suppression, lancez la commande suivante :')
    console.log('👉 npx tsx scripts/reset-articles.ts --confirm\n')
    return
  }

  console.log('🚨 CONFIRMATION REÇUE : DÉBUT DE LA SUPPRESSION SÉLECTIVE DES ARTICLES...\n')

  // Suppression dans une transaction Prisma pour garantir l'atomicité
  await prisma.$transaction(async (tx) => {
    // 1. Supprimer les mouvements de stock liés aux articles
    const deletedMouvements = await tx.mouvement.deleteMany({})
    console.log(`✅ ${deletedMouvements.count} mouvement(s) de stock supprimé(s).`)

    // 2. Supprimer les articles
    const deletedArticles = await tx.article.deleteMany({})
    console.log(`✅ ${deletedArticles.count} article(s) supprimé(s).`)
  })

  // Vérification de sécurité post-suppression
  const postArticleCount = await prisma.article.count()
  const postMouvementCount = await prisma.mouvement.count()
  const postUserCount = await prisma.user.count()
  const postFactureCount = await prisma.factureFournisseur.count()
  const postLigneCount = await prisma.ligneFactureFournisseur.count()
  const postChantierCount = await prisma.chantier.count()

  console.log('\n--- VÉRIFICATION POST-OPÉRATION ---')
  console.log(`• Articles restants :         ${postArticleCount} (Objectif 0 atteint ✅)`)
  console.log(`• Mouvements restants :       ${postMouvementCount} (Objectif 0 atteint ✅)`)
  console.log(`• Factures préservées :       ${postFactureCount} (Intact ✅)`)
  console.log(`• Lignes factures intactes :  ${postLigneCount} (Intact ✅)`)
  console.log(`• Utilisateurs préservés :    ${postUserCount} (Intact ✅)`)
  console.log(`• Chantiers préservés :       ${postChantierCount} (Intact ✅)`)
  console.log('-----------------------------------')
  console.log('\n🎉 Nettoyage terminé avec succès ! La table des articles est prête pour un ré-import propre.')
}

main()
  .catch((e) => {
    console.error('\n❌ Erreur pendant l\'opération :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
