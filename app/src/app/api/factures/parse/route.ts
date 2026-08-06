import { NextResponse } from 'next/server';

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

    // Analyse ultra basique avec expressions régulières.
    // L'idée est de trouver des lignes qui ressemblent à: REF DESIGNATION QTE PRIX
    // Ce regex est très simpliste et dépend du format réel du fournisseur.
    const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
    
    const extractedItems: any[] = [];
    
    // Exemple d'heuristique simpliste :
    // On cherche une ligne contenant des nombres avec virgule.
    
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
          designation: designation || descRef,
          quantite: quantite,
          prixUnitaire: parseFloat(match[3].replace(',', '.'))
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      textSample: lines.slice(0, 10).join('\n'), // pour debug
      items: extractedItems,
      rawText: text
    });
    
  } catch (error) {
    console.error('Erreur PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la lecture du PDF' }, { status: 500 });
  }
}
