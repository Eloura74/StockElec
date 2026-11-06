import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { calculerStocksDepuisAgregats } from "@/lib/stockUtils"
import {
  construireIndexCatalogue,
  indexerArticleDansCatalogue,
  trouverArticleCatalogue,
} from "@/lib/article-matching"
import type { OfflineOperation } from "@/lib/offline-sync"

async function calculerStockDepot(articleId: string): Promise<number | null> {
  const article = await prisma.article.findUnique({ where: { id: articleId } })
  if (!article) return null
  const agregats = await prisma.mouvement.groupBy({
    by: ["articleId", "type", "chantierId"],
    where: { articleId },
    _sum: { quantite: true },
  })
  const s = calculerStocksDepuisAgregats(agregats).get(articleId)
  return article.stockInitial + (s?.stockDepot ?? 0)
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const rawOps: OfflineOperation[] = Array.isArray(body?.operations) ? body.operations : []
    if (rawOps.length === 0) {
      return NextResponse.json({ success: true, syncedIds: [], errors: [] })
    }

    const operations = [...rawOps].sort((a, b) => a.createdAt - b.createdAt)
    const syncedIds: string[] = []
    const errors: string[] = []

    // Table de correspondance tempId (créé hors-ligne) -> vrai ID Prisma
    const tempIdMap = new Map<string, string>()

    // Pré-chargement du catalogue pour la détection anti-doublon lors des créations hors-ligne
    const [tousArticles, tousAliases] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          reference: true,
          designation: true,
          codeBarre: true,
          fournisseur: true,
          referenceFournisseur: true,
          prixUnitaire: true,
        },
      }),
      prisma.referenceAlias.findMany(),
    ])
    const indexCatalogue = construireIndexCatalogue(tousArticles, tousAliases)

    for (const op of operations) {
      if (!op || !op.id || !op.type) continue
      const syncTag = `[SYNC:${op.id}]`

      try {
        // Vérification d'idempotence : si déjà synchronisé lors d'une tentative précédente interrompue
        const [dejaMouvement, dejaOutillage] = await Promise.all([
          prisma.mouvement.findFirst({
            where: { observation: { contains: syncTag } },
            select: { id: true },
          }),
          prisma.mouvementOutillage.findFirst({
            where: { observation: { contains: syncTag } },
            select: { id: true },
          }),
        ])
        if (dejaMouvement || dejaOutillage) {
          syncedIds.push(op.id)
          continue
        }

        const username = (session as any).username || "Terrain"

        switch (op.type) {
          case "CREER_ARTICLE_CHEF": {
            const { tempId, input } = op.payload
            const designation = (input.designation || "").trim().slice(0, 200)
            if (!designation) {
              syncedIds.push(op.id)
              break
            }
            const refSaisie = (input.reference || "").trim() || `REF-${op.createdAt}`
            const codeBarre = (input.codeBarre || "").trim() || null
            const fournisseur = (input.fournisseur || "").trim() || null
            const referenceFournisseur = (input.referenceFournisseur || "").trim() || null
            const stockInitial = Math.max(0, Math.round(Number(input.stockInitial) || 0))

            const match = trouverArticleCatalogue(indexCatalogue, {
              reference: refSaisie,
              codeBarre,
              fournisseur,
              referenceFournisseur,
            }).article

            let articleIdCible: string
            if (match) {
              articleIdCible = match.id
              if (stockInitial > 0) {
                await prisma.mouvement.create({
                  data: {
                    type: "Correction_Plus",
                    quantite: stockInitial,
                    articleId: match.id,
                    utilisateur: username,
                    observation: `Ajout hors-ligne rattaché à l'article existant par ${username} ${syncTag}`,
                  },
                })
              }
            } else {
              const cree = await prisma.article.create({
                data: {
                  reference: refSaisie,
                  designation,
                  codeBarre,
                  fournisseur,
                  referenceFournisseur,
                  categorie: (input.categorie || "").trim() || "À classer",
                  unite: (input.unite || "").trim() || "u",
                  stockMinimum: Math.max(0, Math.round(Number(input.stockMinimum) || 0)),
                  quantiteParBoite: Math.max(1, Math.round(Number(input.quantiteParBoite) || 1)),
                  stockInitial: 0,
                },
              })
              articleIdCible = cree.id
              indexerArticleDansCatalogue(indexCatalogue, cree)

              if (stockInitial > 0) {
                await prisma.mouvement.create({
                  data: {
                    type: "Correction_Plus",
                    quantite: stockInitial,
                    articleId: cree.id,
                    utilisateur: username,
                    observation: `Création hors-ligne par ${username} ${syncTag}`,
                  },
                })
              }
            }

            if (tempId) {
              tempIdMap.set(tempId, articleIdCible)
            }
            await logAudit(
              "CREATION",
              "Article",
              `${username} a créé hors-ligne « ${designation} » (${refSaisie}) ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }

          case "MODIFIER_ARTICLE_CHEF": {
            const { input, nouveauStock } = op.payload
            const rawId = input.id || ""
            const articleId = tempIdMap.get(rawId) || rawId
            const existant = await prisma.article.findUnique({ where: { id: articleId } })
            if (!existant) {
              syncedIds.push(op.id)
              break
            }

            const designation = (input.designation || existant.designation).trim().slice(0, 200)
            const reference = (input.reference || existant.reference).trim()
            const codeBarre = (input.codeBarre || "").trim() || null

            await prisma.article.update({
              where: { id: articleId },
              data: {
                designation,
                reference,
                codeBarre,
                fournisseur: (input.fournisseur || "").trim() || null,
                referenceFournisseur: (input.referenceFournisseur || "").trim() || null,
                categorie: (input.categorie || "").trim() || existant.categorie,
                unite: (input.unite || "").trim() || existant.unite,
                stockMinimum: Math.max(0, Math.round(Number(input.stockMinimum) || 0)),
                quantiteParBoite: Math.max(1, Math.round(Number(input.quantiteParBoite) || 1)),
              },
            })

            if (nouveauStock !== undefined && nouveauStock !== null) {
              const actuel = await calculerStockDepot(articleId)
              if (actuel !== null) {
                const diff = Math.max(0, Math.round(Number(nouveauStock))) - actuel
                if (diff !== 0) {
                  await prisma.mouvement.create({
                    data: {
                      type: diff > 0 ? "Correction_Plus" : "Correction_Moins",
                      quantite: Math.abs(diff),
                      articleId,
                      utilisateur: username,
                      observation: `Ajustement hors-ligne par ${username} (${actuel} → ${nouveauStock}) ${syncTag}`,
                    },
                  })
                }
              }
            }

            await logAudit(
              "MODIFICATION",
              "Article",
              `${username} a modifié hors-ligne « ${designation} » (${reference}) ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }

          case "AJUSTER_STOCK_CHEF": {
            const { articleId: rawId, nouveauStock } = op.payload
            const articleId = tempIdMap.get(rawId) || rawId
            const actuel = await calculerStockDepot(articleId)
            if (actuel !== null) {
              const cible = Math.max(0, Math.round(Number(nouveauStock) || 0))
              const diff = cible - actuel
              if (diff !== 0) {
                await prisma.mouvement.create({
                  data: {
                    type: diff > 0 ? "Correction_Plus" : "Correction_Moins",
                    quantite: Math.abs(diff),
                    articleId,
                    utilisateur: username,
                    observation: `Ajustement hors-ligne par ${username} (${actuel} → ${cible}) ${syncTag}`,
                  },
                })
              }
            }
            await logAudit(
              "MODIFICATION",
              "Stock",
              `${username} a ajusté le stock hors-ligne (${nouveauStock}) ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }

          case "DEPART_MATIN": {
            const { chantierId, lignes, observation } = op.payload
            const lignesValides = lignes
              .map((l) => ({
                articleId: tempIdMap.get(l.articleId) || l.articleId,
                quantite: Math.max(1, Math.round(Number(l.quantite) || 1)),
              }))
              .filter((l) => Boolean(l.articleId))

            if (lignesValides.length > 0) {
              await prisma.$transaction(
                lignesValides.map((l) =>
                  prisma.mouvement.create({
                    data: {
                      type: "Depart",
                      quantite: l.quantite,
                      articleId: l.articleId,
                      chantierId,
                      utilisateur: username,
                      observation: `${observation ? observation + " " : "(Départ Hors-Ligne) "}${syncTag}`,
                    },
                  })
                )
              )
            }

            await logAudit(
              "CREATION",
              "Mouvement",
              `Départ chantier hors-ligne (${lignesValides.length} réf.) par ${username} ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }

          case "RETOUR_CHANTIER": {
            const { chantierId, lignes, observation } = op.payload
            const typesAutorises = new Set(["Retour", "Consomme", "Perte"])
            const lignesValides = lignes
              .map((l) => ({
                articleId: tempIdMap.get(l.articleId) || l.articleId,
                quantite: Math.max(1, Math.round(Number(l.quantite) || 1)),
                type: typesAutorises.has(l.type) ? l.type : "Retour",
              }))
              .filter((l) => Boolean(l.articleId))

            if (lignesValides.length > 0) {
              await prisma.$transaction(
                lignesValides.map((l) =>
                  prisma.mouvement.create({
                    data: {
                      type: l.type,
                      quantite: l.quantite,
                      articleId: l.articleId,
                      chantierId,
                      utilisateur: username,
                      observation: `${observation ? observation + " " : `(${l.type} Hors-Ligne) `}${syncTag}`,
                    },
                  })
                )
              )
            }

            await logAudit(
              "CREATION",
              "Mouvement",
              `Pointage retour chantier hors-ligne (${lignesValides.length} réf.) par ${username} ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }

          case "OUTILLAGE_MOUVEMENT": {
            const { outillageId, type, chantierId, utilisateur, observation } = op.payload
            let nouveauStatut = "Disponible"
            if (type === "Emprunt") nouveauStatut = "En Chantier"
            else if (type === "Retour") nouveauStatut = "Disponible"
            else if (type === "Réparation") nouveauStatut = "En Réparation"
            else if (type === "Perte") nouveauStatut = "Perdu"

            await prisma.$transaction([
              prisma.outillage.update({
                where: { id: outillageId },
                data: {
                  statut: nouveauStatut,
                  chantierId: type === "Emprunt" ? chantierId : null,
                  utilisateur: type === "Emprunt" ? utilisateur || username : null,
                },
              }),
              prisma.mouvementOutillage.create({
                data: {
                  outillageId,
                  type,
                  chantierId: type === "Emprunt" ? chantierId : null,
                  utilisateur: utilisateur || username,
                  observation: `${observation ? observation + " " : ""}${syncTag}`,
                },
              }),
            ])

            await logAudit(
              "MODIFICATION",
              "Outillage",
              `Mouvement outillage hors-ligne (${type}) par ${utilisateur || username} ${syncTag}`
            )
            syncedIds.push(op.id)
            break
          }
        }
      } catch (err: any) {
        console.error(`Erreur synchro opération ${op.id}:`, err)
        errors.push(`${op.label} : ${err?.message || "Erreur serveur"}`)
      }
    }

    revalidatePath("/depart-matin")
    revalidatePath("/catalogue")
    revalidatePath("/mouvements")
    revalidatePath("/reassort")
    revalidatePath("/chantiers")
    revalidatePath("/outillage")
    revalidatePath("/journal")

    return NextResponse.json({
      success: errors.length === 0,
      syncedIds,
      errors,
    })
  } catch (error: any) {
    console.error("Erreur API /api/sync:", error)
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la synchronisation" },
      { status: 500 }
    )
  }
}
