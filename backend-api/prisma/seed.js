const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING DATABASE ---');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ROLE_ADMIN' },
    update: {},
    create: { name: 'ROLE_ADMIN' },
  });

  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedAdminPassword
    },
    create: {
      id: 'usr-1',
      username: 'admin',
      email: 'admin@reyval.mx',
      emailVerified: true,
      roleId: adminRole.id,
      password: hashedAdminPassword
    },
  });

  // Limpiar datos antiguos para evitar basura acumulada
  await prisma.lote.deleteMany({});
  await prisma.fraccionamiento.deleteMany({});

  const fracc = await prisma.fraccionamiento.upsert({
    where: { id: 1 },
    update: {
      nombre: 'Valle Dorado',
      ubicacion: 'Norte',
      descripcion: 'Fraccionamiento premium',
    },
    create: {
      id: 1,
      nombre: 'Valle Dorado',
      ubicacion: 'Norte',
      descripcion: 'Fraccionamiento premium',
    },
  });

  await prisma.lote.createMany({
    data: [
      {
        id: 1,
        numeroLote: 'L-01',
        manzana: 'A',
        precioTotal: 150000.00,
        areaMetrosCuadrados: 120.5,
        estatus: 'DISPONIBLE',
        fraccionamientoId: fracc.id,
      },
      {
        id: 2,
        numeroLote: 'L-02',
        manzana: 'A',
        precioTotal: 155000.00,
        areaMetrosCuadrados: 125.0,
        estatus: 'DISPONIBLE',
        fraccionamientoId: fracc.id,
      },
      {
        id: 3,
        numeroLote: 'L-03',
        manzana: 'B',
        precioTotal: 170000.00,
        areaMetrosCuadrados: 150.0,
        estatus: 'APARTADO',
        fraccionamientoId: fracc.id,
      },
      {
        id: 4,
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
