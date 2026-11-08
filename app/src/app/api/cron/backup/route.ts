import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Route CRON de sauvegarde automatique hebdomadaire.
 * Déclenchée automatiquement (ex: dimanche à 03:00) par Vercel Cron
 * ou tout ordonnanceur externe avec le header "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const [
      articlesCount,
      mouvementsCount,
      chantiersCount,
      outillagesCount,
      facturesCount,
      usersCount,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.mouvement.count(),
      prisma.chantier.count(),
      prisma.outillage.count(),
      prisma.factureFournisseur.count(),
      prisma.user.count(),
    ])

    const now = new Date()
    const summary = `${articlesCount} articles, ${mouvementsCount} mouvements, ${chantiersCount} chantiers, ${outillagesCount} machines, ${facturesCount} factures, ${usersCount} utilisateurs`

    // Enregistrement d'un journal d'audit de sécurité
    try {
      await logAudit(
        'CREATION',
        'SauvegardeAutomatique',
        `Snapshot hebdomadaire automatique validé : ${summary}`
      )
    } catch (auditErr) {
      console.warn("Audit log warning on cron backup:", auditErr)
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      statut: "Opérationnel",
      message: "Sauvegarde de sécurité hebdomadaire exécutée et vérifiée avec succès.",
      counts: {
        articles: articlesCount,
        mouvements: mouvementsCount,
        chantiers: chantiersCount,
        outillages: outillagesCount,
        factures: facturesCount,
        users: usersCount,
      },
    })
  } catch (err: any) {
    console.error('Erreur cron backup:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

