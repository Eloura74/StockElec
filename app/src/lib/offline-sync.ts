/**
 * Moteur Offline-First & File d'attente de synchronisation (IndexedDB) — StockElec
 *
 * Fonctionnalités :
 *  1. Stocke localement dans le téléphone (IndexedDB) le dernier catalogue d'articles,
 *     la liste des chantiers, l'outillage et les quantités déployées par chantier.
 *  2. Enregistre dans une file d'attente persistante (`outbox`) toutes les actions réalisées
 *     hors-ligne (Départ Matin, Retour Chantier, Création/Modification d'article, Ajustement de stock,
 *     Emprunt/Retour d'outillage) avec un identifiant unique `id` (anti-doublon à la reconnexion).
 *  3. Calcule l'état « optimiste » en temps réel (le stock affiché sur le téléphone tient compte
 *     immédiatement des opérations en attente, même si l'utilisateur ferme et rouvre l'application sans réseau).
 *  4. Synchronise automatiquement toute la file d'attente vers `/api/sync` dès le retour du réseau.
 */

import type { ArticleChef } from "@/components/ArticlesChefPanel"
import type { ArticleChefInput } from "@/app/actions/chef-articles"
import type { TypeMouvementChantier } from "@/app/actions/retour"

const DB_NAME = "stockelec-offline-v1"
const DB_VERSION = 1
const STORE_OUTBOX = "outbox"
const STORE_SNAPSHOTS = "snapshots"
const SNAPSHOT_KEY = "depart-matin-state"

export type OfflineDepartPayload = {
  chantierId: string
  chantierNom: string
  username: string
  lignes: { articleId: string; designation: string; quantite: number }[]
  observation: string
}

export type OfflineRetourPayload = {
  chantierId: string
  chantierNom: string
  username: string
  lignes: { articleId: string; designation: string; quantite: number; type: TypeMouvementChantier }[]
  observation: string
}

export type OfflineCreateArticlePayload = {
  tempId: string
  input: ArticleChefInput
}

export type OfflineUpdateArticlePayload = {
  input: ArticleChefInput
  nouveauStock?: number
}

export type OfflineAdjustStockPayload = {
  articleId: string
  designation: string
  nouveauStock: number
}

export type OfflineOutillagePayload = {
  outillageId: string
  outillageNom: string
  type: "Emprunt" | "Retour" | "Réparation" | "Perte" | string
  chantierId: string | null
  utilisateur: string
  observation: string
}

export type OfflineOperation =
  | {
      id: string
      createdAt: number
      type: "DEPART_MATIN"
      label: string
      payload: OfflineDepartPayload
    }
  | {
      id: string
      createdAt: number
      type: "RETOUR_CHANTIER"
      label: string
      payload: OfflineRetourPayload
    }
  | {
      id: string
      createdAt: number
      type: "CREER_ARTICLE_CHEF"
      label: string
      payload: OfflineCreateArticlePayload
    }
  | {
      id: string
      createdAt: number
      type: "MODIFIER_ARTICLE_CHEF"
      label: string
      payload: OfflineUpdateArticlePayload
    }
  | {
      id: string
      createdAt: number
      type: "AJUSTER_STOCK_CHEF"
      label: string
      payload: OfflineAdjustStockPayload
    }
  | {
      id: string
      createdAt: number
      type: "OUTILLAGE_MOUVEMENT"
      label: string
      payload: OfflineOutillagePayload
    }

export type OfflineSnapshot = {
  key: string
  updatedAt: number
  articles: ArticleChef[]
  chantiers: { id: string; nom: string }[]
  outillages: any[]
  deployeParChantier: Record<string, Record<string, number>>
}

export const OFFLINE_CHANGE_EVENT = "stockelec-offline-change"

function notifyOfflineChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_CHANGE_EVENT))
  }
}

