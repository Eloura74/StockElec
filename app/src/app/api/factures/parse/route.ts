import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse');
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdf(buffer);
    const text = data.text;

    let extractedItems: any[] = [];

    // Si la clé API Gemini est présente, on utilise l'IA pour extraire les données
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const responseSchema: Schema = {
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
          },
        };

        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });

        const prompt = `Extrait la liste des articles facturés depuis ce texte de facture.
        Ignore les frais de port, de livraison, les totaux, la TVA.
        Pour chaque article, renvoie la référence, la désignation, la quantité et le prix unitaire.
        Texte de la facture :\n\n${text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const items = JSON.parse(responseText);
        
        extractedItems = items.map((item: any) => ({
          ...item,
          originalReference: item.reference,
          id: Math.random().toString(36).substring(7)
        }));
        
        console.log("Extraction via Gemini réussie :", extractedItems.length, "articles");
      } catch (aiError) {
        console.error("Erreur avec l'API Gemini, fallback sur regex :", aiError);
        // Si l'IA échoue, on continue et on utilise le fallback
      }
    }

    // Fallback: Analyse ultra basique avec expressions régulières.
    if (extractedItems.length === 0) {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      
      for (const line of lines) {
        // Cherche une ligne avec (Texte) (Nombre/Qté) (Prix unitaire) (Prix total optionnel)
        // Ex: LFF6015009016 GOUL LIFEA 60X150 PURE 10 15,00 150,00
        // Ou: 152010 ENOLA B SPOT 1 NOIR 2 45.50
        const match = line.match(/(.*?)\s+(\d+(?:[.,]\d+)?)\s+([0-9]+[.,][0-9]{2})(?:\s+[0-9]+[.,][0-9]{2})?$/);
        if (match) {
          const descRef = match[1].trim();
          // Essayer d'extraire la référence (souvent le premier mot)
          const parts = descRef.split(' ');
          const reference = parts[0];
          const designation = parts.slice(1).join(' ');
          
          let quantite = parseFloat(match[2].replace(',', '.'));
          if (isNaN(quantite)) quantite = 1;

          extractedItems.push({
            id: Math.random().toString(36).substring(7),
            reference: reference || 'REF_INCONNUE',
            originalReference: reference || 'REF_INCONNUE',
            designation: designation || descRef,
            quantite: quantite,
            prixUnitaire: parseFloat(match[3].replace(',', '.'))
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      textSample: text.substring(0, 500), // pour debug
      items: extractedItems,
      rawText: text
    });
    
  } catch (error) {
    console.error('Erreur PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la lecture du PDF' }, { status: 500 });
  }
}
