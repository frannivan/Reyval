const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING DATABASE ---');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ROLE_ADMIN' },
    update: {},
    create: { name: 'ROLE_ADMIN' },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'usr-1',
      username: 'admin',
      email: 'admin@reyval.mx',
      emailVerified: true,
      roleId: adminRole.id,
    },
  });

  const fracc = await prisma.fraccionamiento.create({
    data: {
      nombre: 'Valle Dorado',
      ubicacion: 'Norte',
      descripcion: 'Fraccionamiento premium',
    },
  });

  await prisma.lote.createMany({
    data: [
      {
        numeroLote: 'L-01',
        manzana: 'A',
        precioTotal: 150000.00,
        areaMetrosCuadrados: 120.5,
        estatus: 'DISPONIBLE',
        fraccionamientoId: fracc.id,
      },
      {
        numeroLote: 'L-02',
        manzana: 'A',
        precioTotal: 155000.00,
        areaMetrosCuadrados: 125.0,
        estatus: 'DISPONIBLE',
        fraccionamientoId: fracc.id,
      },
      {
        numeroLote: 'L-03',
        manzana: 'B',
        precioTotal: 170000.00,
        areaMetrosCuadrados: 150.0,
        estatus: 'APARTADO',
        fraccionamientoId: fracc.id,
      },
      {
        numeroLote: 'L-04',
        manzana: 'B',
        precioTotal: 250000.00,
        areaMetrosCuadrados: 200.0,
        estatus: 'VENDIDO',
        fraccionamientoId: fracc.id,
      },
    ]
  });

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
