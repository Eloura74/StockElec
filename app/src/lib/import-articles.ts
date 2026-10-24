/**
 * Logique PURE (sans base de données) de l'import Excel d'articles.
 *
 * Utilisée côté navigateur (prévisualisation instantanée) ET côté serveur
 * (re-validation avant écriture). Aucune dépendance à Prisma ou Next ici.
 *
 * Étapes :
 *  1. detecterLigneEntete()  : trouve la ligne d'en-têtes (souvent pas la 1ère ligne)
 *  2. detecterMapping()      : associe chaque colonne Excel à un champ Article
 *  3. construireLignes()     : normalise les valeurs (prix "12,50 €", EAN numériques…)
 *  4. dedoublonnerLignes()   : gère les références en double dans le fichier
 */

export type ChampImport =
  | "reference"
  | "designation"
  | "complementDesignation"
  | "marque"
  | "fournisseur"
  | "referenceFournisseur"
  | "codeBarre"
  | "prixUnitaire"
  | "stock"
  | "stockMinimum"
  | "categorie"
  | "unite"
  | "emplacement"
  | "quantiteParBoite"

export const CHAMPS_IMPORT: { champ: ChampImport; label: string; aide?: string }[] = [
  { champ: "reference", label: "Référence", aide: "Clé unique. Générée automatiquement si absente." },
  { champ: "designation", label: "Désignation", aide: "Obligatoire." },
  { champ: "complementDesignation", label: "Finition / couleur", aide: "Ajouté à la désignation." },
  { champ: "marque", label: "Marque / fabricant" },
  { champ: "fournisseur", label: "Fournisseur" },
  { champ: "referenceFournisseur", label: "Réf. fournisseur" },
  { champ: "codeBarre", label: "Code-barres (EAN)" },
  { champ: "prixUnitaire", label: "Prix unitaire (€)" },
  { champ: "stock", label: "Quantité en stock" },
  { champ: "stockMinimum", label: "Seuil d'alerte" },
  { champ: "categorie", label: "Catégorie" },
  { champ: "unite", label: "Unité" },
  { champ: "emplacement", label: "Emplacement" },
  { champ: "quantiteParBoite", label: "Qté par lot / conditionnement" },
]

/**
 * Synonymes d'en-têtes (déjà normalisés : minuscules, sans accents, sans ponctuation).
 * L'ordre compte : les synonymes les plus spécifiques en premier.
 */
const SYNONYMES: Record<ChampImport, string[]> = {
  referenceFournisseur: [
    "reference fournisseur", "ref fournisseur", "ref fourn", "reference fourn", "code fournisseur",
    "ref distributeur", "reference distributeur", "ref fab", "reference fabricant", "ref fabricant",
  ],
  codeBarre: ["code barre", "code barres", "codebarre", "ean13", "ean 13", "ean", "gtin", "qr", "code ean"],
  reference: ["reference article", "reference", "ref article", "ref interne", "code article", "ref", "article", "code"],
  designation: ["designation", "libelle", "description", "intitule", "nom article", "nom produit", "produit", "nom"],
  complementDesignation: ["finition couleur", "finition", "couleur", "coloris", "variante"],
  marque: ["fabriquant marque", "fabricant marque", "marque", "fabricant", "fabriquant", "constructeur"],
  fournisseur: ["fournisseur", "distributeur", "grossiste"],
  prixUnitaire: [
    "prix unitaire ht", "prix unitaire", "prix achat", "prix net", "prix ht", "tarif net", "tarif", "pu ht", "p u ht", "p u", "pu", "prix",
  ],
  stock: [
    "stock final", "stock actuel", "stock reel", "quantite en stock", "qte en stock", "quantite", "qte", "stock",
    "stock initial",
  ],
  stockMinimum: ["stock minimum", "stock mini", "seuil minimum", "seuil alerte", "seuil", "minimum", "stock min"],
  categorie: ["categorie", "fam libelle", "famille libelle", "famille", "sous famille", "type"],
  unite: ["unite", "unite de vente", "uv"],
  emplacement: ["emplacement", "localisation", "rayon", "casier", "allee", "rangement"],
  quantiteParBoite: ["quantite par boite", "qte par lot", "qte par boite", "conditionnement", "colisage", "lot"],
}

export type Mapping = Partial<Record<ChampImport, number>>

/**
 * Synonymes trop génériques : une correspondance exacte compte moins qu'un vrai synonyme.
 * Ex. : si « Stock initial » ET « Stock final » existent, c'est « Stock final » (stock actuel) qui est retenu.
 */
