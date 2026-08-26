'use client'

import { useState } from 'react'
import { 
  FileText, Upload, Sparkles, AlertTriangle, Mail, CheckCircle2, 
  Download, Building2, ChevronRight, Play, BookOpen, ShieldCheck, 
  HelpCircle, ArrowRight, Check, Copy, ExternalLink, Calculator, BadgePercent
} from 'lucide-react'
import Link from 'next/link'

export function GuideClient() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      id: "import",
      title: "1. Déposer une Facture PDF (IA)",
      subtitle: "Lecture automatique en 3 secondes",
      icon: Upload,
      color: "bg-blue-600",
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Rendez-vous sur l'onglet <strong>Factures F.</strong> et glissez-déposez simplement votre facture PDF fournie par votre distributeur (Rexel, Sonepar, YESSS Electrique, Balitran, etc.).
          </p>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> Ce que l'intelligence artificielle extrait automatiquement :
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-300">
              <li><strong>Le Fournisseur & N° de facture</strong> (ex: <em>YESSS ELECTRIQUE - Facture 061-007-000233</em>)</li>
              <li><strong>Les montants financiers</strong> : Total Net HT, TVA, Total TTC, Date d'échéance et Mode de règlement</li>
              <li><strong>Toutes les lignes d'articles</strong> : Référence produit, Désignation, Quantité et Prix Unitaire Net facturé</li>
              <li><strong>Le Chantier imputé</strong> : Détecte les mentions de chantiers / références clients (ex: <em>SCI PELICAN, HARVEY, WELDOM</em>)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "analyse",
      title: "2. Contrôle & Détection des Hausses",
      subtitle: "Comparaison avec l'historique d'achat",
      icon: AlertTriangle,
      color: "bg-amber-600",
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Dès que vous cliquez sur <strong>« Enregistrer & Contrôler les Prix »</strong>, l'application compare chaque prix avec votre <strong>meilleur prix historique</strong> (tous distributeurs confondus).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4" /> Alerte Hausse Détectée
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Le prix facturé est supérieur à votre prix historique. Le système calcule l'écart unitaire et le surcoût global à réclamer.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="font-bold text-green-700 dark:text-green-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4" /> Prix Conforme ou en Baisse
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Le prix est identique ou avantageux. La référence est mise à jour pour vos prochains comparatifs.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "reclamation",
      title: "3. Demande d'Avoir en 1 Clic",
      subtitle: "E-mail prêt à envoyer au commercial",
      icon: Mail,
      color: "bg-red-600",
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Sur chaque ligne en hausse (ou globalement pour toute la facture), cliquez sur <strong>« Réclamer »</strong> ou <strong>« Avoir Global »</strong>.
          </p>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 space-y-2">
            <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">Exemple d'e-mail généré automatiquement :</div>
            <div className="font-mono text-xs p-3 rounded bg-white dark:bg-zinc-950 border dark:border-zinc-800 text-gray-700 dark:text-gray-300">
              <strong>Objet :</strong> Demande d'avoir - Facture 061-007-000233<br/><br/>
              Bonjour,<br/>
              Nous constatons une anomalie de prix sur la facture 061-007-000233.<br/>
              - Boîte de jonction Ajax (Réf: AJ-JUNCTIONBOX-B) x2 [Chantier: HARVEY]<br/>
              &nbsp;&nbsp;Ancien prix : 21.91 € ➔ Nouveau prix : 22.37 € (+0.92 € de surcoût)<br/><br/>
              Merci de bien vouloir vous aligner et nous établir un avoir de 0.92 €.<br/>
              Cordialement, La Comptabilité
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Vous avez 3 options d'envoi immédiates : <strong>Ouvrir dans Gmail</strong>, <strong>Copier le message</strong> ou <strong>Ouvrir votre logiciel de messagerie</strong>.
          </p>
        </div>
      )
    },
    {
      id: "suivi_compta",
      title: "4. Suivi des Avoirs & Export Comptable",
      subtitle: "Gains validés & conformité comptable",
      icon: Calculator,
      color: "bg-emerald-600",
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Suivez le cycle de vie de chaque réclamation et exportez toutes vos pièces pour votre cabinet comptable :
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border dark:border-zinc-800">
              <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                Statuts
              </span>
              <div className="text-xs">
                <strong>Changement de statut en direct</strong> : 
                Passez de <code>⏳ À réclamer</code> à <code>📤 E-mail envoyé</code> puis <code>✅ Avoir reçu</code> en indiquant le montant obtenu. Le compteur d'économies en haut de page s'incrémente instantanément !
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border dark:border-zinc-800">
              <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                Export Excel
              </span>
              <div className="text-xs">
                <strong>Export Comptable complet</strong> :
                Cliquez sur <em>« Export Comptable (Excel) »</em> pour obtenir le fichier contenant Date, Fournisseur, N° Facture, Échéance, Chantier imputé, Prix unitaire, Total Ligne HT, Taux TVA et Statuts d'avoirs.
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <BookOpen className="h-3.5 w-3.5" /> Guide & Tutoriel Pratique
            </div>
            <h1 className="text-3xl font-black tracking-tight">Comment fonctionne le Contrôle Factures & Prix ?</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Découvrez en 4 étapes simples comment numériser vos factures, récupérer vos avoirs et ventiler vos dépenses par chantier pour votre comptable.
            </p>
          </div>

          <Link
            href="/fournisseurs"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm"
          >
            Tester sur une Facture <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* TUTO INTERACTIF PAR ÉTAPES */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-600" /> Déroulé étape par étape
        </h2>

        {/* STEPPER BUTTONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isSelected = activeStep === idx
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-600/20' 
                    : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg text-white ${step.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Étape {idx + 1}</span>
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">{step.title.replace(/^\d+\.\s*/, '')}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">{step.subtitle}</div>
              </button>
            )
          })}
        </div>

        {/* ACTIVE STEP DETAILS */}
        <div className="border dark:border-zinc-800 rounded-2xl p-6 bg-gray-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl text-white ${steps[activeStep].color}`}>
              {(() => {
                const ActiveIcon = steps[activeStep].icon
                return <ActiveIcon className="h-6 w-6" />
              })()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{steps[activeStep].title}</h3>
              <p className="text-xs text-gray-500">{steps[activeStep].subtitle}</p>
            </div>
          </div>

          {steps[activeStep].content}

          <div className="mt-8 pt-4 border-t dark:border-zinc-800 flex justify-between">
            <button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:opacity-40"
            >
              &larr; Étape précédente
            </button>

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Étape suivante <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/fournisseurs"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Commencer sur l'application <Check className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* SECTION FAQ & QUESTIONS FRÉQUENTES */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600" /> Foire aux Questions (Comptable & Artisan)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 space-y-1.5">
            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Que faire si mon fournisseur utilise une référence différente ?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              L'application intègre un système d'<strong>Alias automatique</strong> : vous pouvez associer la référence du fournisseur (ex: <code>REX-123</code>) à votre référence interne. Vos prochains comparatifs seront reconnus automatiquement.
            </p>
          </div>

          <div className="p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 space-y-1.5">
            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Comment la comptable utilise-t-elle l'export Excel ?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              L'export Excel contient les montants HT, TVA, TTC, les dates d'échéances et la ventilation analytique par chantier. Il s'intègre directement dans les logiciels comme Pennylane, Sage, EBP ou Cegid.
            </p>
          </div>

          <div className="p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 space-y-1.5">
            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Mes factures et données sont-elles sécurisées ?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Oui, vos factures et historiques sont enregistrés dans votre base de données privée chiffrée. Seul le profil Gérant a accès aux données financières et aux prix.
            </p>
          </div>

          <div className="p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 space-y-1.5">
            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Puis-je modifier manuellement une ligne ou un chantier ?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Absolument. Chaque champ (Prix, Quantité, Chantier, Référence) est entièrement modifiable avant l'enregistrement ou ajustable dans le tableau.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
