/**
 * Test d'intégration de l'import Excel d'articles.
 *
 * ⚠️ Écrit dans la base : refuse de tourner si DATABASE_URL ne pointe pas sur localhost.
 *
 * Usage (base locale jetable, ex. `npx prisma dev`) :
 *   $env:DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=1"
 *   npx prisma db push --skip-generate
 *   npx tsx scripts/test-import-articles.ts
 */
import assert from "node:assert/strict"
import path from "node:path"
import * as XLSX from "xlsx"
import { PrismaClient } from "@prisma/client"
import {
  construireLignes, dedoublonnerLignes, detecterLigneEntete, detecterMapping,
  eanValide, normaliserCodeBarre, parseNombre, type LigneImport,
} from "../src/lib/import-articles"
import { executerImport, type OptionsImport } from "../src/lib/import-articles-db"

const url = process.env.DATABASE_URL || ""
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("❌ DATABASE_URL doit pointer vers une base LOCALE de test. Abandon.")
  process.exit(1)
}

let ok = 0
function test(nom: string, fn: () => void | Promise<void>) {
  return Promise.resolve().then(fn).then(
    () => { ok++; console.log(`  ✔ ${nom}`) },
    (e) => { console.error(`  ✘ ${nom}\n    ${e?.message}`); process.exitCode = 1 },
  )
}

function lireFeuille(fichier: string, feuille?: string): unknown[][] {
  const wb = XLSX.readFile(path.resolve(__dirname, "..", "..", fichier))
  const ws = wb.Sheets[feuille ?? wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]
}

function analyser(rows: unknown[][]) {
  const entete = detecterLigneEntete(rows)
  const mapping = detecterMapping(rows[entete])
  const { lignes, ignorees } = construireLignes(rows, entete, mapping)
  return { entete, mapping, lignes: dedoublonnerLignes(lignes), brutes: lignes, ignorees }
}