export function generateOfflineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `off-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function openOfflineDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const store = db.createObjectStore(STORE_OUTBOX, { keyPath: "id" })
          store.createIndex("createdAt", "createdAt", { unique: false })
        }
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS, { keyPath: "key" })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function saveOfflineSnapshot(
  data: Omit<OfflineSnapshot, "key" | "updatedAt">
): Promise<void> {
  const db = await openOfflineDB()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SNAPSHOTS, "readwrite")
      tx.objectStore(STORE_SNAPSHOTS).put({
        key: SNAPSHOT_KEY,
        updatedAt: Date.now(),
        ...data,
      } satisfies OfflineSnapshot)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

export async function getOfflineSnapshot(): Promise<OfflineSnapshot | null> {
  const db = await openOfflineDB()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SNAPSHOTS, "readonly")
      const req = tx.objectStore(STORE_SNAPSHOTS).get(SNAPSHOT_KEY)
      req.onsuccess = () => resolve((req.result as OfflineSnapshot) ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function listOutboxOperations(): Promise<OfflineOperation[]> {
  const db = await openOfflineDB()
  if (!db) return []
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readonly")
      const req = tx.objectStore(STORE_OUTBOX).getAll()
      req.onsuccess = () => {
        const list = ((req.result as OfflineOperation[]) ?? []).sort(
          (a, b) => a.createdAt - b.createdAt
        )
        resolve(list)
      }
      req.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
}

export async function enqueueOfflineOperation(
  op: Omit<OfflineOperation, "id" | "createdAt">
): Promise<OfflineOperation> {
  const fullOp = {
    ...op,
    id: generateOfflineId(),
    createdAt: Date.now(),
  } as OfflineOperation

  const db = await openOfflineDB()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_OUTBOX, "readwrite")
        tx.objectStore(STORE_OUTBOX).put(fullOp)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  // Enregistrer un Background Sync auprès du Service Worker si supporté (Android Chrome)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if (reg && "sync" in reg) {
          return reg.sync.register("stockelec-sync-outbox")
        }
      })
      .catch(() => {})
  }

  notifyOfflineChange()
  return fullOp
}

export async function removeOutboxOperations(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openOfflineDB()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readwrite")
      const store = tx.objectStore(STORE_OUTBOX)
      for (const id of ids) {
        store.delete(id)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
  notifyOfflineChange()
}

let isSyncInProgress = false

/**
 * Envoie toutes les opérations en attente vers `/api/sync` dans l'ordre chronologique.
 */
export async function syncOutboxNow(): Promise<{
  syncedCount: number
  remainingCount: number
  errors: string[]
}> {
  if (typeof window === "undefined") {
    return { syncedCount: 0, remainingCount: 0, errors: [] }
  }
  if (!navigator.onLine) {
    const pending = await listOutboxOperations()
    return { syncedCount: 0, remainingCount: pending.length, errors: ["Appareil hors-ligne"] }
  }
  if (isSyncInProgress) {
    const pending = await listOutboxOperations()
    return { syncedCount: 0, remainingCount: pending.length, errors: [] }
  }

  const operations = await listOutboxOperations()
  if (operations.length === 0) {
    return { syncedCount: 0, remainingCount: 0, errors: [] }
  }

  isSyncInProgress = true
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations }),
    })

    if (!res.ok) {
      return {
        syncedCount: 0,
        remainingCount: operations.length,
        errors: [`Erreur serveur (${res.status})`],
      }
    }

    const data = await res.json()
    const syncedIds: string[] = Array.isArray(data.syncedIds) ? data.syncedIds : []
    const errors: string[] = Array.isArray(data.errors) ? data.errors : []

    if (syncedIds.length > 0) {
      await removeOutboxOperations(syncedIds)
    }

    const remaining = await listOutboxOperations()
    return {
      syncedCount: syncedIds.length,
      remainingCount: remaining.length,
      errors,
    }
  } catch {
    return {
      syncedCount: 0,
      remainingCount: operations.length,
      errors: ["Connexion réseau interrompue pendant la synchronisation"],
    }
  } finally {
    isSyncInProgress = false
  }
}

/**
 * Applique en temps réel les opérations hors-ligne en attente sur les données locales
 * pour que l'utilisateur voie immédiatement son stock et ses articles mis à jour sur le téléphone.
 */
export function appliquerOperationsOptimistes(
  base: {
    articles: ArticleChef[]
    outillages: any[]
    deployeParChantier: Record<string, Record<string, number>>
  },
  operations: OfflineOperation[]
): {
  articles: ArticleChef[]
  outillages: any[]
  deployeParChantier: Record<string, Record<string, number>>
} {
  if (operations.length === 0) return base

  const articlesMap = new Map<string, ArticleChef>(
    base.articles.map((a) => [a.id, { ...a }])
  )
  const outillagesMap = new Map<string, any>(
    base.outillages.map((o: any) => [o.id, { ...o }])
  )
  const deploye: Record<string, Record<string, number>> = {}
  for (const [chId, mapArt] of Object.entries(base.deployeParChantier)) {
    deploye[chId] = { ...mapArt }
  }

  for (const op of operations) {
    switch (op.type) {
      case "CREER_ARTICLE_CHEF": {
        const { tempId, input } = op.payload
        const nouvelArticle: ArticleChef = {
          id: tempId,
          designation: input.designation.trim(),
          reference: input.reference?.trim() || `REF-${op.createdAt}`,
          codeBarre: input.codeBarre?.trim() || null,
          fournisseur: input.fournisseur?.trim() || null,
          referenceFournisseur: input.referenceFournisseur?.trim() || null,
          categorie: input.categorie?.trim() || "À classer",
          unite: input.unite?.trim() || "u",
          stockMinimum: Number(input.stockMinimum) || 0,
          quantiteParBoite: Number(input.quantiteParBoite) || 1,
          stockActuel: Number(input.stockInitial) || 0,
        }
        articlesMap.set(tempId, nouvelArticle)
        break
      }

      case "MODIFIER_ARTICLE_CHEF": {
        const { input, nouveauStock } = op.payload
        if (input.id && articlesMap.has(input.id)) {
          const ex = articlesMap.get(input.id)!
          articlesMap.set(input.id, {
            ...ex,
            designation: input.designation.trim() || ex.designation,
            reference: input.reference?.trim() || ex.reference,
            codeBarre: input.codeBarre?.trim() || null,
            fournisseur: input.fournisseur?.trim() || null,
            referenceFournisseur: input.referenceFournisseur?.trim() || null,
            categorie: input.categorie?.trim() || ex.categorie,
            unite: input.unite?.trim() || ex.unite,
            stockMinimum:
              input.stockMinimum !== undefined ? Number(input.stockMinimum) : ex.stockMinimum,
            quantiteParBoite:
              input.quantiteParBoite !== undefined
                ? Number(input.quantiteParBoite)
                : ex.quantiteParBoite,
            stockActuel: nouveauStock !== undefined ? nouveauStock : ex.stockActuel,
          })
        }
        break
      }

      case "AJUSTER_STOCK_CHEF": {
        const { articleId, nouveauStock } = op.payload
        const ex = articlesMap.get(articleId)
        if (ex) {
          articlesMap.set(articleId, { ...ex, stockActuel: nouveauStock })
        }
        break
      }

      case "DEPART_MATIN": {
        const { chantierId, lignes } = op.payload
        if (!deploye[chantierId]) deploye[chantierId] = {}
        for (const l of lignes) {
          const ex = articlesMap.get(l.articleId)
          if (ex) {
            articlesMap.set(l.articleId, {
              ...ex,
              stockActuel: ex.stockActuel - l.quantite,
            })
          }
          deploye[chantierId][l.articleId] =
            (deploye[chantierId][l.articleId] || 0) + l.quantite
        }
        break
      }

      case "RETOUR_CHANTIER": {
        const { chantierId, lignes } = op.payload
        if (!deploye[chantierId]) deploye[chantierId] = {}
        for (const l of lignes) {
          if (l.type === "Retour") {
            const ex = articlesMap.get(l.articleId)
            if (ex) {
              articlesMap.set(l.articleId, {
                ...ex,
                stockActuel: ex.stockActuel + l.quantite,
              })
            }
          }
          const actuelChantier = deploye[chantierId][l.articleId] || 0
          deploye[chantierId][l.articleId] = Math.max(0, actuelChantier - l.quantite)
        }
        break
      }

      case "OUTILLAGE_MOUVEMENT": {
        const { outillageId, type, chantierId, utilisateur } = op.payload
        const ex = outillagesMap.get(outillageId)
        if (ex) {
          let nouveauStatut = ex.statut
          if (type === "Emprunt") nouveauStatut = "En Chantier"
          else if (type === "Retour") nouveauStatut = "Disponible"
          else if (type === "Réparation") nouveauStatut = "En Réparation"
          else if (type === "Perte") nouveauStatut = "Perdu"

          outillagesMap.set(outillageId, {
            ...ex,
            statut: nouveauStatut,
            chantierId: type === "Emprunt" ? chantierId : null,
            utilisateur: type === "Emprunt" ? utilisateur : null,
          })
        }
        break
      }
    }
  }

  return {
    articles: Array.from(articlesMap.values()),
    outillages: Array.from(outillagesMap.values()),
    deployeParChantier: deploye,
  }
}

