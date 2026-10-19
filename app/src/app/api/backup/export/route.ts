import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GERANT') {
      return NextResponse.json({ error: 'Accès réservé au gérant' }, { status: 403 })
    }

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

    const dateStr = new Date().toISOString().slice(0, 10)
    const payload = {
      metadata: {
        date: new Date().toISOString(),
        version: '1.0',
        exporter: session.username,
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

    const jsonString = JSON.stringify(payload, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="stockpro-backup-${dateStr}.json"`
      }
    })
  } catch (err: any) {
    console.error('Erreur export backup:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
