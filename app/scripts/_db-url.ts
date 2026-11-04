/**
 * Résolution sécurisée de l'URL de base de données pour les scripts.
 *
 * - Aucune URL en dur : DATABASE_URL est obligatoire.
 * - Une base distante (≠ localhost) n'est utilisable par un script destructif
 *   que si CONFIRM_REMOTE_DB=oui est explicitement fourni.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']

export function getDatabaseUrl(options: { destructive?: boolean } = {}): string {
  const url = process.env.DATABASE_URL

  if (!url || !url.startsWith('postgres')) {
    console.error("❌ DATABASE_URL manquante ou invalide (postgres://...). Voir app/.env.example.")
    process.exit(1)
  }

  const host = new URL(url).hostname
  const isLocal = LOCAL_HOSTS.includes(host)

  if (options.destructive && !isLocal && process.env.CONFIRM_REMOTE_DB !== 'oui') {
    console.error(`❌ Script destructif refusé : la base ciblée (${host}) n'est pas locale.`)
    console.error("   Pour confirmer sciemment : définir CONFIRM_REMOTE_DB=oui")
    process.exit(1)
  }

  return url
}
