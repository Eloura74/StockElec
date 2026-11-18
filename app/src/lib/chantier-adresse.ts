import prisma from "@/lib/prisma"

let colonneVerifiee = false

/**
 * S'assure de manière idempotente et 100 % non-destructive que la colonne "adresse"
 * existe sur la table "Chantier", sans modifier le schéma Prisma global (aucun risque
 * de casser les requêtes Prisma existantes en production).
 */
async function assurerColonneAdresse(): Promise<boolean> {
  if (colonneVerifiee) return true
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Chantier" ADD COLUMN IF NOT EXISTS "adresse" TEXT`
    )
    colonneVerifiee = true
    return true
  } catch (err) {
    console.warn("Info: vérification colonne adresse Chantier ignorée:", err)
    return false
  }
}

/**
 * Récupère le dictionnaire { chantierId -> adresse } pour tous les chantiers ayant une adresse.
 */
export async function chargerAdressesChantiers(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const chantiers = await prisma.chantier.findMany({
      where: { adresse: { not: null } },
      select: { id: true, adresse: true }
    })
    for (const c of chantiers) {
      if (c.id && c.adresse && c.adresse.trim()) {
        map.set(c.id, c.adresse.trim())
      }
    }
  } catch {
    // Repli raw SQL en cas de divergence de schéma temporaire
    try {
      await assurerColonneAdresse()
      const rows = await prisma.$queryRawUnsafe<{ id: string; adresse: string | null }[]>(
        `SELECT "id", "adresse" FROM "Chantier" WHERE "adresse" IS NOT NULL`
      )
      for (const r of rows) {
        if (r.id && r.adresse && r.adresse.trim()) {
          map.set(r.id, r.adresse.trim())
        }
      }
    } catch (rawErr) {
      console.warn("Info: lecture adresses chantiers ignorée:", rawErr)
    }
  }
  return map
}

/**
 * Récupère l'adresse d'un chantier spécifique.
 */
export async function chargerAdresseChantier(id: string): Promise<string | null> {
  try {
    const chantier = await prisma.chantier.findUnique({
      where: { id },
      select: { adresse: true }
    })
    return chantier?.adresse?.trim() || null
  } catch {
    try {
      await assurerColonneAdresse()
      const rows = await prisma.$queryRaw<{ adresse: string | null }[]>`
        SELECT "adresse" FROM "Chantier" WHERE "id" = ${id} LIMIT 1
      `
      return rows[0]?.adresse?.trim() || null
    } catch {
      return null
    }
  }
}

/**
 * Enregistre ou met à jour l'adresse d'un chantier de manière sécurisée (requête paramétrée).
 */
export async function sauvegarderAdresseChantier(
  id: string,
  adresse: string | null | undefined
): Promise<void> {
  const propre = adresse?.trim() || null
  try {
    await prisma.chantier.update({
      where: { id },
      data: { adresse: propre }
    })
  } catch {
    try {
      await assurerColonneAdresse()
      await prisma.$executeRaw`
        UPDATE "Chantier" SET "adresse" = ${propre} WHERE "id" = ${id}
      `
    } catch (err) {
      console.warn("Info: sauvegarde adresse chantier ignorée:", err)
    }
  }
}

