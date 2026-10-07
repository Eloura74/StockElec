import fs from 'fs'
import path from 'path'
import { getSession } from './auth'

export type AuditAction = 'SUPPRESSION' | 'MODIFICATION' | 'CREATION'

export interface AuditEntry {
  id: string
  date: string
  user: string
  action: AuditAction
  entite: string
  details: string
}

const auditFilePath = path.join(process.cwd(), 'data', 'audit.json')

export async function logAudit(action: AuditAction, entite: string, details: string) {
  try {
    const session = await getSession()
    const user = session?.username || 'Système/Inconnu'

    const entry: AuditEntry = {
      id: Math.random().toString(36).substring(2, 15),
      date: new Date().toISOString(),
      user,
      action,
      entite,
      details,
    }

    let logs: AuditEntry[] = []
    if (fs.existsSync(auditFilePath)) {
      const fileData = fs.readFileSync(auditFilePath, 'utf8')
      if (fileData) {
        logs = JSON.parse(fileData)
      }
    }

    logs.unshift(entry)

    // Garder les 1000 derniers logs maximum
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000)
    }

    fs.writeFileSync(auditFilePath, JSON.stringify(logs, null, 2))
    console.log(`[AUDIT] ${user} a fait ${action} sur ${entite}: ${details}`)
  } catch (error) {
    console.error("Erreur lors de l'écriture de l'audit log", error)
  }
}

export async function getAuditLogs(): Promise<AuditEntry[]> {
  try {
    if (!fs.existsSync(auditFilePath)) return []
    const fileData = fs.readFileSync(auditFilePath, 'utf8')
    if (!fileData) return []
    return JSON.parse(fileData)
  } catch (error) {
    console.error("Erreur lors de la lecture des logs d'audit", error)
    return []
  }
}
