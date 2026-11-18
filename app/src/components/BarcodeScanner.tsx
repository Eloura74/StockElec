'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Check, Minus, Plus, ShoppingBag, Camera, RefreshCw, KeyRound, Laptop } from 'lucide-react'

export type BurstScanSummary = {
  lastLabel?: string
  lastQty?: number
  totalLines: number
  totalUnits: number
  onIncrementLast?: () => void
  onDecrementLast?: () => void
}

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
  /** Si true, la caméra reste ouverte après chaque bip (mode rafale) avec anti-rebond de 1,4 s sur un même code. */
  continuous?: boolean
  /** Bandeau récapitulatif affiché en bas de la caméra en mode rafale. */
  burstSummary?: BurstScanSummary
}

export function BarcodeScanner({ onScan, onClose, continuous = false, burstSummary }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [errorReason, setErrorReason] = useState<'PERMISSION' | 'NOT_FOUND' | 'BUSY' | 'GENERIC' | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [flash, setFlash] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const continuousRef = useRef(continuous)
  const lastDecodedRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })
  const isStartingRef = useRef(false)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    continuousRef.current = continuous
  }, [continuous])

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.type = 'sine'
      // Double bip court pro électricien (880Hz puis 1320Hz)
      oscillator.frequency.setValueAtTime(920, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.08)
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) {
      console.warn("AudioContext not supported", e)
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 40])
      } catch {}
    }
  }

  const handleDecoded = (decodedText: string) => {
    if (!scannerRef.current?.isScanning) return

    const now = Date.now()
    if (
      continuousRef.current &&
      lastDecodedRef.current.code === decodedText &&
      now - lastDecodedRef.current.at < 1400
    ) {
      return
    }
    lastDecodedRef.current = { code: decodedText, at: now }

    playBeep()

    if (continuousRef.current) {
      setFlash(true)
      setTimeout(() => setFlash(false), 260)
      onScanRef.current(decodedText)
    } else {
      scannerRef.current.stop().then(() => {
        onScanRef.current(decodedText)
      }).catch(err => console.error(err))
    }
  }

  const launchCamera = async () => {
    if (isStartingRef.current) return
    isStartingRef.current = true
    setError(null)
    setErrorReason(null)

    try {
      // 1. Demande de permission native explicite via getUserMedia (déclenche la pop-up système)
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
          })
          testStream.getTracks().forEach((t) => t.stop())
        } catch (permErr: unknown) {
          const pObj = permErr as { name?: string }
          if (pObj?.name === "NotAllowedError" || pObj?.name === "PermissionDeniedError") {
            throw permErr
          }
          // Si caméra arrière indisponible (ex: PC sans caméra arrière), tester n'importe quelle caméra
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true })
            fallbackStream.getTracks().forEach((t) => t.stop())
          } catch (fallbackErr) {
            throw fallbackErr
          }
        }
      }

      // 2. Nettoyer toute instance précédente si existante
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop()
          }
          scannerRef.current.clear()
        } catch {}
      }

      // 3. Créer une nouvelle instance saine
      const html5QrCode = new Html5Qrcode("reader", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      })
      scannerRef.current = html5QrCode

      const scanConfig = {
        fps: 20,
        disableFlip: false
      }

      // 4. Démarrer avec la caméra arrière (syntaxe stricte 'environment' string)
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          scanConfig,
          handleDecoded,
          () => {}
        )
      } catch (envErr) {
        console.warn("[BarcodeScanner] Caméra arrière non disponible, essai caméra standard...", envErr)
        try {
          await html5QrCode.start(
            { facingMode: "user" },
            scanConfig,
            handleDecoded,
            () => {}
          )
        } catch (userErr) {
          const cameras = await Html5Qrcode.getCameras().catch(() => [])
          if (cameras.length > 0) {
            await html5QrCode.start(
              cameras[0].id,
              scanConfig,
              handleDecoded,
              () => {}
            )
          } else {
            throw userErr
          }
        }
      }
    } catch (err: unknown) {
      console.error("[BarcodeScanner] Erreur globale caméra :", err)
      const errorObj = err as { name?: string; message?: string }
      const name = errorObj?.name || ""
      const msg = String(errorObj?.message || err || "")

      if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("Permission") || msg.includes("denied")) {
        setErrorReason("PERMISSION")
        setError("L'accès à l'appareil photo a été refusé ou bloqué.")
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.includes("not found") || msg.includes("Requested device")) {
        setErrorReason("NOT_FOUND")
        setError("Aucune caméra détectée sur cet appareil (ex: ordinateur sans webcam).")
      } else if (name === "NotReadableError" || msg.includes("busy") || msg.includes("in use") || msg.includes("Could not start")) {
        setErrorReason("BUSY")
        setError("L'appareil photo est actuellement occupé par une autre application.")
      } else {
        setErrorReason("GENERIC")
        setError("Impossible d'initialiser l'appareil photo.")
      }
    } finally {
      isStartingRef.current = false
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    // Petit délai de 100ms pour garantir que le DOM <div id="reader" /> est monté et a des dimensions
    const timer = setTimeout(() => {
      launchCamera()
    }, 120)

    return () => {
      clearTimeout(timer)
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear()
            }).catch(() => {})
          } else {
            scannerRef.current.clear()
          }
        } catch {}
      }
    }
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualCode.trim()
    if (!trimmed) return
    onScanRef.current(trimmed)
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    setError(null)
    setErrorReason(null)
    // Léger délai pour s'assurer que #reader est réaffiché dans le DOM par React
    setTimeout(() => {
      launchCamera()
    }, 60)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[94dvh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-zinc-50 truncate">
              {continuous ? "Scan en rafale" : "Scanner un article"}
            </h3>
            {continuous && (
              <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                Continu
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le scanner"
            className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-full hover:bg-slate-200 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full bg-slate-950 flex flex-col items-center justify-center min-h-[320px] overflow-hidden">
          {/* Le conteneur #reader reste TOUJOURS dans le DOM pour que l'API html5-qrcode ne perde jamais sa référence parente */}
          <div
            id="reader"
            className={`w-full min-h-[320px] ${error ? "hidden" : "block"}`}
          />

          {/* Affichage d'erreur et saisie de secours en overlay */}
          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 sm:p-6 text-center space-y-4 bg-slate-950/95 animate-in fade-in duration-200 overflow-y-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-sm shrink-0">
                <Camera className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                  {error}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {errorReason === "NOT_FOUND" ? (
                    "Aucun capteur vidéo détecté sur cet appareil. Utilisez la saisie manuelle ci-dessous."
                  ) : errorReason === "PERMISSION" ? (
                    "Autorisez la caméra via l'icône de cadenas/réglages de l'adresse web ou dans Réglages > Safari sur iPhone."
                  ) : (
                    "Vérifiez que la caméra n'est pas utilisée par une autre application."
                  )}
                </p>
              </div>

              {/* Bouton de réessai avec geste utilisateur direct */}
              <div className="pt-1 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  <span>{isRetrying ? "Activation en cours..." : "Demander l'accès à la caméra"}</span>
                </button>
              </div>

              {/* Saisie manuelle de secours immédiate */}
              <div className="pt-3 border-t border-white/10 w-full max-w-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Ou saisie directe du code :
                </span>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: CM0031 ou 324506..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white placeholder:text-slate-500 text-xs font-mono focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    Valider
                  </button>
                </form>
              </div>
            </div>
          )}

          {flash && (
            <div className="pointer-events-none absolute inset-0 ring-4 ring-inset ring-emerald-400 bg-emerald-400/15 transition-opacity" />
          )}
        </div>

        {/* Bandeau rafale ou instruction */}
        {continuous && burstSummary ? (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-white/10 space-y-3">
            {burstSummary.lastLabel ? (
              <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Dernier article bipé
                  </div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {burstSummary.lastLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {burstSummary.onDecrementLast && (
                    <button
                      type="button"
                      onClick={burstSummary.onDecrementLast}
                      aria-label="Retirer 1 du dernier article"
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 ring-1 ring-slate-200 dark:ring-white/10 active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                  <span className="min-w-9 text-center font-black text-lg text-emerald-700 dark:text-emerald-300">
                    ×{burstSummary.lastQty ?? 1}
                  </span>
                  {burstSummary.onIncrementLast && (
                    <button
                      type="button"
                      onClick={burstSummary.onIncrementLast}
                      aria-label="Ajouter 1 au dernier article"
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 ring-1 ring-slate-200 dark:ring-white/10 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs font-medium text-slate-500 dark:text-zinc-400 py-1">
                Scannez les articles les uns après les autres : ils s&apos;ajoutent automatiquement.
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              <span>
                Terminer ({burstSummary.totalLines} réf. · {burstSummary.totalUnits} u.)
              </span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 text-center text-sm text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4 shrink-0 opacity-60" />
            <span>Placez le code-barres au centre de la zone de détection.</span>
          </div>
        )}
      </div>
    </div>
  )
}
