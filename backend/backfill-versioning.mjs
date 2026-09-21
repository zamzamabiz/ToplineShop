import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const files = await prisma.tdrSourceFile.findMany({ where: { logicalDatasetId: null } });
  console.log('Files to backfill:', files.length);
  for (const f of files) {
    await prisma.tdrSourceFile.update({
      where: { id: f.id },
      data: { logicalDatasetId: f.id, versionNumber: 1 },
    });
    console.log('Backfilled:', f.id);
  }
  console.log('Backfill complete');
}
main().catch(console.error).finally(() => prisma.$disconnect());
