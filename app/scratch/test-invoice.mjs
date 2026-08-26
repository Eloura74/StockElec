import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const sampleText = `YESSS ELECTRIQUE GRIMAUD
Z.A. du grand Pont, 83310 Grimaud
Facture 061-007-000233
CEDRIC ELEC SARL ASSOCIE UNIQUE
788 ROUTE DES GUIOLS 83310 LA MOLE
Date 31/07/2026

Qté Référence - Désignation Prix Brut Remise Prix Net Montant
BL : 061-002-000092 / DATE : 01/07/2026 / REF CLIENT : SCI PELICAN
 1 91002 - LC-Click-N 200-BL 68.41 € / 1 Piece 40 41.05 € 41.09 €
BL : 061-002-000134 / DATE : 01/07/2026 / REF CLIENT : ss
 1 SU2-BASIC-G - Clavier 2 relais, 60 codes ,touches plas 199.67 € / 1 Pièce 63 73.88 € 73.88 €
BL : 061-002-000208 / DATE : 02/07/2026 / REF CLIENT : TCHERAZ
 1 S7000 - Acc. C. Clav. S7000 148.50 € / 1 Piece 50 74.25 € 74.35 €
BL : 061-002-000209 / DATE : 02/07/2026 / REF CLIENT : CASSIOPEE
 1 GD213A - Coffret Gamma+ 13, 2 rangées, 26 M 90.60 € / 1 Piece 60 36.24 € 36.24 €
 1 CDC863F - Inter dif 3P+N 63A 30mA AC BD 615.24 € / 1 Piece 70 184.57 € 184.57 €
 1 CDC840F - Inter dif 3P+N 40A 30mA AC BD 372.32 € / 1 Piece 70 111.70 € 111.70 €
 1 KBN863A - Barres pontage 3P+N 63A 12 mod 37.26 € / 1 Piece 57 16.02 € 16.02 €
`;

async function testInvoiceParsing() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const responseSchema = {
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

  const prompt = `Tu es un assistant spécialisé dans l'analyse de factures de matériel électrique (ex: Rexel, Sonepar, YESSS Electrique, etc.).
Extrais le nom du fournisseur, le numéro de facture et la liste de TOUS les articles facturés.
Pour chaque article:
- reference : La référence produit/fournisseur exacte (sans le tiret de séparation avec la désignation)
- designation : La description de l'article
- quantite : Le nombre d'unités
- prixUnitaire : Le prix unitaire NET HT facturé (après remise, avant TVA)

Ignore les totaux, TVA, frais de port/DEEE ou lignes d'adresse/BL.
Texte de la facture :

${sampleText}`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

testInvoiceParsing();
