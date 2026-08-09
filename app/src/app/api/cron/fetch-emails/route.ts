import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');
import { PrismaClient } from '@prisma/client';
import { saveFactureAndCheckPrices } from '@/app/actions/factures';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // Vérification de sécurité optionnelle pour Cron (ex: Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD || !process.env.IMAP_HOST) {
    return NextResponse.json({ error: 'Configuration IMAP manquante' }, { status: 500 });
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASSWORD
    },
    logger: false
  });

  try {
    await client.connect();
    
    // Ouvrir la boîte de réception
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Rechercher les messages non lus
      const messages = client.fetch({ seen: false }, { source: true, uid: true });
      let processedCount = 0;

      for await (const message of messages) {
        try {
          if (!message.source) continue;
          
          const parsedMail = await simpleParser(message.source as Buffer);
          
          // Chercher une pièce jointe PDF
          const pdfAttachment = parsedMail.attachments?.find((att: any) => att.contentType === 'application/pdf');
          
          if (pdfAttachment && pdfAttachment.content) {
            console.log(`Traitement du PDF : ${pdfAttachment.filename} (Email UID: ${message.uid})`);
            
            // 1. Extraire le texte du PDF
            const data = await pdf(pdfAttachment.content);
            const text = data.text;

            // 2. Extraire les données avec Gemini
            if (!process.env.GEMINI_API_KEY) {
              console.warn("Pas de GEMINI_API_KEY, impossible de lire la facture automatiquement.");
              continue; // On passe au suivant
            }

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
              model: "gemini-2.5-flash",
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
              }
            });

            const prompt = `Analyse cette facture.
Trouve le nom du fournisseur et le numéro de facture.
Extrait la liste des articles facturés. Ignore les frais de livraison et la TVA.
Texte de la facture :\n\n${text}`;

            const result = await model.generateContent(prompt);
            const invoiceData = JSON.parse(result.response.text());

            if (!invoiceData.fournisseur || !invoiceData.numeroFacture || !invoiceData.lignes || invoiceData.lignes.length === 0) {
              console.log("Données incomplètes trouvées par Gemini.");
              continue;
            }

            // Normalisation
            const fournisseur = invoiceData.fournisseur.trim();
            const numeroFacture = invoiceData.numeroFacture.trim();
            const items = invoiceData.lignes.map((item: any) => ({
              ...item,
              originalReference: item.reference,
              id: Math.random().toString(36).substring(7)
            }));

            // 3. Anti-doublon : vérifier si cette facture existe déjà
            const existingFacture = await prisma.factureFournisseur.findFirst({
              where: {
                fournisseur: fournisseur,
                numeroFacture: numeroFacture
              }
            });

            if (existingFacture) {
              console.log(`La facture ${numeroFacture} de ${fournisseur} existe déjà. Ignorée.`);
            } else {
              // 4. Enregistrer la facture
              await saveFactureAndCheckPrices(fournisseur, numeroFacture, items);
              console.log(`Facture ${numeroFacture} enregistrée avec succès.`);
              processedCount++;
            }
          }
          
          // Marquer l'e-mail comme lu
          await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen'], { uid: true });

        } catch (msgErr) {
          console.error(`Erreur sur le message ${message.uid}`, msgErr);
        }
      }
      return NextResponse.json({ success: true, processed: processedCount });
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("Erreur IMAP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.logout();
  }
}
