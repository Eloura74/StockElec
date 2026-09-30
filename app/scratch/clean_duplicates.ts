import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

function isGeneratedRef(ref: string) {
    return /^[A-Z0-9]{8}-[A-Z0-9]+$/.test(ref);
}

async function run() {
  const articles = await prisma.article.findMany({
    include: {
        mouvements: true
    }
  });

  const nameMap = new Map<string, typeof articles>();

  for (const a of articles) {
    const key = a.designation.toLowerCase().trim();
    if (!nameMap.has(key)) {
        nameMap.set(key, []);
    }
    nameMap.get(key)!.push(a);
  }

  let deletedCount = 0;
  let reassignedMouvements = 0;

  for (const [name, list] of nameMap.entries()) {
    if (list.length > 1) {
        // Sort to find the best one to keep
        list.sort((a, b) => {
            // 1. Prefer item WITH mouvements
            if (a.mouvements.length > 0 && b.mouvements.length === 0) return -1;
            if (b.mouvements.length > 0 && a.mouvements.length === 0) return 1;

            // 2. Prefer item with a "real" reference
            const aGen = isGeneratedRef(a.reference);
            const bGen = isGeneratedRef(b.reference);
            if (!aGen && bGen) return -1;
            if (aGen && !bGen) return 1;

            // 3. Prefer the oldest item
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const kept = list[0];
        const duplicates = list.slice(1);

        for (const dup of duplicates) {
            if (dup.mouvements.length > 0) {
                // Reassign mouvements to the kept item
                await prisma.mouvement.updateMany({
                    where: { articleId: dup.id },
                    data: { articleId: kept.id }
                });
                reassignedMouvements += dup.mouvements.length;
            }
            
            // Delete the duplicate
            await prisma.article.delete({
                where: { id: dup.id }
            });
            deletedCount++;
        }
        console.log(`Résolu: ${name} (gardé ref: ${kept.reference}, supprimé ${duplicates.length} doublons)`);
    }
  }

  console.log(`\nNettoyage terminé.`);
  console.log(`- ${deletedCount} articles en doublon supprimés.`);
  console.log(`- ${reassignedMouvements} mouvements réassignés au bon article.`);
}

run().finally(() => prisma.$disconnect());
