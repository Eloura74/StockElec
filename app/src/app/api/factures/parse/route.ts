import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY non configurée.");
      return NextResponse.json({ 
        error: "Clé GEMINI_API_KEY non configurée dans l'environnement serveur (Vercel)." 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const prompt = `Tu es un assistant expert en comptabilité et gestion de chantiers pour artisans et électriciens (BTP).
Analyse cette facture PDF complète (Rexel, Sonepar, YESSS Electrique, Balitran, etc.).
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

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      },
      prompt
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    
    const extractedFournisseur = parsed.fournisseur ? parsed.fournisseur.trim() : null;
    const extractedNumeroFacture = parsed.numeroFacture ? parsed.numeroFacture.trim() : null;
    
    let extractedItems: any[] = [];
    if (Array.isArray(parsed.lignes)) {
      extractedItems = parsed.lignes.map((item: any) => ({
        ...item,
        originalReference: item.reference,
        chantier: item.chantier || 'STOCK',
        id: Math.random().toString(36).substring(7)
      }));
    }

    console.log(`Extraction IA réussie : ${extractedItems.length} articles pour la facture ${extractedNumeroFacture} (${extractedFournisseur}) - Total HT: ${parsed.totalHT}€`);

    return NextResponse.json({ 
      success: true, 
      fournisseur: extractedFournisseur,
      numeroFacture: extractedNumeroFacture,
      dateFacture: parsed.dateFacture || null,
      totalHT: parsed.totalHT || null,
      totalTVA: parsed.totalTVA || null,
      totalTTC: parsed.totalTTC || null,
      dateEcheance: parsed.dateEcheance || null,
      modePaiement: parsed.modePaiement || null,
      items: extractedItems
    });
    
  } catch (error: any) {
    console.error('Erreur API parse facture:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la lecture du document : ' + (error?.message || error) 
    }, { status: 500 });
  }
}
