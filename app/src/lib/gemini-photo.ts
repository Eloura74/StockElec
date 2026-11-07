import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export interface RecognizedItem {
  reference?: string;
  designation: string;
  quantite: number;
  marque?: string;
  confiance?: number; // 0 à 100
  remarqueVisuelle?: string;
}

export interface PhotoRecognitionResult {
  lignes: RecognizedItem[];
  resume: string;
}

const CANDIDATE_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
];

const photoResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    resume: {
      type: SchemaType.STRING,
      description:
        "Courte phrase résumant ce qui est visible (ex: '4 disjoncteurs et 2 rouleaux de câble détectés').",
    },
    lignes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          designation: {
            type: SchemaType.STRING,
            description:
              "Désignation électrique claire et précise (ex: 'Disjoncteur 1P+N 16A Courbe C', 'Prise Plexo étanche grise', 'Boîte Batibox 1 poste').",
          },
          reference: {
            type: SchemaType.STRING,
            description:
              "Référence ou code produit gravé ou imprimé sur le produit / étiquette si visible (ex: '069731', 'DISJ-16A', '080021'). Laisser vide si non discernable.",
          },
          marque: {
            type: SchemaType.STRING,
            description:
              "Marque du fabricant si visible (Hager, Legrand, Schneider Electric, Nexans, Wago, etc.).",
          },
          quantite: {
            type: SchemaType.NUMBER,
            description: "Nombre d'unités visibles distinctes de cet article.",
          },
          confiance: {
            type: SchemaType.NUMBER,
            description: "Niveau de certitude de 1 à 100.",
          },
          remarqueVisuelle: {
            type: SchemaType.STRING,
            description:
              "Détail visuel (ex: 'Neuf en boîte', 'Calibre C16 écrit en blanc', 'Couronne entamée').",
          },
        },
        required: ["designation", "quantite"],
      },
    },
  },
  required: ["lignes", "resume"],
};

const PHOTO_PROMPT = `Tu es un expert électricien et gestionnaire de magasinier outillage BTP.
Tu analyses la photo prise par un électricien (soit au dépôt, soit au retour du chantier, soit à la réception d'un carton fournisseur).

Ton rôle est d'identifier chaque matériel électrique présent sur la photo et de compter les quantités exactes :
1. Examine les formes, couleurs, inscriptions en façade (C10, C16, C20, C32, 30mA, Type A / AC), logos (Hager, Legrand, Schneider Electric, Wago, Nexans, etc.) et étiquettes.
2. Si c'est un carton ou une boîte avec étiquette, lis la référence imprimée et la quantité inscrite sur l'étiquette.
3. Si c'est du modulaire (disjoncteurs, différentiels), indique bien le calibre et le type (ex: Disjoncteur 1P+N 16A).
4. Si c'est de l'appareillage (prises, interrupteurs, boîtes d'encastrement jaunes Batibox, étanches Plexo), spécifie le modèle.
5. Déduis une désignation professionnelle propre pour chaque article détecté et compte précisément les pièces visibles.

Ne crée pas d'articles fantaisistes : ne liste que ce qui est réellement visible et discernable sur l'image.`;

export async function recognizePhotoEquipmentWithGemini(
  base64Data: string,
  mimeType: string = "image/jpeg",
): Promise<PhotoRecognitionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé GEMINI_API_KEY non configurée dans l'environnement serveur.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel
    ? [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: photoResponseSchema,
        },
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/jpeg",
          },
        },
        PHOTO_PROMPT,
      ]);

      const responseText = result.response.text();
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim();
      }

      const parsed = JSON.parse(cleanedText);

      return {
        resume: parsed.resume || "Matériel analysé par l'IA",
        lignes: Array.isArray(parsed.lignes)
          ? parsed.lignes.map((l: any) => ({
              designation: String(l.designation || "").trim(),
              reference: l.reference ? String(l.reference).trim() : undefined,
              marque: l.marque ? String(l.marque).trim() : undefined,
              quantite: Math.max(1, parseInt(l.quantite, 10) || 1),
              confiance: typeof l.confiance === "number" ? l.confiance : 90,
              remarqueVisuelle: l.remarqueVisuelle
                ? String(l.remarqueVisuelle).trim()
                : undefined,
            }))
          : [],
      };
    } catch (err: any) {
      console.warn(
        `[Gemini Photo Recognition] Échec modèle ${modelName}:`,
        err?.message || err,
      );
      lastError = err;
    }
  }

  throw new Error(
    `Échec de l'analyse photo avec les modèles IA : ${lastError?.message || lastError}`,
  );
}
