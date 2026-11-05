"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculerStocksDepuisAgregats } from "@/lib/stockUtils";
import { logAudit } from "@/lib/audit";

/**
 * Actions « Articles » destinées aux chefs d'équipe (et au gérant) :
 * création, modification d'informations et ajustement de stock.
 *
 * Volontairement NON exposé ici : prix unitaire et suppression (réservés au gérant).
 */

export type ArticleChefInput = {
  id?: string;
  designation: string;
  reference?: string;
  codeBarre?: string;
  fournisseur?: string;
  referenceFournisseur?: string;
  categorie?: string;
  unite?: string;
  stockMinimum?: number;
  quantiteParBoite?: number;
  /** Création : stock de départ. Édition : ignoré (utiliser ajusterStockChef). */
  stockInitial?: number;
};

export type ActionResult =
  | { success: true; id: string; message?: string }
  | { success: false; error: string };

const MAX_STOCK = 1_000_000;

async function exigerSession() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "GERANT" && session.role !== "CHEF_EQUIPE")
  ) {
    return null;
  }
  return session as { username: string; role: string };
}

function texte(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const v = valeur.trim();
  return v ? v : null;
}

function entier(
  valeur: unknown,
  defaut: number,
  min: number,
  max = MAX_STOCK,
): number | null {
  if (valeur === undefined || valeur === null || valeur === "") return defaut;
  const n = Number(valeur);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

async function stockDepotActuel(articleId: string): Promise<number | null> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return null;
  const agregats = await prisma.mouvement.groupBy({
    by: ["articleId", "type", "chantierId"],
    where: { articleId },
    _sum: { quantite: true },
  });
  const s = calculerStocksDepuisAgregats(agregats).get(articleId);
  return article.stockInitial + (s?.stockDepot ?? 0);
}

function revalider() {
  revalidatePath("/depart-matin");
  revalidatePath("/catalogue");
  revalidatePath("/mouvements");
  revalidatePath("/reassort");
}

function messageErreur(error: unknown): string {
  const e = error as { code?: string; meta?: { target?: unknown } };
  if (e?.code === "P2002") {
    const cible = JSON.stringify(e.meta?.target ?? "");
    if (cible.includes("codeBarre"))
      return "Ce code-barres est déjà utilisé par un autre article.";
    if (cible.includes("reference")) return "Cette référence existe déjà.";
    return "Un article identique existe déjà.";
  }
  console.error("Erreur articles chef:", error);
  return "Erreur lors de l'enregistrement.";
}

export async function creerArticleChef(
  input: ArticleChefInput,
): Promise<ActionResult> {
  const session = await exigerSession();
  if (!session) return { success: false, error: "Non autorisé" };

  const designation = texte(input.designation);
  if (!designation)
    return { success: false, error: "La désignation est obligatoire." };
  if (designation.length > 200)
    return {
      success: false,
      error: "Désignation trop longue (200 caractères max).",
    };

  const stockMinimum = entier(input.stockMinimum, 0, 0);
  const quantiteParBoite = entier(input.quantiteParBoite, 1, 1);
  const stockInitial = entier(input.stockInitial, 0, 0);
  if (stockMinimum === null)
    return { success: false, error: "Seuil d'alerte invalide." };
  if (quantiteParBoite === null)
    return { success: false, error: "Quantité par lot invalide (minimum 1)." };
  if (stockInitial === null)
    return { success: false, error: "Quantité en stock invalide." };

  const reference = texte(input.reference) ?? `REF-${Date.now()}`;
  const codeBarre = texte(input.codeBarre);

  try {
    const doublonRef = await prisma.article.findUnique({
      where: { reference },
    });
    if (doublonRef)
      return {
        success: false,
        error: `La référence « ${reference} » existe déjà.`,
      };
    if (codeBarre) {
      const doublonCode = await prisma.article.findUnique({
        where: { codeBarre },
      });
      if (doublonCode) {
        return {
          success: false,
          error: `Ce code-barres est déjà utilisé par « ${doublonCode.designation} ».`,
        };
      }
    }

    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          reference,
          designation,
          codeBarre,
          fournisseur: texte(input.fournisseur),
          referenceFournisseur: texte(input.referenceFournisseur),
          categorie: texte(input.categorie) ?? "À classer",
          unite: texte(input.unite) ?? "u",
          stockMinimum,
          quantiteParBoite,
          stockInitial: 0,
        },
      });
      if (stockInitial > 0) {
        await tx.mouvement.create({
          data: {
            type: "Correction_Plus",
            quantite: stockInitial,
            articleId: created.id,
            utilisateur: session.username,
            observation: `Création de l'article par ${session.username}`,
          },
        });
      }
      return created;
    });

    await logAudit(
      "CREATION",
      "Article",
      `${session.username} a créé « ${designation} » (${reference})`,
    );
    revalider();
    return { success: true, id: article.id, message: "Article créé." };
  } catch (error) {
    return { success: false, error: messageErreur(error) };
  }
}