async function main() {
  console.log("\n— Normalisation")
  await test("parseNombre", () => {
    assert.equal(parseNombre("12,50 €"), 12.5)
    assert.equal(parseNombre("1 234,56"), 1234.56)
    assert.equal(parseNombre("1.234,56"), 1234.56)
    assert.equal(parseNombre("1,234.56"), 1234.56)
    assert.equal(parseNombre(3.14), 3.14)
    assert.equal(parseNombre("abc"), null)
    assert.equal(parseNombre(""), null)
  })
  await test("codes-barres", () => {
    assert.equal(normaliserCodeBarre(3245060000004), "3245060000004")
    assert.equal(normaliserCodeBarre("3 245060 000004"), "3245060000004")
    assert.equal(normaliserCodeBarre("3.24506E+12"), null)
    assert.equal(eanValide("4006381333931"), true)
    assert.equal(eanValide("4006381333932"), false)
    assert.equal(eanValide("96385074"), true)
  })

  console.log("\n— Fichier réel « Inventaire CE 2026.xlsx »")
  const inv = analyser(lireFeuille("Inventaire CE 2026.xlsx"))
  await test("ligne d'en-têtes détectée (ligne Excel 3)", () => assert.equal(inv.entete, 2))
  await test("mapping automatique des colonnes", () => {
    assert.equal(inv.mapping.emplacement, 0)
    assert.equal(inv.mapping.marque, 1)
    assert.equal(inv.mapping.reference, 2)
    assert.equal(inv.mapping.designation, 3)
    assert.equal(inv.mapping.complementDesignation, 4)
    assert.equal(inv.mapping.stock, 6, "« Stock final » doit primer sur « Stock initial »")
    assert.equal(inv.mapping.prixUnitaire, 7)
  })
  await test("892 lignes produit lues (dont 11 sans désignation, ex. Hager TYA 664AN)", () => {
    assert.equal(inv.brutes.length, 892)
    const tya = inv.brutes.find((l) => l.reference === "TYA 664AN")!
    assert.equal(tya.designation, "TYA 664AN")
    assert.equal(tya.stock, 2)
  })
  await test("références uniques après dédoublonnage", () => {
    const refs = inv.lignes.map((l) => l.reference.toUpperCase())
    assert.equal(new Set(refs).size, refs.length)
  })
  await test("réf. partagée Meljac 202300342 → 12 articles distincts", () => {
    assert.equal(inv.lignes.filter((l) => l.reference.startsWith("202300342-")).length, 12)
  })
  await test("doublon EPN515 (même produit, accent différent) → fusionné, stocks additionnés", () => {
    const l = inv.lignes.filter((x) => x.reference === "EPN515")
    assert.equal(l.length, 1)
    assert.equal(l[0].stock, 1)
  })
  await test("première ligne correcte (Meljac boîtier bleu)", () => {
    const l = inv.lignes[0]
    assert.equal(l.designation, "Boitier simple - bleu")
    assert.equal(l.marque, "Meljac")
    assert.equal(l.emplacement, "A1")
    assert.equal(l.stock, 64)
    assert.equal(l.prixUnitaire, 3.14)
    assert.equal(l.referenceGeneree, true)
  })
  console.log(`    → ${inv.lignes.length} articles à importer, ${inv.ignorees.length} lignes ignorées`)

  console.log("\n— Fichier réel « gestion_stock_chantiers_pro_v2.xlsx » (feuille Articles)")
  const pro = analyser(lireFeuille("gestion_stock_chantiers_pro_v2.xlsx", "Articles"))
  await test("en-têtes ligne Excel 4 + mapping", () => {
    assert.equal(pro.entete, 3)
    assert.equal(pro.mapping.reference, 0)
    assert.equal(pro.mapping.designation, 1)
    assert.equal(pro.mapping.categorie, 2)
    assert.equal(pro.mapping.unite, 3)
    assert.equal(pro.mapping.emplacement, 4)
    assert.equal(pro.mapping.stock, 5)
    assert.equal(pro.mapping.stockMinimum, 6)
    assert.equal(pro.mapping.prixUnitaire, 7)
    assert.equal(pro.mapping.fournisseur, 8)
    assert.equal(pro.mapping.codeBarre, 9)
  })
  await test("VIS-6X60 lu correctement", () => {
    const l = pro.lignes.find((x) => x.reference === "VIS-6X60")!
    assert.equal(l.designation, "Vis béton 6x60")
    assert.equal(l.stock, 12)
    assert.equal(l.stockMinimum, 4)
    assert.equal(l.prixUnitaire, 8.5)
  })

  console.log("\n— Base de données (locale)")
  const cleanUrl = url.includes("pgbouncer=true") ? url : `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`
  const prisma = new PrismaClient({
    datasources: { db: { url: cleanUrl } }
  })
  try {
    await prisma.mouvement.deleteMany()
    await prisma.article.deleteMany()
    const opts: OptionsImport = { mode: "complet", majStockExistants: false }

    // Lots de 500 comme le navigateur
    const parLots = async (lignes: LigneImport[], o: OptionsImport, dry: boolean) => {
      const total = { creation: 0, mise_a_jour: 0, inchange: 0, ignore: 0, erreur: 0, correctionsStock: 0 }
      for (let i = 0; i < lignes.length; i += 500) {
        const { stats } = await executerImport(prisma, lignes.slice(i, i + 500), o, dry, "test")
        for (const k of Object.keys(total) as (keyof typeof total)[]) total[k] += stats[k]
      }
      return total
    }

    await test("simulation : n'écrit rien", async () => {
      const s = await parLots(inv.lignes, opts, true)
      assert.equal(s.creation, inv.lignes.length)
      assert.equal(await prisma.article.count(), 0)
    })
    await test("import réel : tous les articles créés", async () => {
      const s = await parLots(inv.lignes, opts, false)
      assert.equal(s.erreur, 0)
      assert.equal(s.creation, inv.lignes.length)
      assert.equal(await prisma.article.count(), inv.lignes.length)
      const a = await prisma.article.findFirst({ where: { designation: "Boitier simple - bleu", marque: "Meljac" } })
      assert.ok(a)
      assert.equal(a!.stockInitial, 64)
      assert.equal(a!.prixUnitaire, 3.14)
      assert.equal(a!.emplacement, "A1")
    })
    await test("réimport du même fichier : idempotent (aucune création, aucun changement)", async () => {
      const s = await parLots(inv.lignes, opts, false)
      assert.equal(s.creation, 0)
      assert.equal(s.mise_a_jour, 0)
      assert.equal(await prisma.article.count(), inv.lignes.length)
    })
    await test("fichier tarif (réf + prix seulement) : met à jour le prix sans effacer le reste", async () => {
      const tarif: unknown[][] = [["Réf.", "Prix net HT"], ["EPN515", "41,20 €"], ["INCONNUE-XYZ", "1"]]
      const t = analyser(tarif)
      const r = await executerImport(prisma, t.lignes, { mode: "maj_seulement", majStockExistants: false }, false, "test")
      assert.equal(r.stats.mise_a_jour, 1)
      assert.equal(r.stats.ignore, 1)
      const a = await prisma.article.findUnique({ where: { reference: "EPN515" } })
      assert.equal(a!.prixUnitaire, 41.2)
      assert.equal(a!.designation, "télerupteur 1o+1f 230v", "désignation non écrasée par la référence")
      assert.equal(a!.marque, "HAGER")
    })
    await test("alignement de stock : crée un mouvement de correction traçable", async () => {
      const a = await prisma.article.findUnique({ where: { reference: "EPN515" } })
      await prisma.mouvement.create({ data: { type: "Depart", quantite: 1, articleId: a!.id } }) // stock dépôt 1 → 0
      const t = analyser([["Référence", "Stock"], ["EPN515", 5]])
      const r = await executerImport(prisma, t.lignes, { mode: "maj_seulement", majStockExistants: true }, false, "test")
      assert.equal(r.stats.correctionsStock, 1)
      const m = await prisma.mouvement.findFirst({ where: { articleId: a!.id, type: "Correction_Plus" } })
      assert.equal(m!.quantite, 5)
      assert.match(m!.observation!, /ancien stock : 0/)
    })
    await test("code-barres déjà utilisé par un autre article : ignoré, pas de crash", async () => {
      await prisma.article.update({ where: { reference: "EPN515" }, data: { codeBarre: "4006381333931" } })
      await prisma.article.create({ data: { reference: "NOUVEAU-1", designation: "Test" } })
      const t = analyser([["Référence", "Désignation", "EAN"], ["NOUVEAU-1", "Test", "4006381333931"]])
      const r = await executerImport(prisma, t.lignes, opts, false, "test")
      assert.equal(r.stats.erreur, 0)
      assert.match(r.resultats[0].messages.join(" "), /déjà attribué à « EPN515 »/)
      const n = await prisma.article.findUnique({ where: { reference: "NOUVEAU-1" } })
      assert.equal(n!.codeBarre, null)
    })
    await test("rapprochement par code-barres quand la référence diffère", async () => {
      const t = analyser([["Code article", "Libellé", "EAN", "Tarif"], ["REF-AUTRE", "Télérupteur", "4006381333931", 39]])
      const r = await executerImport(prisma, t.lignes, { mode: "maj_seulement", majStockExistants: false }, false, "test")
      assert.equal(r.stats.mise_a_jour, 1)
      assert.equal((await prisma.article.findUnique({ where: { reference: "EPN515" } }))!.prixUnitaire, 39)
    })
    await test("mode création uniquement : n'altère pas l'existant", async () => {
      const t = analyser([["Référence", "Désignation", "Prix"], ["EPN515", "Autre nom", 99], ["NOUVEAU-2", "Neuf", 2]])
      const r = await executerImport(prisma, t.lignes, { mode: "creer_seulement", majStockExistants: false }, false, "test")
      assert.equal(r.stats.creation, 1)
      assert.equal(r.stats.ignore, 1)
      assert.equal((await prisma.article.findUnique({ where: { reference: "EPN515" } }))!.prixUnitaire, 39)
    })
    await test("données malveillantes / invalides rejetées proprement", async () => {
      const r = await executerImport(prisma, [{ reference: "", designation: "x" }, null, { reference: "X", designation: "Y", prixUnitaire: "abc", stock: -5 }], opts, true, "test")
      assert.equal(r.stats.erreur, 2)
      assert.equal(r.stats.creation, 1)
    })
  } finally {
    await prisma.$disconnect()
  }

  console.log(`\n${ok} tests OK${process.exitCode ? " — ÉCHECS présents" : ""}\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
