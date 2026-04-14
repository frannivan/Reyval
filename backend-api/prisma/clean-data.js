const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanData() {
  console.log('--- DB CLEANUP STARTED ---');
  
  try {
    // 1. Borrar pagos (tienen relación con contrato)
    const pagosDeleted = await prisma.pago.deleteMany({});
    console.log(`Deleted ${pagosDeleted.count} payments.`);

    // 2. Borrar contratos
    const contratosDeleted = await prisma.contrato.deleteMany({});
    console.log(`Deleted ${contratosDeleted.count} contracts.`);

    // 3. Resetear estatus de lotes a DISPONIBLE
    const lotesUpdated = await prisma.lote.updateMany({
      data: { estatus: 'DISPONIBLE' }
    });
    console.log(`Reset ${lotesUpdated.count} lots to DISPONIBLE.`);

    console.log('--- DB CLEANUP COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
