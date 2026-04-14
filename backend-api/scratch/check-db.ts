import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fraccionamientos = await prisma.fraccionamiento.findMany();
  console.log('--- FRACCIONAMIENTOS ---');
  console.log(JSON.stringify(fraccionamientos, null, 2));

  const lotes = await prisma.lote.findMany({
    include: { fraccionamiento: true }
  });
  console.log('--- LOTES ---');
  console.log(JSON.stringify(lotes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
