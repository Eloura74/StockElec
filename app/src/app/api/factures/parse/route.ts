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
        lignes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              reference: { type: SchemaType.STRING },
              designation: { type: SchemaType.STRING },
              quantite: { type: SchemaType.NUMBER },
              prixUnitaire: { type: SchemaType.NUMBER },
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

    const prompt = `Tu es un assistant expert en facturation de matériel électrique pour artisans et électriciens.
Analyse cette facture PDF complète (Rexel, Sonepar, YESSS Electrique, Balitran, etc.).
Extrais le nom du fournisseur, le numéro de facture et la liste complète de TOUS les articles facturés (sur toutes les pages).

Pour chaque article facturé :
- reference : La référence produit ou référence catalogue exacte (sans tiret ni espace inutile)
- designation : La désignation / description précise du produit
- quantite : La quantité facturée (nombre entier ou décimal)
- prixUnitaire : Le prix unitaire NET HT facturé (après application des remises éventuelles de la ligne, hors TVA et hors frais de port globaux)

Consignes strictes :
- Ignore les totaux généraux de facture, la TVA, les frais de livraison, les DEEE globales et les blocs d'adresses ou numéros de BL.
- Sois exhaustif : extrait chaque ligne d'article de chaque page du document.`;

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
        id: Math.random().toString(36).substring(7)
      }));
    }

    console.log(`Extraction IA réussie : ${extractedItems.length} articles pour la facture ${extractedNumeroFacture} (${extractedFournisseur})`);

    return NextResponse.json({ 
      success: true, 
      fournisseur: extractedFournisseur,
      numeroFacture: extractedNumeroFacture,
      items: extractedItems
    });
    
  } catch (error: any) {
    console.error('Erreur API parse facture:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la lecture du document : ' + (error?.message || error) 
    }, { status: 500 });
  }
}