const SYNONYMES_FAIBLES = new Set(["stock initial", "article", "code", "type", "lot", "nom", "produit", "qr", "uv"])

export type LigneImport = {
  /** Numéro de ligne dans Excel (1-based) pour les messages d'erreur */
  ligneExcel: number
  reference: string
  referenceGeneree: boolean
  designation: string
  /** false si la désignation a été déduite de la référence (ne doit pas écraser l'existant) */
  designationFournie: boolean
  marque: string | null
  fournisseur: string | null
  referenceFournisseur: string | null
  codeBarre: string | null
  prixUnitaire: number | null
  stock: number | null
  stockMinimum: number | null
  categorie: string | null
  unite: string | null
  emplacement: string | null
  quantiteParBoite: number | null
  avertissements: string[]
}

export type LigneIgnoree = { ligneExcel: number; raison: string }

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

export function normaliserTexte(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function texte(v: unknown): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") {
    // Évite "1.2e+12" pour les grands nombres entiers (références numériques)
    return Number.isInteger(v) ? v.toFixed(0) : String(v)
  }
  const s = String(v).replace(/\s+/g, " ").trim()
  return s === "" ? null : s
}

/** Convertit "12,50 €", "1 234.5", 12.5 → nombre. Retourne null si non numérique. */
export function parseNombre(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  let s = String(v).replace(/[€$\s\u00a0]/g, "").replace(/(ht|ttc|eur)$/i, "")
  if (s === "" || s === "-") return null
  // "1.234,56" → "1234.56" ; "1,234.56" → "1234.56" ; "12,5" → "12.5"
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  } else {
    s = s.replace(",", ".")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Nettoie un code-barres : chiffres uniquement si c'est un EAN/UPC, sinon texte brut. */
export function normaliserCodeBarre(v: unknown): string | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v).toFixed(0) : null
  const s = texte(v)
  if (!s) return null
  const chiffres = s.replace(/[\s.-]/g, "")
  if (/^\d+$/.test(chiffres)) return chiffres
  // Notation scientifique issue d'Excel ("3.24506E+12") : non récupérable de façon fiable
  if (/^\d+([.,]\d+)?e\+\d+$/i.test(s)) return null
  return s
}

/** Vérifie la clé de contrôle d'un EAN-8 / UPC-A / EAN-13 / GTIN-14. */
export function eanValide(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false
  const chiffres = code.split("").map(Number)
  const cle = chiffres.pop()!
  const somme = chiffres
    .reverse()
    .reduce((acc, c, i) => acc + c * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (somme % 10)) % 10 === cle
}

function slug(s: string, max = 60): string {
  return normaliserTexte(s).toUpperCase().replace(/ /g, "-").slice(0, max).replace(/-+$/, "")
}

/** Hash court et déterministe (FNV-1a) pour garder des références stables entre deux imports. */
function hashCourt(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(-5)
}

/** Référence auto stable : MARQUE-DESIGNATION + hash (même ligne réimportée = même référence). */
export function genererReference(base: string): string {
  const s = slug(base, 40) || "ARTICLE"
  return `${s}-${hashCourt(normaliserTexte(base))}`
}

// ---------------------------------------------------------------------------
// Détection des en-têtes et du mapping
// ---------------------------------------------------------------------------

function scoreEntete(entete: string, champ: ChampImport): number {
  const h = normaliserTexte(entete)
  if (!h) return 0
  let best = 0
  SYNONYMES[champ].forEach((syn, idx) => {
    const bonusOrdre = (SYNONYMES[champ].length - idx) / 100 // départage les synonymes
    let s = 0
    if (h === syn) s = SYNONYMES_FAIBLES.has(syn) ? 55 : 100 // exact : pas de bonus, la colonne la plus à gauche départage
    else if (h.startsWith(syn + " ") || h.endsWith(" " + syn)) s = 60 + syn.length / 10 + bonusOrdre
    else if (` ${h} `.includes(` ${syn} `)) s = 30 + syn.length / 10 + bonusOrdre
    if (s > 0) best = Math.max(best, s)
  })
  return best
}

/** Cherche la ligne d'en-têtes dans les 30 premières lignes (celle qui reconnaît le plus de champs). */
export function detecterLigneEntete(lignes: unknown[][]): number {
  let meilleure = 0
  let meilleurScore = -1
  for (let i = 0; i < Math.min(30, lignes.length); i++) {
    const row = lignes[i] || []
    const champs = new Set<ChampImport>()
    for (const cell of row) {
      if (typeof cell !== "string") continue
      for (const { champ } of CHAMPS_IMPORT) {
        if (scoreEntete(cell, champ) >= 60) champs.add(champ)
      }
    }
    if (champs.size > meilleurScore) {
      meilleurScore = champs.size
      meilleure = i
    }
  }
  return meilleure
}

