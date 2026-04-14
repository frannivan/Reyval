const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING LEADS & OPPORTUNITIES ---');

  // Get first available lote for opportunity assignment
  const lotes = await prisma.lote.findMany({ where: { estatus: 'DISPONIBLE' }, take: 2 });

  // Seed Leads
  const lead1 = await prisma.lead.create({
    data: {
      nombre: 'María García López',
      email: 'maria.garcia@gmail.com',
      telefono: '951-234-5678',
      mensaje: 'Me interesa un lote en Valle Dorado con vista al mar',
      source: 'WEB',
      interes: 'COTIZACION',
      status: 'NEW',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      nombre: 'Carlos Hernández Ruiz',
      email: 'carlos.hdz@hotmail.com',
      telefono: '951-876-5432',
      mensaje: 'Busco terreno para invertir, presupuesto de 200k',
      source: 'WEB',
      interes: 'REPRESENTANTE',
      status: 'CONTACTED',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      nombre: 'Ana Sofía Méndez',
      email: 'ana.mendez@outlook.com',
      telefono: '951-111-2222',
      mensaje: 'Quiero información sobre planes de financiamiento',
      source: 'CHATBOT',
      interes: 'COTIZACION',
      status: 'NEW',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      nombre: 'Roberto Jiménez Flores',
      email: 'rjimenez@empresa.mx',
      telefono: '951-333-4444',
      mensaje: 'Interesado en compra de varios lotes para desarrollo',
      source: 'WEB',
      interes: 'REPRESENTANTE',
      status: 'CONTACTED',
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      nombre: 'Patricia Vega Morales',
      email: 'pvega@gmail.com',
      telefono: '951-555-6666',
      source: 'CHATBOT',
      interes: 'COTIZACION',
      status: 'CONVERTED',
    },
  });

  console.log(`Created ${5} leads`);

  // Seed Opportunities from contacted/converted leads
  if (lotes.length >= 1) {
    await prisma.opportunity.create({
      data: {
        leadId: lead2.id,
        loteId: lotes[0].id,
        status: 'OPEN',
        notas: 'Cliente muy interesado, agenda visita para el viernes.',
        montoEstimado: 155000,
      },
    });
  }

  if (lotes.length >= 2) {
    await prisma.opportunity.create({
      data: {
        leadId: lead4.id,
        loteId: lotes[1].id,
        status: 'OPEN',
        notas: 'Representante de empresa, quiere negociar precio por volumen.',
        montoEstimado: 300000,
      },
    });
  }

  await prisma.opportunity.create({
    data: {
      leadId: lead5.id,
      loteId: lotes[0]?.id || null,
      status: 'WON',
      notas: 'Convertido a cliente, contrato en proceso.',
      montoEstimado: 170000,
    },
  });

  console.log('Created 3 opportunities');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
