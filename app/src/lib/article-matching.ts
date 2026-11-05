/**
 * Moteur centralisé de rapprochement et d'indexation des articles (anti-doublon).
 *
 * Garantit que :
 *  - un import de facture PDF (/fournisseurs ou relève IMAP),
 *  - un import Excel de catalogue (/catalogue/import),
 *  - un scan code-barres ou une saisie manuelle (gérant / chef d'équipe)
 * reconnaissent toujours le MÊME article sans jamais créer de doublon,
 * quel que soit l'ordre dans lequel ces opérations ont lieu.
 */

export type ArticleMinimal = {
  id: string
  reference: string
  designation: string
  codeBarre: string | null
  referenceFournisseur: string | null
  fournisseur: string | null
  prixUnitaire?: number | null
}

/**
 * Normalise une clé de référence ou code fournisseur pour comparaison tolérante :
 * majuscules, sans accents, sans espaces ni ponctuation parasite (ex: "leg 0697 31" === "LEG-069731").
 */
export function cleReference(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return ""
  return String(valeur)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
}

export function normaliserTexteDesignation(valeur: unknown): string {
  return String(valeur ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export type IndexCatalogue<T extends ArticleMinimal = ArticleMinimal> = {
  /** Rapprochement exact (trim + uppercase) sur Article.reference */
  parRefExacte: Map<string, T>
  /** Rapprochement tolérant (sans tirets/espaces) sur Article.reference */
  parRefNormalisee: Map<string, T>
  /** Rapprochement sur Article.codeBarre */
  parCodeBarre: Map<string, T>
  /** Rapprochement sur Article.referenceFournisseur (null = ambigu si plusieurs articles partagent ce code) */
  parRefFournisseur: Map<string, T | null>
  /** Rapprochement par (fournisseur normalisé + référence fournisseur normalisée) */
  parCoupleFournisseurRef: Map<string, T>
  /** Alias enregistrés : clé = `${cleReference(fournisseur)}:${cleReference(alias)}` ou `*:${cleReference(alias)}` */
  aliasVersRefCanonique: Map<string, string>
}

export function construireIndexCatalogue<T extends ArticleMinimal>(
  articles: T[],
  aliases: { fournisseur: string; aliasFournisseur: string; referenceCanonique: string }[] = [],
): IndexCatalogue<T> {
  const parRefExacte = new Map<string, T>()
  const parRefNormalisee = new Map<string, T>()
  const parCodeBarre = new Map<string, T>()
  const parRefFournisseur = new Map<string, T | null>()
  const parCoupleFournisseurRef = new Map<string, T>()
  const aliasVersRefCanonique = new Map<string, string>()

  for (const al of aliases) {
    const kAlias = cleReference(al.aliasFournisseur)
    if (!kAlias) continue
    const kFourn = cleReference(al.fournisseur)
    if (kFourn) {
      aliasVersRefCanonique.set(`${kFourn}:${kAlias}`, al.referenceCanonique.trim())
    }
    if (!aliasVersRefCanonique.has(`*:${kAlias}`)) {
      aliasVersRefCanonique.set(`*:${kAlias}`, al.referenceCanonique.trim())
    }
  }

  for (const a of articles) {
    indexerArticleDansCatalogue(
      { parRefExacte, parRefNormalisee, parCodeBarre, parRefFournisseur, parCoupleFournisseurRef, aliasVersRefCanonique },
      a,
    )
  }

  return {
    parRefExacte,
    parRefNormalisee,
    parCodeBarre,
    parRefFournisseur,
    parCoupleFournisseurRef,
    aliasVersRefCanonique,
  }
}

export function indexerArticleDansCatalogue<T extends ArticleMinimal>(
  index: IndexCatalogue<T>,
  article: T,
): void {
  const refUpper = article.reference.trim().toUpperCase()
  index.parRefExacte.set(refUpper, article)

  const refNorm = cleReference(article.reference)
  if (refNorm && !index.parRefNormalisee.has(refNorm)) {
    index.parRefNormalisee.set(refNorm, article)
  }

  if (article.codeBarre) {
    const cb = article.codeBarre.trim()
    if (cb) index.parCodeBarre.set(cb, article)
  }

  if (article.referenceFournisseur) {
    const rfNorm = cleReference(article.referenceFournisseur)
    if (rfNorm) {
      const deja = index.parRefFournisseur.get(rfNorm)
      index.parRefFournisseur.set(rfNorm, deja !== undefined && deja?.id !== article.id ? null : article)
      const fNorm = cleReference(article.fournisseur)
      if (fNorm) {
        index.parCoupleFournisseurRef.set(`${fNorm}:${rfNorm}`, article)
      }
    }
  }
}

export type CritereRapprochement = {
  reference?: string | null
  referenceFournisseur?: string | null
  codeBarre?: string | null
  fournisseur?: string | null
}

export type ResultatRapprochement<T extends ArticleMinimal = ArticleMinimal> = {
  article: T | null
  /** Référence canonique résolue (celle de l'article trouvé, ou de l'alias, ou la référence nettoyée) */
  referenceCanonique: string
  methode:
    | "alias"
    | "reference"
    | "reference_normalisee"
    | "code_barre"
    | "couple_fournisseur_ref"
    | "reference_fournisseur"
    | "aucune"
}

/**
 * Cherche dans le catalogue l'article correspondant aux identifiants fournis,
 * sans jamais créer de doublon entre code fournisseur, référence interne et code-barres.
 */
export function trouverArticleCatalogue<T extends ArticleMinimal>(
  index: IndexCatalogue<T>,
  critere: CritereRapprochement,
): ResultatRapprochement<T> {
  const refBrute = (critere.reference ?? "").trim()
  const refFournBrute = (critere.referenceFournisseur ?? "").trim()
  const codeBarreBrut = (critere.codeBarre ?? "").trim()
  const fournNorm = cleReference(critere.fournisseur)

  // 1. Résolution par Alias fournisseur (sur reference ou referenceFournisseur)
  for (const candidate of [refBrute, refFournBrute]) {
    const kCand = cleReference(candidate)
    if (!kCand) continue
    const cibleAlias =
      (fournNorm && index.aliasVersRefCanonique.get(`${fournNorm}:${kCand}`)) ||
      index.aliasVersRefCanonique.get(`*:${kCand}`)
    if (cibleAlias) {
      const artParAlias =
        index.parRefExacte.get(cibleAlias.toUpperCase()) ||
        index.parRefNormalisee.get(cleReference(cibleAlias)) ||
        null
      if (artParAlias) {
        return { article: artParAlias, referenceCanonique: artParAlias.reference, methode: "alias" }
      }
      return { article: null, referenceCanonique: cibleAlias, methode: "alias" }
    }
  }

  // 2. Référence exacte (insensible à la casse)
  if (refBrute) {
    const exact = index.parRefExacte.get(refBrute.toUpperCase())
    if (exact) {
      return { article: exact, referenceCanonique: exact.reference, methode: "reference" }
    }
  }

  // 3. Code-barres exact (ou référence qui est en réalité un EAN scanné/facturé)
  for (const cb of [codeBarreBrut, refBrute]) {
    if (!cb) continue
    const parCb = index.parCodeBarre.get(cb)
    if (parCb) {
      return { article: parCb, referenceCanonique: parCb.reference, methode: "code_barre" }
    }
  }

  // 4. Référence normalisée (ex: "DISJ-16A" vs "DISJ 16A")
  if (refBrute) {
    const norm = index.parRefNormalisee.get(cleReference(refBrute))
    if (norm) {
      return { article: norm, referenceCanonique: norm.reference, methode: "reference_normalisee" }
    }
  }

  // 5. Couple (Fournisseur + Référence fournisseur) ou Référence de facture qui est en fait la référence fournisseur du catalogue
  for (const candidate of [refFournBrute, refBrute]) {
    const rfNorm = cleReference(candidate)
    if (!rfNorm) continue
    if (fournNorm) {
      const parCouple = index.parCoupleFournisseurRef.get(`${fournNorm}:${rfNorm}`)
      if (parCouple) {
        return { article: parCouple, referenceCanonique: parCouple.reference, methode: "couple_fournisseur_ref" }
      }
    }
    const parRf = index.parRefFournisseur.get(rfNorm)
    if (parRf) {
      return { article: parRf, referenceCanonique: parRf.reference, methode: "reference_fournisseur" }
    }
    // Et inversement : si le fichier catalogue met dans `referenceFournisseur` ce qui était déjà `Article.reference`
    const parRefInterne = index.parRefNormalisee.get(rfNorm)
    if (parRefInterne) {
      return { article: parRefInterne, referenceCanonique: parRefInterne.reference, methode: "reference_fournisseur" }
    }
  }

  return {
    article: null,
    referenceCanonique: refBrute || refFournBrute || codeBarreBrut,
    methode: "aucune",
  }
}