/** Associe automatiquement les colonnes aux champs (une colonne = un champ, meilleur score d'abord). */
export function detecterMapping(entetes: unknown[]): Mapping {
  const candidats: { champ: ChampImport; col: number; score: number }[] = []
  entetes.forEach((h, col) => {
    if (h === null || h === undefined || h === "") return
    for (const { champ } of CHAMPS_IMPORT) {
      const score = scoreEntete(String(h), champ)
      if (score > 0) candidats.push({ champ, col, score: score - col / 1000 }) // à score égal : colonne la plus à gauche
    }
  })
  candidats.sort((a, b) => b.score - a.score)
  const mapping: Mapping = {}
  const colsPrises = new Set<number>()
  for (const c of candidats) {
    if (mapping[c.champ] !== undefined || colsPrises.has(c.col)) continue
    mapping[c.champ] = c.col
    colsPrises.add(c.col)
  }
  return mapping
}

// ---------------------------------------------------------------------------
// Construction des lignes
// ---------------------------------------------------------------------------

export function construireLignes(
  lignes: unknown[][],
  ligneEntete: number,
  mapping: Mapping,
): { lignes: LigneImport[]; ignorees: LigneIgnoree[] } {
  const res: LigneImport[] = []
  const ignorees: LigneIgnoree[] = []
  const get = (row: unknown[], champ: ChampImport) => {
    const col = mapping[champ]
    return col === undefined ? null : row[col] ?? null
  }

  for (let i = ligneEntete + 1; i < lignes.length; i++) {
    const row = lignes[i] || []
    const ligneExcel = i + 1
    const avertissements: string[] = []

    const desBase = texte(get(row, "designation"))
    const complement = texte(get(row, "complementDesignation"))
    let reference = texte(get(row, "reference"))

    if (!desBase && !reference) {
      // Ligne vide ou résiduelle (ex. emplacement seul, total) : ignorée silencieusement.
      // On ne signale que les lignes portant une vraie info produit sans désignation ni référence.
      const infoProduit = (["marque", "codeBarre", "referenceFournisseur", "prixUnitaire"] as ChampImport[]).some((c) => {
        const v = get(row, c)
        return v !== null && String(v).trim() !== ""
      })
      if (infoProduit) ignorees.push({ ligneExcel, raison: "Pas de désignation ni de référence" })
      continue
    }
    if (!desBase) avertissements.push("Désignation absente : la référence est utilisée comme désignation")

    const designation = [desBase || reference, complement].filter(Boolean).join(" - ")
    const marque = texte(get(row, "marque"))

    let referenceGeneree = false
    if (!reference) {
      reference = genererReference([marque, designation].filter(Boolean).join(" "))
      referenceGeneree = true
    }

    let codeBarre = normaliserCodeBarre(get(row, "codeBarre"))
    const codeBrut = get(row, "codeBarre")
    if (codeBrut !== null && codeBrut !== "" && !codeBarre) {
      avertissements.push("Code-barres illisible (format scientifique Excel ?) : ignoré")
    }
    if (codeBarre && /^\d+$/.test(codeBarre) && [8, 12, 13, 14].includes(codeBarre.length) && !eanValide(codeBarre)) {
      avertissements.push(`Clé de contrôle EAN invalide (${codeBarre})`)
    }
    if (codeBarre && codeBarre.length > 64) codeBarre = codeBarre.slice(0, 64)

    const prixBrut = get(row, "prixUnitaire")
    let prixUnitaire = parseNombre(prixBrut)
    if (prixBrut !== null && prixBrut !== "" && prixUnitaire === null) avertissements.push(`Prix non numérique « ${prixBrut} »`)
    if (prixUnitaire !== null && prixUnitaire < 0) {
      avertissements.push("Prix négatif ignoré")
      prixUnitaire = null
    }
    if (prixUnitaire !== null) prixUnitaire = Math.round(prixUnitaire * 10000) / 10000

    const entier = (champ: ChampImport, label: string): number | null => {
      const brut = get(row, champ)
      const n = parseNombre(brut)
      if (brut !== null && brut !== "" && n === null) {
        avertissements.push(`${label} non numérique « ${brut} »`)
        return null
      }
      if (n === null) return null
      if (!Number.isInteger(n)) avertissements.push(`${label} décimal arrondi (${n} → ${Math.round(n)})`)
      return Math.round(n)
    }

    let stock = entier("stock", "Stock")
    if (stock !== null && stock < 0) {
      avertissements.push(`Stock négatif (${stock}) ramené à 0`)
      stock = 0
    }
    const stockMinimum = entier("stockMinimum", "Seuil")
    let quantiteParBoite = entier("quantiteParBoite", "Conditionnement")
    if (quantiteParBoite !== null && quantiteParBoite < 1) quantiteParBoite = null

    res.push({
      ligneExcel,
      reference: reference.slice(0, 120),
      referenceGeneree,
      designation: designation.slice(0, 500),
      designationFournie: !!desBase,
      marque,
      fournisseur: texte(get(row, "fournisseur")),
      referenceFournisseur: texte(get(row, "referenceFournisseur")),
      codeBarre,
      prixUnitaire,
      stock,
      stockMinimum: stockMinimum !== null ? Math.max(0, stockMinimum) : null,
      categorie: texte(get(row, "categorie")),
      unite: texte(get(row, "unite")),
      emplacement: texte(get(row, "emplacement")),
      quantiteParBoite,
      avertissements,
    })
  }
  return { lignes: res, ignorees }
}

