import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function run() {
  const wb = xlsx.readFile('../Inventaire CE 2026.xlsx');
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  // Data starts at index 1 because index 0 is the headers mapping row
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any;
    if (!row['__EMPTY_2'] && !row['__EMPTY_1']) continue; // No designation and no reference
    
    let designation = (row['__EMPTY_2'] || '') + (row['__EMPTY_3'] ? ' ' + row['__EMPTY_3'] : '');
    designation = designation.trim();
    if (!designation) designation = "Article sans nom";

    let reference = row['__EMPTY_1'] ? String(row['__EMPTY_1']).trim() : '';
    if (!reference) {
      reference = crypto.randomUUID().split('-')[0].toUpperCase() + '-' + designation.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    
    const stock = parseInt(row['__EMPTY_5']) || parseInt(row['__EMPTY_4']) || 0;
    const prix = parseFloat(row['__EMPTY_6']) || 0;
    const fournisseur = row['__EMPTY'] ? String(row['__EMPTY']).trim() : null;
    
    try {
      await prisma.article.upsert({
        where: { reference: reference },
        update: {
            stockInitial: stock,
            prixUnitaire: prix,
            fournisseur: fournisseur,
            designation: designation,
        },
        create: {
          reference: reference,
          designation: designation,
          stockInitial: stock,
          prixUnitaire: prix,
          fournisseur: fournisseur,
          quantiteParBoite: 1,
          stockMinimum: 0,
        }
      });
      count++;
    } catch(e: any) {
      console.log('Erreur sur la ligne', i, reference, e.message);
    }
  }
  console.log(`Import terminé: ${count} articles insérés ou mis à jour.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
