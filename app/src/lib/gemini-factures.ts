import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export interface ParsedInvoiceLine {
  reference: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  chantier?: string;
}

export interface ParsedInvoiceData {
  fournisseur: string | null;
  numeroFacture: string | null;
  dateFacture: string | null;
  totalHT: number | null;
  totalTVA: number | null;
  totalTTC: number | null;
  dateEcheance: string | null;
  modePaiement: string | null;
  lignes: ParsedInvoiceLine[];
}

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash'
];

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    fournisseur: { type: SchemaType.STRING },
    numeroFacture: { type: SchemaType.STRING },
    dateFacture: { type: SchemaType.STRING },
    totalHT: { type: SchemaType.NUMBER },
    totalTVA: { type: SchemaType.NUMBER },
    totalTTC: { type: SchemaType.NUMBER },
    dateEcheance: { type: SchemaType.STRING },
    modePaiement: { type: SchemaType.STRING },
    lignes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          reference: { type: SchemaType.STRING },
          designation: { type: SchemaType.STRING },
          quantite: { type: SchemaType.NUMBER },
          prixUnitaire: { type: SchemaType.NUMBER },
          chantier: { type: SchemaType.STRING },
        },
        required: ['reference', 'designation', 'quantite', 'prixUnitaire'],
      }
    }
  },
  required: ['fournisseur', 'numeroFacture', 'lignes'],
};

const PROMPT = `Tu es un assistant expert en comptabilité et gestion de chantiers pour artisans et électriciens (BTP).
Analyse cette facture (document PDF ou scan/image) complète (Rexel, Sonepar, YESSS Electrique, Balitran, etc.).
Extrais les données financières globales ainsi que la liste exhaustive de TOUS les articles facturés sur toutes les pages.

Données globales à extraire :
- fournisseur : Nom du distributeur (Rexel, Sonepar, YESSS Electrique, etc.)
- numeroFacture : Numéro de la facture (ex: 061-007-000233)
- dateFacture : La date d'émission de la facture ou la date du bon de livraison / bon de commande (format JJ/MM/AAAA ou AAAA-MM-JJ). Il faut absolument chercher la date d'émission qui est imprimée sur le document (ex: "Date : 15/09/2026"). Ne mets JAMAIS la date d'aujourd'hui si une date est présente sur le document.
- totalHT : Montant Total Net HT de la facture (nombre décimal)
- totalTVA : Montant Total TVA (nombre décimal)
- totalTTC : Montant Total TTC (nombre décimal)
- dateEcheance : Date limite de paiement / échéance si mentionnée (ex: 31/08/2026)
- modePaiement : Condition ou mode de règlement (ex: "LCR 30 Jours FDM", "Virement")

Pour chaque article facturé :
- reference : La référence produit exacte du catalogue
- designation : La description / désignation du produit
- quantite : La quantité facturée (nombre)
- prixUnitaire : Le prix unitaire NET HT après remise (hors TVA)
- chantier : L'imputation analytique / nom du chantier ou référence client rattachée à cet article ou au bon de livraison (ex: "SCI PELICAN", "HARVEY", "CASSIOPEE", "WELDOM", "STOCK"). Si aucune mention de chantier n'est spécifiée, indiquer "STOCK".

Sois exhaustif et extrait l'intégralité des lignes d'articles de chaque page.`;

export async function parseInvoiceWithGemini(
  base64Data: string,
  mimeType: string = 'application/pdf'
): Promise<ParsedInvoiceData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé GEMINI_API_KEY non configurée dans l'environnement serveur.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel 
    ? [preferredModel, ...CANDIDATE_MODELS.filter(m => m !== preferredModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'application/pdf'
          }
        },
        PROMPT
      ]);

      const responseText = result.response.text();
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanedText);

      return {
        fournisseur: parsed.fournisseur ? String(parsed.fournisseur).trim() : null,
        numeroFacture: parsed.numeroFacture ? String(parsed.numeroFacture).trim() : null,
        dateFacture: parsed.dateFacture || null,
        totalHT: typeof parsed.totalHT === 'number' ? parsed.totalHT : (parsed.totalHT ? parseFloat(parsed.totalHT) : null),
        totalTVA: typeof parsed.totalTVA === 'number' ? parsed.totalTVA : (parsed.totalTVA ? parseFloat(parsed.totalTVA) : null),
        totalTTC: typeof parsed.totalTTC === 'number' ? parsed.totalTTC : (parsed.totalTTC ? parseFloat(parsed.totalTTC) : null),
        dateEcheance: parsed.dateEcheance || null,
        modePaiement: parsed.modePaiement || null,
        lignes: Array.isArray(parsed.lignes) ? parsed.lignes : []
      };
    } catch (err: any) {
      console.warn(`[Gemini Invoice Parser] Échec avec le modèle ${modelName}:`, err?.message || err);
      lastError = err;
      // On continue vers le modèle candidat suivant
    }
  }

  throw new Error(`Échec de l'analyse avec tous les modèles IA disponibles: ${lastError?.message || lastError}`);
}
