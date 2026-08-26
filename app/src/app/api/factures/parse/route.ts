import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfModule = require('pdf-parse');
  
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer);
    return data.text || '';
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.text || '';
  } else if (pdfModule.default && typeof pdfModule.default === 'function') {
    const data = await pdfModule.default(buffer);
    return data.text || '';
  } else if (pdfModule.default?.PDFParse) {
    const parser = new pdfModule.default.PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.text || '';
  }
  throw new Error("Impossible d'initialiser le parseur PDF.");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = '';
    try {
      text = await extractTextFromPdf(buffer);
    } catch (pdfErr: any) {
      console.error("Erreur lors de l'extraction brute du PDF:", pdfErr);
      return NextResponse.json({ error: "Échec de lecture du fichier PDF: " + pdfErr.message }, { status: 500 });
    }

    let extractedItems: any[] = [];
    let extractedFournisseur: string | null = null;
    let extractedNumeroFacture: string | null = null;

    // Si la clé API Gemini est présente, on utilise l'IA pour extraire les données
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
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
Analyse cette facture (Rexel, Sonepar, YESSS Electrique, Balitran, etc.).
Extrais le nom du fournisseur, le numéro de facture et la liste complète de TOUS les articles facturés.
Pour chaque article:
- reference : La référence produit/fournisseur exacte (sans le tiret de séparation avec la désignation)
- designation : La description claire du produit
- quantite : Le nombre d'unités facturées
- prixUnitaire : Le prix unitaire NET HT facturé (après remise éventuelle, hors TVA et hors totaux globaux)

Ignore les frais de port, emballage, taxes/DEEE globales, TVA et totaux de bas de page.
Texte extrait de la facture :\n\n${text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        
        if (parsed.fournisseur) extractedFournisseur = parsed.fournisseur.trim();
        if (parsed.numeroFacture) extractedNumeroFacture = parsed.numeroFacture.trim();

        if (Array.isArray(parsed.lignes)) {
          extractedItems = parsed.lignes.map((item: any) => ({
            ...item,
            originalReference: item.reference,
            id: Math.random().toString(36).substring(7)
          }));
        }
        
        console.log(`Extraction via Gemini réussie : ${extractedItems.length} articles pour la facture ${extractedNumeroFacture} (${extractedFournisseur})`);
      } catch (aiError) {
        console.error("Erreur avec l'API Gemini, fallback sur regex :", aiError);
      }
    }

    // Fallback regex si l'IA n'a rien extrait
    if (extractedItems.length === 0) {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      
      for (const line of lines) {
        // Pattern standard et pattern type YESSS : Qté Réf - Désignation PrixBrut ... PrixNet Montant
        const yesssMatch = line.match(/^\s*(\d+(?:[.,]\d+)?)\s+([A-Za-z0-9\-_./]+)\s+-\s+(.*?)\s+([0-9]+[.,][0-9]{2})\s*€?\s*(?:\/\s*[^0-9]+)?\s+(?:\d+)?\s+([0-9]+[.,][0-9]{2})\s*€?/);
        if (yesssMatch) {
          const quantite = parseFloat(yesssMatch[1].replace(',', '.')) || 1;
          const reference = yesssMatch[2].trim();
          const designation = yesssMatch[3].trim();
          const prixNet = parseFloat(yesssMatch[5].replace(',', '.')) || 0;

          extractedItems.push({
            id: Math.random().toString(36).substring(7),
            reference,
            originalReference: reference,
            designation,
            quantite,
            prixUnitaire: prixNet
          });
          continue;
        }

        // Match générique
        const match = line.match(/(.*?)\s+(\d+(?:[.,]\d+)?)\s+([0-9]+[.,][0-9]{2})(?:\s+[0-9]+[.,][0-9]{2})?$/);
        if (match) {
          const descRef = match[1].trim();
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
      fournisseur: extractedFournisseur,
      numeroFacture: extractedNumeroFacture,
      items: extractedItems,
      textSample: text.substring(0, 500)
    });
    
  } catch (error: any) {
    console.error('Erreur API parse:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement : ' + (error?.message || error) }, { status: 500 });
  }
}
