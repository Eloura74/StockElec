"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceAssistantButtonProps {
  onVoiceResult: (query: string, quantite: number) => void;
  disabled?: boolean;
  className?: string;
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
};

export function VoiceAssistantButton({
  onVoiceResult,
  disabled = false,
  className = "",
}: VoiceAssistantButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    if (disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(
        "Reconnaissance vocale non supportée sur ce navigateur. Utilisez Chrome ou Safari.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        toast.info("🎤 Parlez maintenant (ex: « 3 disjoncteurs 16A »)", {
          duration: 3000,
        });
      };

      recognition.onresult = (event: any) => {
        const current = event.results[0][0].transcript;
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error(
            "Veuillez autoriser l'accès au microphone dans votre navigateur.",
          );
        } else if (event.error !== "no-speech") {
          toast.error(`Erreur vocale : ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  // Traitement automatique dès que l'écoute se termine avec du texte
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      traiterTexteVocal(transcript.trim());
      setTranscript("");
    }
  }, [isListening, transcript]);

  const traiterTexteVocal = (rawText: string) => {
    const tokens = rawText.toLowerCase().split(/\s+/);
    let quantite = 1;
    const motsRestants: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      // Détection numérique directe (ex: "3", "10")
      if (/^\d+$/.test(t)) {
        quantite = parseInt(t, 10);
      }
      // Détection mot écrit (ex: "cinq", "douze")
      else if (NOMBRES_FR[t] !== undefined) {
        quantite = NOMBRES_FR[t];
      }
      // Mots de liaison à filtrer
      else if (
        !["de", "du", "des", "le", "la", "les", "un", "une"].includes(t)
      ) {
        motsRestants.push(t);
      }
    }

    const searchQuery = motsRestants.join(" ").trim();
    if (!searchQuery) {
      toast.warning("Aucun nom d'article reconnu dans votre dictée.");
      return;
    }

    toast.success(`🗣️ Dicté : « ${quantite}x ${searchQuery} »`);
    onVoiceResult(searchQuery, quantite);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        title={
          isListening
            ? "Arrêter la dictée"
            : "Assistant vocal mains occupées : dicter un article et sa quantité"
        }
        className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-semibold text-xs transition-all active:scale-95 cursor-pointer tactile-btn ${
          isListening
            ? "bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/30 animate-pulse"
            : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08]"
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4 text-white animate-spin" />
            <span className="text-white text-[11px] font-bold">Écoute...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Vocal</span>
          </>
        )}
      </button>

      {/* Bulle de transcription en direct */}
      {isListening && transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none animate-in fade-in zoom-in-95">
          <div className="bg-slate-900/95 text-white backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-xs shadow-xl whitespace-nowrap flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-medium italic">« {transcript} »</span>
          </div>
        </div>
      )}
    </div>
  );
}
