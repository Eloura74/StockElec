"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sliders,
  Eye,
  Play,
  Check,
  ChevronRight,
  Download,
  Info,
  Layers,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import {
  CHAMPS_IMPORT,
  type ChampImport,
  type Mapping,
  type LigneImport,
  type LigneIgnoree,
  detecterLigneEntete,
  detecterMapping,
  construireLignes,
  dedoublonnerLignes,
} from "@/lib/import-articles"
import {
  importerLotArticles,
  finaliserImportArticles,
} from "@/app/actions/import-articles"
import type { OptionsImport, ResultatLigne, StatsImport } from "@/lib/import-articles-db"

type Etape = "upload" | "mapping" | "preview" | "importing" | "complete"

export function ImportArticlesClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Données du classeur
  const [fichier, setFichier] = useState<File | null>(null)
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [rawRows, setRawRows] = useState<unknown[][]>([])

  // Configuration du parsing
  const [ligneEntete, setLigneEntete] = useState<number>(0)
  const [mapping, setMapping] = useState<Mapping>({})

  // Options d'import
  const [mode, setMode] = useState<"complet" | "creer_seulement" | "maj_seulement">("complet")
  const [majStockExistants, setMajStockExistants] = useState<boolean>(true)
  const [fournisseurDefaut, setFournisseurDefaut] = useState<string>("")
  const [categorieDefaut, setCategorieDefaut] = useState<string>("")

  // Étape courante
  const [etape, setEtape] = useState<Etape>("upload")

  // Données analysées
  const [lignesPretes, setLignesPretes] = useState<LigneImport[]>([])
  const [lignesIgnorees, setLignesIgnorees] = useState<LigneIgnoree[]>([])

  // Résultats simulation / import réel
  const [simulationResultats, setSimulationResultats] = useState<ResultatLigne[]>([])
  const [statsFinales, setStatsFinales] = useState<StatsImport | null>(null)
  const [progression, setProgression] = useState<{ lotCourant: number; totalLots: number; pourcentage: number }>({
    lotCourant: 0,
    totalLots: 0,
    pourcentage: 0,
  })

  // Filtre pour la prévisualisation
  const [filtreStatut, setFiltreStatut] = useState<string>("tous")

  // Lecture du fichier Excel
  const handleFileChange = async (file: File) => {
    try {
      setFichier(file)
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { cellDates: true, raw: true })
      setWorkbook(wb)
      setSheetNames(wb.SheetNames)

      // Sélection de la première feuille ou de la feuille 'Articles' par défaut
      const defaultSheet = wb.SheetNames.includes("Articles") ? "Articles" : wb.SheetNames[0]
      setSelectedSheet(defaultSheet)
      chargerFeuille(wb, defaultSheet)
    } catch (err: any) {
      console.error(err)
      toast.error("Impossible de lire ce fichier Excel : " + (err?.message || "format invalide"))
    }
  }

  const chargerFeuille = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName]
    if (!ws) return
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]
    setRawRows(rows)

    // Détection automatique de l'en-tête et du mapping
    const headerRowIdx = detecterLigneEntete(rows)
    setLigneEntete(headerRowIdx)

    const headerCells = rows[headerRowIdx] || []
    const autoMap = detecterMapping(headerCells)
    setMapping(autoMap)

    setEtape("mapping")
    toast.success(`Fichier chargé (${rows.length} lignes trouvées)`)
  }

  // Changement d'onglet dans le classeur
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName)
    if (workbook) chargerFeuille(workbook, sheetName)
  }

  // Mise à jour manuelle d'un champ du mapping
  const handleMappingChange = (champ: ChampImport, colIdx: number | null) => {
    setMapping((prev) => {
      const next = { ...prev }
      if (colIdx === null || colIdx < 0) {
        delete next[champ]
      } else {
        next[champ] = colIdx
      }
      return next
    })
  }

  // Génération des lignes analysées et passage à l'étape prévisualisation
  const lancerAnalyse = () => {
    if (mapping.reference === undefined && mapping.designation === undefined) {
      toast.error("Veuillez sélectionner au moins une colonne pour la Référence ou la Désignation.")
      return
    }

    const { lignes, ignorees } = construireLignes(rawRows, ligneEntete, mapping)
    const dedoublonnees = dedoublonnerLignes(lignes)

    setLignesPretes(dedoublonnees)
    setLignesIgnorees(ignorees)
    setEtape("preview")
    setSimulationResultats([])
    setStatsFinales(null)
  }

  // Simulation en base (dry-run)
  const executerSimulation = () => {
    if (lignesPretes.length === 0) return

    startTransition(async () => {
      toast.loading("Simulation de l'importation en cours...", { id: "sim" })
      try {
        const options: OptionsImport = {
          mode,
          majStockExistants,
          fournisseurParDefaut: fournisseurDefaut || null,
          categorieParDefaut: categorieDefaut || null,
        }

        // On teste le premier lot (jusqu'à 500 articles) pour valider instantanément
        const lotTest = lignesPretes.slice(0, 500)
        const res = await importerLotArticles(lotTest, options, true)

        if (!res.success) {
          toast.error("Erreur lors de la simulation : " + res.error, { id: "sim" })
          return
        }

        setSimulationResultats(res.resultats)
        toast.success(`Simulation réussie sur ${res.resultats.length} articles !`, { id: "sim" })
      } catch (err: any) {
        toast.error("Erreur inattendue : " + err.message, { id: "sim" })
      }
    })
  }

  // Import réel en base par lots
  const executerImportReel = async () => {
    if (lignesPretes.length === 0) return

    setEtape("importing")
    const TAILLE_LOT = 500
    const totalLots = Math.ceil(lignesPretes.length / TAILLE_LOT)

    const statsGlobales: StatsImport = {
      creation: 0,
      mise_a_jour: 0,
      inchange: 0,
      ignore: 0,
      erreur: 0,
      correctionsStock: 0,
    }

    const options: OptionsImport = {
      mode,
      majStockExistants,
      fournisseurParDefaut: fournisseurDefaut || null,
      categorieParDefaut: categorieDefaut || null,
    }

    try {
      for (let i = 0; i < totalLots; i++) {
        const debut = i * TAILLE_LOT
        const fin = Math.min(debut + TAILLE_LOT, lignesPretes.length)
        const lot = lignesPretes.slice(debut, fin)

        setProgression({
          lotCourant: i + 1,
          totalLots,
          pourcentage: Math.round(((i + 1) / totalLots) * 100),
        })

        const res = await importerLotArticles(lot, options, false)
        if (!res.success) {
          throw new Error(`Erreur lors du lot ${i + 1} : ${res.error}`)
        }

        // Cumul des statistiques
        for (const k of Object.keys(statsGlobales) as (keyof StatsImport)[]) {
          statsGlobales[k] += res.stats[k]
        }
      }

      // Enregistrement de l'audit et revalidation
      await finaliserImportArticles(fichier?.name || "Fichier Excel", statsGlobales)
      setStatsFinales(statsGlobales)
      setEtape("complete")
      toast.success("Importation terminée avec succès !")
    } catch (err: any) {
      console.error(err)
      toast.error("L'import a été interrompu : " + err.message)
      setEtape("preview")
    }
  }

  // Télécharger un modèle Excel exemple
  const telechargerModele = () => {
    const wb = XLSX.utils.book_new()
    const exemples = [
      {
        "Référence": "DISJ-16A-HAG",
        "Désignation": "Disjoncteur 16A Phase+Neutre Courbe C",
        "Marque": "Hager",
        "Fournisseur": "Rexel",
        "Réf. Fournisseur": "MFS716",
        "Code-Barres EAN": "3250614314162",
        "Prix Unitaire HT": 6.85,
        "Stock Actuel": 24,
        "Seuil Alerte": 5,
        "Catégorie": "Matériaux",
        "Unité": "u",
        "Emplacement": "A1-03",
        "Qté par lot": 1,
      },
      {
        "Référence": "VIS-6X60",
        "Désignation": "Vis béton tête fraisée 6x60",
        "Marque": "Spit",
        "Fournisseur": "Sonepar",
        "Réf. Fournisseur": "057540",
        "Code-Barres EAN": "3439510575406",
        "Prix Unitaire HT": 12.50,
        "Stock Actuel": 8,
        "Seuil Alerte": 3,
        "Catégorie": "Consommable",
        "Unité": "boîte",
        "Emplacement": "B2-12",
        "Qté par lot": 100,
      },
    ]
    const ws = XLSX.utils.json_to_sheet(exemples)
    XLSX.utils.book_append_sheet(wb, ws, "Articles")
    XLSX.writeFile(wb, "modele_import_articles_stockpro.xlsx")
  }

  // Filtrage des lignes pour l'aperçu
  const lignesFiltrees = useMemo(() => {
    if (filtreStatut === "tous") return lignesPretes
    if (filtreStatut === "avec_avertissement") return lignesPretes.filter((l) => l.avertissements.length > 0)
    if (filtreStatut === "reference_generee") return lignesPretes.filter((l) => l.referenceGeneree)
    return lignesPretes
  }, [lignesPretes, filtreStatut])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* En-tête de navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/catalogue"
            className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 transition-colors"
            title="Retour au catalogue"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
                Importation Excel du Catalogue
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Importez vos fichiers de stock, tarifs fournisseurs ou listes de codes-barres en quelques clics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={telechargerModele}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Télécharger le modèle Excel vierge
        </button>
      </div>

      {/* Barre d'étapes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-medium">
        {[
          { id: "upload", label: "1. Fichier", done: etape !== "upload" },
          { id: "mapping", label: "2. Colonnes", done: ["preview", "importing", "complete"].includes(etape) },
          { id: "preview", label: "3. Validation", done: ["importing", "complete"].includes(etape) },
          { id: "complete", label: "4. Résultat", done: etape === "complete" },
        ].map((s) => (
          <div
            key={s.id}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
              etape === s.id
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold shadow-xs"
                : s.done
                ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                : "border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600"
            }`}
          >
            {s.done ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                •
              </span>
            )}
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ÉTAPE 1 : TÉLÉVERSEMENT */}
      {etape === "upload" && (
        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center bg-white dark:bg-zinc-900 hover:border-blue-500 transition-colors">
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileChange(f)
            }}
          />
          <label htmlFor="excel-file-input" className="cursor-pointer block space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                Glissez votre fichier Excel ici, ou <span className="text-blue-600 hover:underline">parcourez</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Formats acceptés : .xlsx, .xls, .csv — Vos fichiers de tarifs, inventaires et catalogues sont reconnus automatiquement.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* ÉTAPE 2 : MAPPING ET OPTIONS */}
      {etape === "mapping" && (
        <div className="space-y-6">
          {/* Fiche fichier & Sélecteur d'onglet */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">{fichier?.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {rawRows.length} lignes brutes détectées • En-têtes à la ligne {ligneEntete + 1}
                </p>
              </div>
            </div>

            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-300">Feuille :</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Configuration des colonnes */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  Correspondance des colonnes (Mapping)
                </h2>
              </div>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Les colonnes ont été associées automatiquement selon vos en-têtes
              </span>
            </div>

            <div className="p-5 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 text-left">
                    <th className="py-2 pr-4 font-semibold">Champ dans StockPro</th>
                    <th className="py-2 px-4 font-semibold">Colonne dans votre Excel</th>
                    <th className="py-2 pl-4 font-semibold">Exemple (Ligne 1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {CHAMPS_IMPORT.map(({ champ, label, aide }) => {
                    const colActuelle = mapping[champ]
                    const rowExemple = rawRows[ligneEntete + 1] || []
                    const exemple = colActuelle !== undefined ? String(rowExemple[colActuelle] ?? "—") : "—"

                    return (
                      <tr key={champ} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2.5 pr-4">
                          <span className="font-medium text-gray-900 dark:text-zinc-100">{label}</span>
                          {aide && <p className="text-[11px] text-gray-400 dark:text-zinc-500">{aide}</p>}
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={colActuelle !== undefined ? colActuelle : -1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              handleMappingChange(champ, val >= 0 ? val : null)
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs w-64 ${
                              colActuelle !== undefined
                                ? "border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 text-gray-900 dark:text-zinc-100 font-medium"
                                : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-500"
                            }`}
                          >
                            <option value={-1}>— Ne pas importer ce champ —</option>
                            {(rawRows[ligneEntete] || []).map((enteteCol, idx) => (
                              <option key={idx} value={idx}>
                                Col {idx + 1} : {String(enteteCol || `(Colonne sans titre ${idx + 1})`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 pl-4 text-gray-500 dark:text-zinc-400 font-mono text-[11px] truncate max-w-xs">
                          {exemple}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Options d'import */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Options d'importation</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: "complet",
                  title: "Complet (Recommandé)",
                  desc: "Crée les nouveaux articles et met à jour ceux déjà existants.",
                },
                {
                  id: "creer_seulement",
                  title: "Création uniquement",
                  desc: "Ajoute uniquement les nouveaux articles sans toucher à ceux existants.",
                },
                {
                  id: "maj_seulement",
                  title: "Mise à jour uniquement",
                  desc: "Met à jour prix/codes-barres des articles déjà en base (ignore les nouveaux).",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setMode(opt.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer block space-y-1 transition-all ${
                    mode === opt.id
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-gray-900 dark:text-zinc-100">{opt.title}</span>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={mode === opt.id}
                      onChange={() => setMode(opt.id as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">{opt.desc}</p>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={majStockExistants}
                  onChange={(e) => setMajStockExistants(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-medium text-gray-900 dark:text-zinc-100">
                    Ajuster le stock dépôt selon le fichier pour les articles existants
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    Si coché, génère un mouvement de correction traçable dans l'historique si le stock du fichier diffère de la base.
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Fournisseur par défaut (si vide dans l'Excel)
                  </label>
                  <input
                    type="text"
                    value={fournisseurDefaut}
                    onChange={(e) => setFournisseurDefaut(e.target.value)}
                    placeholder="Ex: Rexel, Sonepar..."
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-1.5 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Catégorie par défaut (si vide dans l'Excel)
                  </label>
                  <input
                    type="text"
                    value={categorieDefaut}
                    onChange={(e) => setCategorieDefaut(e.target.value)}
                    placeholder="Ex: Consommable, Matériaux..."
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-1.5 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setEtape("upload")}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Changer de fichier
              </button>
              <button
                type="button"
                onClick={lancerAnalyse}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                Valider les colonnes & Prévisualiser
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : PRÉVISUALISATION & SIMULATION */}
      {etape === "preview" && (
        <div className="space-y-6">
          {/* Statistiques préparatoires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Articles prêts à l'import</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{lignesPretes.length}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Réf. générées auto</span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {lignesPretes.filter((l) => l.referenceGeneree).length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Avertissements</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {lignesPretes.filter((l) => l.avertissements.length > 0).length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Lignes ignorées (vides)</span>
              <p className="text-2xl font-bold text-gray-400 dark:text-zinc-600 mt-1">{lignesIgnorees.length}</p>
            </div>
          </div>

          {/* Barre d'action simulation / validation */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-700 dark:text-zinc-300">
                Vous pouvez tester l'impact réel en base via le mode <span className="font-semibold">Simulation</span>{" "}
                sans modifier la base de données, ou lancer directement l'importation définitive.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={executerSimulation}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Eye className="w-4 h-4 text-gray-500" />
                Lancer la simulation
              </button>

              <button
                type="button"
                onClick={executerImportReel}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Play className="w-4 h-4" />
                Valider et importer en base
              </button>
            </div>
          </div>

          {/* Tableau de prévisualisation */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  Aperçu des articles ({lignesFiltrees.length})
                </h3>
              </div>

              {/* Filtre rapide */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">Filtrer :</span>
                {[
                  { id: "tous", label: "Tous" },
                  { id: "avec_avertissement", label: "Avertissements" },
                  { id: "reference_generee", label: "Réf. générées" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltreStatut(f.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filtreStatut === f.id
                        ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-125">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-xs">
                <thead className="bg-gray-50 dark:bg-zinc-950 sticky top-0 z-10">
                  <tr className="text-gray-500 dark:text-zinc-400 text-left">
                    <th className="py-2.5 px-3 font-semibold">Ligne</th>
                    <th className="py-2.5 px-3 font-semibold">Référence</th>
                    <th className="py-2.5 px-3 font-semibold">Désignation</th>
                    <th className="py-2.5 px-3 font-semibold">Marque / Fourn.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Prix HT</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Stock</th>
                    <th className="py-2.5 px-3 font-semibold">Code-barres</th>
                    <th className="py-2.5 px-3 font-semibold">Avertissements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-sans">
                  {lignesFiltrees.slice(0, 200).map((l, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{l.ligneExcel}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-zinc-100">{l.reference}</span>
                        {l.referenceGeneree && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-normal">
                            Auto
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-800 dark:text-zinc-200 max-w-sm truncate" title={l.designation}>
                        {l.designation}
                      </td>
                      <td className="py-2 px-3 text-gray-500 dark:text-zinc-400">
                        {[l.marque, l.fournisseur].filter(Boolean).join(" • ") || "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-zinc-100">
                        {l.prixUnitaire !== null ? `${l.prixUnitaire.toFixed(2)} €` : "—"}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {l.stock !== null ? `${l.stock} ${l.unite || "u"}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-gray-500 font-mono text-[11px]">{l.codeBarre || "—"}</td>
                      <td className="py-2 px-3">
                        {l.avertissements.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded"
                            title={l.avertissements.join(" | ")}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {l.avertissements.length} alerte(s)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lignesFiltrees.length > 200 && (
              <div className="p-3 border-t border-gray-100 dark:border-zinc-800 text-center text-xs text-gray-500 dark:text-zinc-400">
                Affichage des 200 premières lignes sur {lignesFiltrees.length} au total.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 4 : IMPORT EN COURS */}
      {etape === "importing" && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Importation en cours...</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Traitement du lot {progression.lotCourant} sur {progression.totalLots} ({progression.pourcentage}%)
            </p>
          </div>

          {/* Barre de progression */}
          <div className="w-full max-w-md mx-auto bg-gray-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progression.pourcentage}%` }}
            />
          </div>
        </div>
      )}

      {/* ÉTAPE 5 : TERMINÉ / RAPPORT */}
      {etape === "complete" && statsFinales && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Importation réussie !</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Votre catalogue a été mis à jour et synchronisé avec la base de données.
              </p>
            </div>
          </div>

          {/* Bilan chiffré */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Articles créés</span>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{statsFinales.creation}</p>
            </div>
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
              <span className="text-xs text-blue-700 dark:text-blue-400">Articles mis à jour</span>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{statsFinales.mise_a_jour}</p>
            </div>
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20">
              <span className="text-xs text-purple-700 dark:text-purple-400">Corrections de stock</span>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {statsFinales.correctionsStock}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Articles inchangés</span>
              <p className="text-2xl font-bold text-gray-700 dark:text-zinc-300 mt-1">{statsFinales.inchange}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setEtape("upload")
                setFichier(null)
                setRawRows([])
                setLignesPretes([])
                setStatsFinales(null)
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center"
            >
              Importer un autre fichier
            </button>

            <Link
              href="/catalogue"
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors w-full sm:w-auto"
            >
              Consulter le catalogue mis à jour
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
