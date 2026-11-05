import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { parseInvoiceWithGemini } from '@/lib/gemini-factures';
import prisma from '@/lib/prisma';
import {
  construireIndexCatalogue,
  trouverArticleCatalogue,
} from '@/lib/article-matching';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    const parsed = await parseInvoiceWithGemini(base64Data, mimeType);

    const extractedFournisseur = parsed.fournisseur ? parsed.fournisseur.trim() : null;
    const extractedNumeroFacture = parsed.numeroFacture ? parsed.numeroFacture.trim() : null;

    const [tousArticles, tousAliases] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          reference: true,
          designation: true,
          codeBarre: true,
          fournisseur: true,
          referenceFournisseur: true,
        },
      }),
      prisma.referenceAlias.findMany(),
    ]);
    const indexCatalogue = construireIndexCatalogue(tousArticles, tousAliases);
    
    const extractedItems = (parsed.lignes || []).map((item) => {
      const match = trouverArticleCatalogue(indexCatalogue, {
        reference: item.reference,
        referenceFournisseur: item.reference,
        fournisseur: extractedFournisseur,
      }).article;
      return {
        ...item,
        reference: match ? match.reference : item.reference,
        originalReference: item.reference,
        chantier: item.chantier || 'STOCK',
        id: Math.random().toString(36).substring(7)
      };
    });

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