/**
 * Gère les références en double DANS le fichier :
 *  - même référence + même désignation  → fusion (stocks additionnés, dernières infos non vides gardées)
 *  - même référence + désignation différente → articles distincts, référence suffixée de façon stable
 *    (cas réel : un n° de commande Meljac utilisé comme « référence » pour 12 produits différents)
 * Les codes-barres en double sont retirés des lignes suivantes (contrainte d'unicité en base).
 */
export function dedoublonnerLignes(lignes: LigneImport[]): LigneImport[] {
  const parRef = new Map<string, LigneImport[]>()
  for (const l of lignes) {
    const k = l.reference.trim().toUpperCase()
    if (!parRef.has(k)) parRef.set(k, [])
    parRef.get(k)!.push(l)
  }

  const resultat: LigneImport[] = []
  for (const groupe of parRef.values()) {
    if (groupe.length === 1) {
      resultat.push(groupe[0])
      continue
    }
    // Sous-groupes par désignation normalisée
    const parDes = new Map<string, LigneImport[]>()
    for (const l of groupe) {
      const k = normaliserTexte(l.designation)
      if (!parDes.has(k)) parDes.set(k, [])
      parDes.get(k)!.push(l)
    }
    const variantes = parDes.size > 1
    for (const sous of parDes.values()) {
      const base = sous[0]
      const fusion: LigneImport = { ...base, avertissements: [...base.avertissements] }
      for (const autre of sous.slice(1)) {
        fusion.stock = fusion.stock === null && autre.stock === null ? null : (fusion.stock ?? 0) + (autre.stock ?? 0)
        for (const champ of [
          "marque", "fournisseur", "referenceFournisseur", "codeBarre", "prixUnitaire", "stockMinimum",
          "categorie", "unite", "emplacement", "quantiteParBoite",
        ] as const) {
          if (autre[champ] !== null) (fusion as any)[champ] = autre[champ]
        }
        fusion.avertissements.push(`Fusionnée avec la ligne ${autre.ligneExcel} (même référence et désignation, stocks additionnés)`)
      }
      if (variantes) {
        const refOrigine = base.reference
        fusion.reference = `${refOrigine}-${slug(base.designation, 30) || hashCourt(base.designation)}`.slice(0, 120)
        fusion.avertissements.push(
          `Référence « ${refOrigine} » partagée par plusieurs produits différents : renommée « ${fusion.reference} »`,
        )
      }
      resultat.push(fusion)
    }
  }

  // Sécurité : après suffixage, une collision reste théoriquement possible
  const vues = new Set<string>()
  for (const l of resultat) {
    let k = l.reference.toUpperCase()
    if (vues.has(k)) {
      l.reference = `${l.reference}-${hashCourt(String(l.ligneExcel))}`
      l.avertissements.push(`Référence dupliquée, renommée « ${l.reference} »`)
      k = l.reference.toUpperCase()
    }
    vues.add(k)
  }

  const codes = new Map<string, number>()
  for (const l of resultat) {
    if (!l.codeBarre) continue
    const premiere = codes.get(l.codeBarre)
    if (premiere !== undefined) {
      l.avertissements.push(`Code-barres ${l.codeBarre} déjà utilisé ligne ${premiere} : ignoré pour cette ligne`)
      l.codeBarre = null
    } else {
      codes.set(l.codeBarre, l.ligneExcel)
    }
  }

  return resultat.sort((a, b) => a.ligneExcel - b.ligneExcel)
}
