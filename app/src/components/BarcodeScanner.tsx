'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Check, Minus, Plus, ShoppingBag } from 'lucide-react'

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
  const [flash, setFlash] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const continuousRef = useRef(continuous)
  const lastDecodedRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    continuousRef.current = continuous
  }, [continuous])

  useEffect(() => {
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
        // Double impulsion haptique nette sur mobile (vibre 40ms, pause 30ms, vibre 40ms)
        try {
          navigator.vibrate([40, 30, 40])
        } catch {
          // Ignore si non supporté
        }
      }
    }

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 30,
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
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
          },
          () => {
            // Erreurs de trame normales quand aucun code n'est visible
          }
        )
      } catch (err) {
        console.error("Erreur de démarrage du scanner", err)
        setError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.")
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error(err))
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[94dvh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/10">
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
            className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-full hover:bg-slate-200 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full bg-black flex items-center justify-center" style={{ minHeight: '280px' }}>
          {error ? (
            <div className="p-6 text-center text-red-500">
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div id="reader" className="w-full h-full"></div>
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
