import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recognizePhotoEquipmentWithGemini } from "@/lib/gemini-photo";
import prisma from "@/lib/prisma";
import {
  construireIndexCatalogue,
  trouverArticleCatalogue,
} from "@/lib/article-matching";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucune photo fournie." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // 1. Analyse Visuelle Gemini
    const visionResult = await recognizePhotoEquipmentWithGemini(
      base64Data,
      mimeType,
    );

    // 2. Matching avec le catalogue local (78 000+ réf)
    const [tousArticles, tousAliases] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          reference: true,
          designation: true,
          codeBarre: true,
          fournisseur: true,
          referenceFournisseur: true,
          unite: true,
          prixUnitaire: true,
        },
      }),
      prisma.referenceAlias.findMany(),
    ]);

    const indexCatalogue = construireIndexCatalogue(tousArticles, tousAliases);

    const itemsReconnus = visionResult.lignes.map((item) => {
      // Recherche de match par référence ou désignation
      let match = null;
      if (item.reference) {
        match = trouverArticleCatalogue(indexCatalogue, {
          reference: item.reference,
          referenceFournisseur: item.reference,
          fournisseur: item.marque,
        }).article;
      }

      // Si pas de match par référence directe, tenter une recherche textuelle approchée
      if (!match && item.designation) {
        const queryLower = item.designation.toLowerCase();
        // Chercher d'abord dans les disjoncteurs / modules courants
        const candidat = tousArticles.find((a) => {
          const desigLower = a.designation.toLowerCase();
          if (
            queryLower.includes("disjoncteur") &&
            desigLower.includes("disjoncteur")
          ) {
            const calibres = ["10a", "16a", "20a", "32a", "2a", "1P+N"];
            for (const cal of calibres) {
              if (
                queryLower.includes(cal.toLowerCase()) &&
                desigLower.includes(cal.toLowerCase())
              ) {
                return true;
              }
            }
          }
          return false;
        });
        if (candidat) match = candidat;
      }

      return {
        id: Math.random().toString(36).substring(7),
        articleId: match?.id || null,
        reference: match
          ? match.reference
          : item.reference || "REF-A-CONFIRMER",
        designation: match ? match.designation : item.designation,
        unite: match?.unite || "u",
        quantite: item.quantite,
        marque: item.marque,
        confiance: match
          ? Math.max(item.confiance || 85, 95)
          : item.confiance || 80,
        remarqueVisuelle: item.remarqueVisuelle,
        estExistant: Boolean(match),
      };
    });

    return NextResponse.json({
      success: true,
      resume: visionResult.resume,
      items: itemsReconnus,
    });
  } catch (error: any) {
    console.error("Erreur API scan-photo:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de l'analyse photo par l'IA : " +
          (error?.message || error),
      },
      { status: 500 },
    );
  }
}
