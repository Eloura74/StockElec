"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Smartphone,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  listOutboxOperations,
  removeOutboxOperations,
  syncOutboxNow,
  OFFLINE_CHANGE_EVENT,
  type OfflineOperation,
} from "@/lib/offline-sync"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function OfflineSyncBanner() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [operations, setOperations] = useState<OfflineOperation[]>([])
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [showQueueDetails, setShowQueueDetails] = useState<boolean>(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissedInstall, setDismissedInstall] = useState<boolean>(false)
  const [justSyncedCount, setJustSyncedCount] = useState<number>(0)

  const refreshQueue = useCallback(async () => {
    const list = await listOutboxOperations()
    setOperations(list)
    return list
  }, [])

  const triggerSync = useCallback(
    async (silent = false) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!silent) toast.warning("Impossible de synchroniser : aucun réseau détecté.")
        return
      }
      const list = await listOutboxOperations()
      if (list.length === 0) return

      setIsSyncing(true)
      try {
        const res = await syncOutboxNow()
        await refreshQueue()
        if (res.syncedCount > 0) {
          setJustSyncedCount(res.syncedCount)
          toast.success(
            `✅ ${res.syncedCount} opération(s) hors-ligne synchronisée(s) avec le serveur !`
          )
          router.refresh()
          setTimeout(() => setJustSyncedCount(0), 5000)
        }
        if (res.errors.length > 0 && !silent) {
          toast.error(`Synchronisation partielle : ${res.errors[0]}`)
        }
      } finally {
        setIsSyncing(false)
      }
    },
    [refreshQueue, router]
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    let cancelled = false
    listOutboxOperations()
      .then((list) => {
        if (cancelled) return
        setOperations(list)
        if (navigator.onLine && list.length > 0) {
          triggerSync(true)
        }
      })
      .catch(() => {})

    // Enregistrement du Service Worker Hors-Ligne
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
      const onSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "STOCKELEC_TRIGGER_SYNC") {
          triggerSync(true)
        }
      }
      navigator.serviceWorker.addEventListener("message", onSwMessage)
    }

    const handleOnline = () => {
      setIsOnline(true)
      toast.info("📶 Réseau retrouvé : synchronisation automatique en cours…")
      triggerSync(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning(
        "📡 Mode Hors-Ligne activé : vos scans et validations sont enregistrés sur le téléphone."
      )
    }

    const handleOfflineChange = () => {
      refreshQueue().then((list) => {
        if (navigator.onLine && list.length > 0) {
          triggerSync(true)
        }
      })
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        triggerSync(true)
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener(OFFLINE_CHANGE_EVENT, handleOfflineChange)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      cancelled = true
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener(OFFLINE_CHANGE_EVENT, handleOfflineChange)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [refreshQueue, triggerSync])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === "accepted") {
      setInstallPrompt(null)
      toast.success("Application StockElec installée sur votre écran d'accueil !")
    }
  }

  const handleCancelOperation = async (id: string) => {
    await removeOutboxOperations([id])
    await refreshQueue()
    toast.info("Opération retirée de la file d'attente hors-ligne.")
  }

  const showBanner =
    !isOnline || operations.length > 0 || justSyncedCount > 0 || (installPrompt && !dismissedInstall)

  if (!showBanner) return null

  return (
    <div className="space-y-2 mb-4">
      {/* Bandeau Mode Hors-Ligne ou File d'attente de synchronisation */}
      {(!isOnline || operations.length > 0 || justSyncedCount > 0) && (
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all ${
            !isOnline
              ? "bg-amber-50/95 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-100"
              : operations.length > 0
                ? "bg-blue-50/95 border-blue-300 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500/40 dark:text-blue-100"
                : "bg-emerald-50/95 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  !isOnline
                    ? "bg-amber-500 text-white"
                    : operations.length > 0
                      ? "bg-blue-600 text-white"
                      : "bg-emerald-600 text-white"
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="w-5 h-5" />
                ) : isSyncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : operations.length > 0 ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="font-bold text-sm leading-snug flex items-center gap-2 flex-wrap">
                  {!isOnline ? (
                    <>
                      <span>Mode Hors-Ligne actif</span>
                      {operations.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-600 text-white">
                          {operations.length} en attente
                        </span>
                      )}
                    </>
                  ) : operations.length > 0 ? (
                    <>
                      <span>
                        {isSyncing
                          ? `Synchronisation de ${operations.length} opération(s)…`
                          : `${operations.length} opération(s) hors-ligne prête(s) à synchroniser`}
                      </span>
                    </>
                  ) : (
                    <span>
                      Synchronisation terminée ({justSyncedCount} opération
                      {justSyncedCount > 1 ? "s" : ""} mise{justSyncedCount > 1 ? "s" : ""} à jour)
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-85 mt-0.5">
                  {!isOnline
                    ? "Vous pouvez continuer à scanner, sortir du matériel ou créer des articles : tout sera envoyé automatiquement dès le retour de la 4G / Wi-Fi."
                    : operations.length > 0
                      ? "Connexion rétablie : envoi automatique de vos opérations enregistrées hors-ligne."
                      : "Le stock central et votre téléphone sont parfaitement synchronisés."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {operations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowQueueDetails((v) => !v)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 hover:bg-white transition-colors"
                >
                  <span>Détails ({operations.length})</span>
                  {showQueueDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {isOnline && operations.length > 0 && (
                <button
                  type="button"
                  onClick={() => triggerSync(false)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Envoi…" : "Synchroniser"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Liste détaillée des opérations en attente sur le téléphone */}
          {showQueueDetails && operations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                File d&apos;attente enregistrée sur cet appareil :
              </div>
              {operations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/85 dark:bg-zinc-900/85 border border-black/5 dark:border-white/10 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {op.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Enregistré à{" "}
                      {new Date(op.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelOperation(op.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                    title="Annuler cette opération avant synchronisation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proposition d'installation de l'application Android / Mobile (PWA native) */}
      {installPrompt && !dismissedInstall && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/30 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-100">
                Installer l&apos;application StockElec sur ce téléphone
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 truncate">
                Accès rapide plein écran et fonctionnement hors-ligne sur chantier.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              Installer
            </button>
            <button
              type="button"
              onClick={() => setDismissedInstall(true)}
              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              aria-label="Masquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
