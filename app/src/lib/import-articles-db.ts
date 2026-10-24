/**
 * Écriture en base de l'import Excel d'articles (côté serveur uniquement).
 *
 * Séparé de l'action serveur pour pouvoir être testé directement avec un PrismaClient
 * (voir scripts/test-import-articles.ts).
 */
import type { PrismaClient, Prisma } from "@prisma/client"
import { calculerStocksDepuisAgregats } from "./stockUtils"
import type { LigneImport } from "./import-articles"

export type ModeImport = "complet" | "creer_seulement" | "maj_seulement"

export type OptionsImport = {
  mode: ModeImport
  /** Aligne le stock dépôt des articles EXISTANTS sur la quantité du fichier (mouvement de correction) */
  majStockExistants: boolean
  fournisseurParDefaut?: string | null
  categorieParDefaut?: string | null
}

export type StatutLigne = "creation" | "mise_a_jour" | "inchange" | "ignore" | "erreur"

export type ResultatLigne = {
  ligneExcel: number
  reference: string
  designation: string
  statut: StatutLigne
  changements: string[]
  messages: string[]
}

export type StatsImport = Record<StatutLigne, number> & { correctionsStock: number }

export const TAILLE_LOT_MAX = 1000

// ---------------------------------------------------------------------------
// Validation des données reçues du navigateur (jamais de confiance aveugle)
// ---------------------------------------------------------------------------

function str(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s.slice(0, max)
}
function num(v: unknown, opts: { entier?: boolean; min?: number } = {}): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const r = opts.entier ? Math.round(n) : n
  if (opts.min !== undefined && r < opts.min) return null
  return r
}