export async function modifierArticleChef(
  input: ArticleChefInput,
): Promise<ActionResult> {
  const session = await exigerSession();
  if (!session) return { success: false, error: "Non autorisé" };
  if (!input.id) return { success: false, error: "Article manquant." };

  const designation = texte(input.designation);
  const reference = texte(input.reference);
  if (!designation)
    return { success: false, error: "La désignation est obligatoire." };
  if (designation.length > 200)
    return {
      success: false,
      error: "Désignation trop longue (200 caractères max).",
    };
  if (!reference)
    return { success: false, error: "La référence est obligatoire." };

  const stockMinimum = entier(input.stockMinimum, 0, 0);
  const quantiteParBoite = entier(input.quantiteParBoite, 1, 1);
  if (stockMinimum === null)
    return { success: false, error: "Seuil d'alerte invalide." };
  if (quantiteParBoite === null)
    return { success: false, error: "Quantité par lot invalide (minimum 1)." };

  const codeBarre = texte(input.codeBarre);

  try {
    const existant = await prisma.article.findUnique({
      where: { id: input.id },
    });
    if (!existant) return { success: false, error: "Article introuvable." };

    if (reference !== existant.reference) {
      const doublonRef = await prisma.article.findUnique({
        where: { reference },
      });
      if (doublonRef)
        return {
          success: false,
          error: `La référence « ${reference} » existe déjà.`,
        };
    }
    if (codeBarre && codeBarre !== existant.codeBarre) {
      const doublonCode = await prisma.article.findUnique({
        where: { codeBarre },
      });
      if (doublonCode) {
        return {
          success: false,
          error: `Ce code-barres est déjà utilisé par « ${doublonCode.designation} ».`,
        };
      }
    }

    // Liste blanche : prix, stock initial, marque, emplacement… ne sont jamais touchés ici.
    await prisma.article.update({
      where: { id: input.id },
      data: {
        designation,
        reference,
        codeBarre,
        fournisseur: texte(input.fournisseur),
        referenceFournisseur: texte(input.referenceFournisseur),
        categorie: texte(input.categorie) ?? existant.categorie,
        unite: texte(input.unite) ?? existant.unite,
        stockMinimum,
        quantiteParBoite,
      },
    });

    await logAudit(
      "MODIFICATION",
      "Article",
      `${session.username} a modifié « ${designation} » (${reference})`,
    );
    revalider();
    revalidatePath(`/catalogue/${input.id}`);
    return { success: true, id: input.id, message: "Article mis à jour." };
  } catch (error) {
    return { success: false, error: messageErreur(error) };
  }
}

/**
 * Ajuste le stock du dépôt à la quantité réellement comptée en créant un
 * mouvement de correction traçable (Correction_Plus / Correction_Moins).
 */
export async function ajusterStockChef(
  articleId: string,
  nouveauStock: number,
): Promise<ActionResult> {
  const session = await exigerSession();
  if (!session) return { success: false, error: "Non autorisé" };

  const cible = entier(nouveauStock, 0, 0);
  if (cible === null) return { success: false, error: "Quantité invalide." };

  try {
    const actuel = await stockDepotActuel(articleId);
    if (actuel === null)
      return { success: false, error: "Article introuvable." };

    const difference = cible - actuel;
    if (difference === 0)
      return { success: true, id: articleId, message: "Stock inchangé." };

    await prisma.mouvement.create({
      data: {
        type: difference > 0 ? "Correction_Plus" : "Correction_Moins",
        quantite: Math.abs(difference),
        articleId,
        utilisateur: session.username,
        observation: `Ajustement manuel par ${session.username} (ancien stock : ${actuel}, nouveau : ${cible})`,
      },
    });

    revalider();
    return {
      success: true,
      id: articleId,
      message: `Stock ajusté : ${actuel} → ${cible}.`,
    };
  } catch (error) {
    return { success: false, error: messageErreur(error) };
  }
}
