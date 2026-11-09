"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, Volume2, Sparkles, X, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface VoiceAssistantButtonProps {
  onVoiceResult: (query: string, quantite: number) => void
  disabled?: boolean
  className?: string
}

const NOMBRES_FR: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  cent: 100,
}

export function VoiceAssistantButton({
  onVoiceResult,
  disabled = false,
  className = "",
}: VoiceAssistantButtonProps) {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [detectedQty, setDetectedQty] = useState(1)
  const [detectedQuery, setDetectedQuery] = useState("")
  const [supported, setSupported] = useState(true)
  const [permissionError, setPermissionError] = useState(false)

  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setSupported(false)
      }
    }
  }, [])

  // Analyse intelligente de la phrase dictée
  const analyserPhrase = useCallback((texte: string) => {
    if (!texte || !texte.trim()) return

    const tokens = texte.toLowerCase().split(/\s+/)
    let quantite = 1
    const motsRestants: string[] = []

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (/^\d+$/.test(t)) {
        quantite = parseInt(t, 10)
      } else if (NOMBRES_FR[t] !== undefined) {
        quantite = NOMBRES_FR[t]
      } else if (!["de", "du", "des", "le", "la", "les", "un", "une", "d'"].includes(t)) {
        motsRestants.push(t)
      }
    }

    const query = motsRestants.join(" ").trim()
    setDetectedQty(quantite > 0 ? quantite : 1)
    setDetectedQuery(query || texte)
  }, [])

  // Lancement de l'écoute synchrone sur geste utilisateur
  const demarrerEcoute = () => {
    setPermissionError(false)
    setTranscript("")

    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      toast.info("Speech API non disponible. Utilisez la saisie ou le micro de votre clavier.")
      inputRef.current?.focus()
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = "fr-FR"
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let currentText = ""
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + " "
        }
        const cleaned = currentText.trim()
        setTranscript(cleaned)
        analyserPhrase(cleaned)
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error)
        setIsListening(false)
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPermissionError(true)
          toast.error("Accès micro refusé. Autorisez le micro dans votre navigateur.")
        } else if (event.error !== "no-speech") {
          toast.error(`Erreur vocale : ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      // Appel direct et synchrone
      recognition.start()
    } catch (e) {
      console.error("SpeechRecognition start error:", e)
      setIsListening(false)
      toast.error("Impossible de lancer la reconnaissance vocale.")
    }
  }

  const arreterEcoute = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsListening(false)
  }

  const handleBoutonPrincipal = () => {
    if (disabled) return
    setIsOpenModal(true)
    // Démarrage synchrone au clic utilisateur pour respecter les exigences de sécurité mobile
    demarrerEcoute()
  }

  const validerAjout = () => {
    if (!detectedQuery.trim()) {
      toast.warning("Veuillez dicter ou saisir un nom de matériel.")
      return
    }

    onVoiceResult(detectedQuery.trim(), detectedQty)
    setIsOpenModal(false)
    arreterEcoute()
  }

  return (
    <>
      {/* Bouton Vocal dans la barre d'action */}
      <button
        type="button"
        onClick={handleBoutonPrincipal}
        disabled={disabled}
        title="Assistant vocal mains occupées : dicter un article et sa quantité"
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer tactile-btn ${
          isListening
            ? "bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/30 animate-pulse"
            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
        } ${className}`}
      >
        <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Vocal</span>
        <Sparkles className="w-3 h-3 text-amber-500" />
      </button>

      {/* Modale de Dictée Vocale Haute Définition */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                    isListening
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 animate-pulse"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60"
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Assistant Vocal Chantier
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dictez vos pièces (ex: « 3 disjoncteurs 16A »)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  arreterEcoute()
                  setIsOpenModal(false)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zone d'écoute animée */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-center space-y-3">
              <button
                type="button"
                onClick={isListening ? arreterEcoute : demarrerEcoute}
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white ring-8 ring-rose-500/20 animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/20"
                }`}
              >
                <Mic className="w-9 h-9" />
              </button>

              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isListening ? "🔴 Écoute en cours... parlez distinctement" : "Appuyez sur le micro pour parler"}
                </p>
                {transcript && (
                  <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-1 bg-white dark:bg-black/30 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                    « {transcript} »
                  </p>
                )}
              </div>
            </div>

            {/* Résultat détecté éditable */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matériel reconnu & Quantité
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={detectedQty}
                  onChange={(e) => setDetectedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 text-center text-sm font-bold p-3 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white"
                  title="Quantité"
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={detectedQuery}
                  onChange={(e) => setDetectedQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      validerAjout()
                    }
                  }}
                  placeholder="Ou tapez / utilisez le micro du clavier..."
                  className="flex-1 text-sm p-3 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Suggestions rapides */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Exemples :</span>
                {["3 Disjoncteur 16A", "5 Boîte Batibox", "1 R2V 3G2.5", "10 Wago 3"].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => analyserPhrase(ex)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {permissionError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Micro bloqué : vous pouvez aussi utiliser la touche micro de votre clavier mobile dans le champ texte ci-dessus.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  arreterEcoute()
                  setIsOpenModal(false)
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={validerAjout}
                disabled={!detectedQuery.trim()}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ajouter ({detectedQty})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
