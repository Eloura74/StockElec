"use client"

import { useEffect, useState } from "react"
import { Download, Smartphone, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null
  }
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Détection si l'application tourne déjà en mode autonome (PWA installée)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://")
      setIsStandalone(Boolean(isStandaloneMode))
    }
    checkStandalone()

    // 2. Enregistrement systématique du Service Worker sur TOUTES les pages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          reg.update().catch(() => {})
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" })
          }
        })
        .catch((err) => {
          console.warn("[PWA] Erreur enregistrement SW:", err)
        })
    }

    // 3. Récupération d'un éventuel prompt différé
    if (window.__deferredPwaPrompt) {
      setInstallPrompt(window.__deferredPwaPrompt)
    }

    // 4. Écoute de l'événement natif Chrome Android `beforeinstallprompt`
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      const deferredEvent = e as BeforeInstallPromptEvent
      window.__deferredPwaPrompt = deferredEvent
      setInstallPrompt(deferredEvent)
      window.dispatchEvent(new CustomEvent("pwa-install-ready"))
    }

    // 5. Écoute de l'événement une fois l'installation terminée
    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null
      setInstallPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    const promptEvent = installPrompt || window.__deferredPwaPrompt
    if (!promptEvent) return

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === "accepted") {
      setInstallPrompt(null)
      window.__deferredPwaPrompt = null
      setIsStandalone(true)
    }
  }

  // Si l'app est déjà installée, ou si l'utilisateur a fermé la bannière, ou pas de prompt disponible
  if (isStandalone || isDismissed || !installPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-[#111622]/95 backdrop-blur-md border border-blue-500/30 text-white shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white truncate">
              Installer StockElec
            </div>
            <p className="text-[11px] text-slate-300 dark:text-slate-400 truncate">
              Plein écran &amp; mode hors-ligne chantier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Masquer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

