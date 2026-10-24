"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { executerImport, type OptionsImport, type StatsImport } from "@/lib/import-articles-db"

async function exigerGerant() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") throw new Error("Accès réservé au gérant")
  return session
}

/**
 * Importe (ou simule si dryRun) un lot de lignes déjà analysées dans le navigateur.
 * Le client découpe le fichier en lots pour rester sous la limite de taille des Server Actions.
 */
export async function importerLotArticles(lignes: unknown[], options: OptionsImport, dryRun: boolean) {
  try {
    const session = await exigerGerant()
    const res = await executerImport(prisma, lignes, options, dryRun, String(session.username ?? "Import"))
    return { success: true as const, ...res }
  } catch (error: any) {
    console.error("[IMPORT] Erreur lot:", error)
    return { success: false as const, error: error?.message || "Erreur inconnue" }
  }
}

/** Appelé une fois l'import terminé : journal d'audit + rafraîchissement des pages. */
export async function finaliserImportArticles(nomFichier: string, stats: StatsImport) {
  await exigerGerant()
  await logAudit(
    "CREATION",
    "Import Excel articles",
    `${String(nomFichier).slice(0, 120)} : ${stats.creation} créés, ${stats.mise_a_jour} mis à jour, ` +
      `${stats.correctionsStock} corrections de stock, ${stats.ignore} ignorés, ${stats.erreur} erreurs`,
  )
  revalidatePath("/catalogue")
  revalidatePath("/inventaire")
  revalidatePath("/reassort")
  revalidatePath("/mouvements")
  revalidatePath("/")
  return { success: true }
}