export function sanitiserLigne(brut: any): LigneImport | null {
  if (!brut || typeof brut !== "object") return null
  const reference = str(brut.reference, 120)
  const designation = str(brut.designation, 500)
  if (!reference || !designation) return null
  return {
    ligneExcel: num(brut.ligneExcel, { entier: true, min: 1 }) ?? 0,
    reference,
    referenceGeneree: !!brut.referenceGeneree,
    designation,
    designationFournie: brut.designationFournie !== false,
    marque: str(brut.marque, 120),
    fournisseur: str(brut.fournisseur, 120),
    referenceFournisseur: str(brut.referenceFournisseur, 120),
    codeBarre: str(brut.codeBarre, 64),
    prixUnitaire: num(brut.prixUnitaire, { min: 0 }),
    stock: num(brut.stock, { entier: true, min: 0 }),
    stockMinimum: num(brut.stockMinimum, { entier: true, min: 0 }),
    categorie: str(brut.categorie, 80),
    unite: str(brut.unite, 20),
    emplacement: str(brut.emplacement, 60),
    quantiteParBoite: num(brut.quantiteParBoite, { entier: true, min: 1 }),
    avertissements: Array.isArray(brut.avertissements) ? brut.avertissements.slice(0, 20).map((a: unknown) => String(a).slice(0, 300)) : [],
  }
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

type ArticleExistant = {
  id: string
  reference: string
  designation: string
  categorie: string | null
  unite: string | null
  quantiteParBoite: number
  stockMinimum: number
  prixUnitaire: number | null
  codeBarre: string | null
  referenceFournisseur: string | null
  fournisseur: string | null
  marque: string | null
  emplacement: string | null
  stockInitial: number
}

const CHAMPS_MAJ = [
  ["designation", "Désignation"],
  ["marque", "Marque"],
  ["fournisseur", "Fournisseur"],
  ["referenceFournisseur", "Réf. fournisseur"],
  ["codeBarre", "Code-barres"],
  ["prixUnitaire", "Prix"],
  ["stockMinimum", "Seuil"],
  ["categorie", "Catégorie"],
  ["unite", "Unité"],
  ["emplacement", "Emplacement"],
  ["quantiteParBoite", "Conditionnement"],
] as const

/**
 * Importe un lot de lignes. En mode `dryRun`, rien n'est écrit : on renvoie
 * exactement ce qui SERAIT fait (prévisualisation fidèle, même code).
 */
export async function executerImport(
  prisma: PrismaClient,
  lignesBrutes: unknown[],
  options: OptionsImport,
  dryRun: boolean,
  utilisateur: string,
): Promise<{ resultats: ResultatLigne[]; stats: StatsImport }> {
  if (!Array.isArray(lignesBrutes)) throw new Error("Format de données invalide")
  if (lignesBrutes.length > TAILLE_LOT_MAX) throw new Error(`Lot trop volumineux (max ${TAILLE_LOT_MAX} lignes)`)
  const mode: ModeImport = ["complet", "creer_seulement", "maj_seulement"].includes(options.mode) ? options.mode : "complet"
  const fournisseurDefaut = str(options.fournisseurParDefaut, 120)
  const categorieDefaut = str(options.categorieParDefaut, 80)

  const resultats: ResultatLigne[] = []
  const stats: StatsImport = { creation: 0, mise_a_jour: 0, inchange: 0, ignore: 0, erreur: 0, correctionsStock: 0 }

  const lignes: LigneImport[] = []
  for (const brut of lignesBrutes) {
    const l = sanitiserLigne(brut)
    if (l) lignes.push(l)
    else {
      stats.erreur++
      resultats.push({
        ligneExcel: Number((brut as any)?.ligneExcel) || 0,
        reference: String((brut as any)?.reference ?? ""),
        designation: String((brut as any)?.designation ?? ""),
        statut: "erreur",
        changements: [],
        messages: ["Ligne invalide (référence ou désignation manquante)"],
      })
    }
  }

  // Catalogue existant : chargé une fois (quelques milliers d'articles max → acceptable)
  const existants: ArticleExistant[] = await prisma.article.findMany({
    select: {
      id: true, reference: true, designation: true, categorie: true, unite: true, quantiteParBoite: true,
      stockMinimum: true, prixUnitaire: true, codeBarre: true, referenceFournisseur: true, fournisseur: true,
      marque: true, emplacement: true, stockInitial: true,
    },
  })
  const parRef = new Map<string, ArticleExistant>()
  const parCode = new Map<string, ArticleExistant>()
  const parRefFourn = new Map<string, ArticleExistant | null>() // null = ambigu
  for (const a of existants) {
    parRef.set(a.reference.trim().toUpperCase(), a)
    if (a.codeBarre) parCode.set(a.codeBarre, a)
    if (a.referenceFournisseur) {
      const k = a.referenceFournisseur.trim().toUpperCase()
      parRefFourn.set(k, parRefFourn.has(k) ? null : a)
    }
  }

  // Codes-barres / références déjà attribués pendant CE lot (contraintes d'unicité)
  const codesPris = new Set<string>()
  const refsPrises = new Set<string>()

  type Operation =
    | { type: "create"; data: Prisma.ArticleCreateInput }
    | { type: "update"; id: string; data: Prisma.ArticleUpdateInput }
    | { type: "stock"; articleId: string; delta: number; ancien: number }
  const operations: Operation[] = []
  const stockARecalculer: { ligne: LigneImport; article: ArticleExistant; resultat: ResultatLigne }[] = []

  for (const l of lignes) {
    const res: ResultatLigne = {
      ligneExcel: l.ligneExcel,
      reference: l.reference,
      designation: l.designation,
      statut: "inchange",
      changements: [],
      messages: [...l.avertissements],
    }
    resultats.push(res)

    const refKey = l.reference.toUpperCase()
    if (refsPrises.has(refKey)) {
      res.statut = "erreur"
      res.messages.push("Référence en double dans le lot")
      stats.erreur++
      continue
    }

    let article = parRef.get(refKey)
    let correspondance = "référence"
    if (!article && l.codeBarre && parCode.has(l.codeBarre)) {
      article = parCode.get(l.codeBarre)
      correspondance = "code-barres"
    }
    if (!article && l.referenceFournisseur) {
      const a = parRefFourn.get(l.referenceFournisseur.toUpperCase())
      if (a) {
        article = a
        correspondance = "réf. fournisseur"
      }
    }

    // Code-barres appartenant à un AUTRE article → on ne l'affecte pas (contrainte unique)
    let codeBarre = l.codeBarre
    if (codeBarre) {
      const proprio = parCode.get(codeBarre)
      if ((proprio && proprio.id !== article?.id) || codesPris.has(codeBarre)) {
        res.messages.push(`Code-barres ${codeBarre} déjà attribué à « ${proprio?.reference ?? "une autre ligne"} » : ignoré`)
        codeBarre = null
      }
    }

    if (!article) {
      if (mode === "maj_seulement") {
        res.statut = "ignore"
        res.messages.push("Article inconnu (mode « mise à jour uniquement »)")
        stats.ignore++
        continue
      }
      const data: Prisma.ArticleCreateInput = {
        reference: l.reference,
        designation: l.designation,
        marque: l.marque,
        fournisseur: l.fournisseur ?? fournisseurDefaut,
        referenceFournisseur: l.referenceFournisseur,
        codeBarre,
        prixUnitaire: l.prixUnitaire ?? 0,
        stockInitial: l.stock ?? 0,
        stockMinimum: l.stockMinimum ?? 0,
        categorie: l.categorie ?? categorieDefaut ?? "À classer",
        unite: l.unite ?? "u",
        emplacement: l.emplacement,
        quantiteParBoite: l.quantiteParBoite ?? 1,
      }
      operations.push({ type: "create", data })
      res.statut = "creation"
      if (l.referenceGeneree) res.messages.push("Référence générée automatiquement (absente du fichier)")
      stats.creation++
      refsPrises.add(refKey)
      if (codeBarre) codesPris.add(codeBarre)
      continue
    }

    // Article existant
    refsPrises.add(article.reference.toUpperCase())
    if (correspondance !== "référence") res.messages.push(`Rapproché de « ${article.reference} » par ${correspondance}`)
    res.reference = article.reference

    if (mode === "creer_seulement") {
      res.statut = "ignore"
      res.messages.push("Article déjà existant (mode « création uniquement »)")
      stats.ignore++
      continue
    }

    const nouvelles: Record<string, unknown> = {
      designation: l.designationFournie ? l.designation : null,
      marque: l.marque,
      fournisseur: l.fournisseur,
      referenceFournisseur: l.referenceFournisseur,
      codeBarre,
      prixUnitaire: l.prixUnitaire,
      stockMinimum: l.stockMinimum,
      categorie: l.categorie,
      unite: l.unite,
      emplacement: l.emplacement,
      quantiteParBoite: l.quantiteParBoite,
    }
    const data: Record<string, unknown> = {}
    for (const [champ, label] of CHAMPS_MAJ) {
      const v = nouvelles[champ]
      // Règle : une cellule vide n'efface JAMAIS une donnée existante
      if (v === null || v === undefined) continue
      const actuel = (article as any)[champ]
      if (actuel !== v) {
        data[champ] = v
        res.changements.push(`${label} : ${actuel ?? "∅"} → ${v}`)
      }
    }
    if (codeBarre) codesPris.add(codeBarre)

    if (Object.keys(data).length > 0) {
      operations.push({ type: "update", id: article.id, data: data as Prisma.ArticleUpdateInput })
      res.statut = "mise_a_jour"
    }

    if (options.majStockExistants && l.stock !== null) {
      stockARecalculer.push({ ligne: l, article, resultat: res })
    }
  }

  // Alignement du stock des articles existants (mouvement de correction traçable)
  if (stockARecalculer.length > 0) {
    const aggs = await prisma.mouvement.groupBy({
      by: ["articleId", "type", "chantierId"],
      where: { articleId: { in: stockARecalculer.map((s) => s.article.id) } },
      _sum: { quantite: true },
    })
    const stockMap = calculerStocksDepuisAgregats(aggs)
    for (const { ligne, article, resultat } of stockARecalculer) {
      const actuel = article.stockInitial + (stockMap.get(article.id)?.stockDepot ?? 0)
      const delta = (ligne.stock ?? 0) - actuel
      if (delta === 0) continue
      operations.push({ type: "stock", articleId: article.id, delta, ancien: actuel })
      resultat.changements.push(`Stock dépôt : ${actuel} → ${ligne.stock}`)
      if (resultat.statut === "inchange") resultat.statut = "mise_a_jour"
      stats.correctionsStock++
    }
  }

  for (const r of resultats) {
    if (r.statut === "mise_a_jour") stats.mise_a_jour++
    if (r.statut === "inchange") stats.inchange++
  }

  if (!dryRun && operations.length > 0) {
    // Transaction « batch » : tout le lot passe ou rien (pas d'import à moitié fait)
    await prisma.$transaction(
      operations.map((op) => {
        if (op.type === "create") return prisma.article.create({ data: op.data })
        if (op.type === "update") return prisma.article.update({ where: { id: op.id }, data: op.data })
        return prisma.mouvement.create({
          data: {
            type: op.delta > 0 ? "Correction_Plus" : "Correction_Moins",
            quantite: Math.abs(op.delta),
            articleId: op.articleId,
            utilisateur,
            observation: `Import Excel (ancien stock : ${op.ancien})`,
          },
        })
      }),
    )
  }

  resultats.sort((a, b) => a.ligneExcel - b.ligneExcel)
  return { resultats, stats }
}
