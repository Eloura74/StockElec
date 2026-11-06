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
  const ok = await assurerColonneAdresse()
  if (!ok) return map
  try {
    const rows = await prisma.$queryRawUnsafe<{ id: string; adresse: string | null }[]>(
      `SELECT "id", "adresse" FROM "Chantier" WHERE "adresse" IS NOT NULL`
    )
    for (const r of rows) {
      if (r.id && r.adresse && r.adresse.trim()) {
        map.set(r.id, r.adresse.trim())
      }
    }
  } catch (err) {
    console.warn("Info: lecture adresses chantiers ignorée:", err)
  }
  return map
}

/**
 * Récupère l'adresse d'un chantier spécifique.
 */
export async function chargerAdresseChantier(id: string): Promise<string | null> {
  const ok = await assurerColonneAdresse()
  if (!ok) return null
  try {
    const rows = await prisma.$queryRaw<{ adresse: string | null }[]>`
      SELECT "adresse" FROM "Chantier" WHERE "id" = ${id} LIMIT 1
    `
    const adr = rows[0]?.adresse?.trim()
    return adr || null
  } catch {
    return null
  }
}

/**
 * Enregistre ou met à jour l'adresse d'un chantier de manière sécurisée (requête paramétrée).
 */
export async function sauvegarderAdresseChantier(
  id: string,
  adresse: string | null | undefined
): Promise<void> {
  const ok = await assurerColonneAdresse()
  if (!ok) return
  const propre = adresse?.trim() || null
  try {
    await prisma.$executeRaw`
      UPDATE "Chantier" SET "adresse" = ${propre} WHERE "id" = ${id}
    `
  } catch (err) {
    console.warn("Info: sauvegarde adresse chantier ignorée:", err)
  }
}

