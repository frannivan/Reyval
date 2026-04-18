const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RESETTING AND SEEDING DATABASE (v4.21 - Sync Edition) ---');

  // Limpiar antiguos si existen (opcional, pero ayuda a la salud de la DB)
  await prisma.mensaje.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.permission.deleteMany({});

  // 1. Roles
  const roles = [
    'ROLE_ADMIN',
    'ROLE_CLIENTE',
    'ROLE_VENDEDOR',
    'ROLE_RECEPCION',
    'ROLE_CONTABILIDAD',
    'ROLE_DIRECTIVO',
    'ROLE_SOPORTE'
  ];

  const roleMap = {};

  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap[roleName] = role.id;
  }

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // 2. Test Users
  const users = [
    { id: 'usr-admin', username: 'admin', email: 'admin@reyval.mx', role: 'ROLE_ADMIN' },
    { id: 'usr-vendedor', username: 'vendedor', email: 'vendedor@test.com', role: 'ROLE_VENDEDOR' },
    { id: 'usr-recepcion', username: 'recepcion', email: 'recepcion@test.com', role: 'ROLE_RECEPCION' },
    { id: 'usr-contabilidad', username: 'contabilidad', email: 'contabilidad@test.com', role: 'ROLE_CONTABILIDAD' },
    { id: 'usr-directivo', username: 'directivo', email: 'directivo@test.com', role: 'ROLE_DIRECTIVO' },
    { id: 'usr-soporte', username: 'soporte', email: 'soporte@test.com', role: 'ROLE_SOPORTE' },
    { id: 'usr-cliente', username: 'cliente', email: 'cliente@test.com', role: 'ROLE_CLIENTE' },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: { password: hashedPassword, roleId: roleMap[userData.role] },
      create: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        emailVerified: true,
        password: hashedPassword,
        roleId: roleMap[userData.role],
      },
    });
  }

  // 3. Default Permissions
  const defaultPermissions = [
    { role: 'ROLE_ADMIN', key: 'menu:admin_dashboard', enabled: true },
    { role: 'ROLE_ADMIN', key: 'menu:users', enabled: true },
    { role: 'ROLE_RECEPCION', key: 'section:pagos', enabled: true },
    { role: 'ROLE_RECEPCION', key: 'payments_history', enabled: true },
    { role: 'ROLE_CONTABILIDAD', key: 'menu:panel_contabilidad', enabled: true },
    { role: 'ROLE_CONTABILIDAD', key: 'action:pago:validate', enabled: true },
    { role: 'ROLE_CLIENTE', key: 'panel_cliente', enabled: true },
    { role: 'ROLE_CLIENTE', key: 'lot_details', enabled: true },
    { role: 'ROLE_CLIENTE', key: 'payments_history', enabled: true },
    { role: 'ROLE_CLIENTE', key: 'contract_details', enabled: true },
  ];

  for (const perm of defaultPermissions) {
    await prisma.permission.create({
      data: {
        roleName: perm.role,
        permissionKey: perm.key,
        enabled: perm.enabled
      }
    });
  }

  // 4. Dummy Messages
  console.log('--- SEEDING DUMMY MESSAGES ---');
  
  const vendedorUser = await prisma.user.findUnique({ where: { username: 'vendedor' } });
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  const recepcionUser = await prisma.user.findUnique({ where: { username: 'recepcion' } });

  const ticket = await prisma.ticket.create({
    data: {
      titulo: 'Actualización y Verificación de Lotes',
      descripcion: 'Conversación migrada de CasaVida sobre disponibilidad y pagos.',
      estatus: 'ABIERTO',
      prioridad: 'ALTA',
      userId: vendedorUser.id
    }
  });

  const dummyMessages = [
    { userId: vendedorUser.id, contenido: 'Hola Admin, quería comentarte que el lote A001 ya fue visitado por el cliente.' },
    { userId: adminUser.id, contenido: 'Perfecto, gracias por el aviso. ¿El cliente mostró interés en otros lotes?' },
    { userId: recepcionUser.id, contenido: 'El pago del mes de enero del cliente Francisco está pendiente de verificación.' },
  ];

  for (const msg of dummyMessages) {
    await prisma.mensaje.create({
      data: {
        ticketId: ticket.id,
        userId: msg.userId,
        contenido: msg.contenido,
        createdAt: new Date()
      }
    });
  }

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
