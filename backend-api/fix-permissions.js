
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  console.log('--- Fixing Permissions for ROLE_CLIENTE ---');
  
  const role = await prisma.role.findUnique({ where: { name: 'ROLE_CLIENTE' } });
  if (!role) {
    console.error('ROLE_CLIENTE not found. Please run repair-identity.js first.');
    return;
  }

  const clientPermissions = [
    'menu:home',
    'menu:profile',
    'menu:panel_cliente',
    'menu:payments_history',
    'menu:contract_details',
    'menu:lot_details',
    'menu:mensajes'
  ];

  for (const key of clientPermissions) {
    const existing = await prisma.permission.findFirst({
      where: { roleName: 'ROLE_CLIENTE', permissionKey: key }
    });

    if (existing) {
      await prisma.permission.update({
        where: { id: existing.id },
        data: { enabled: true }
      });
      console.log(`Updated ${key} for ROLE_CLIENTE`);
    } else {
      await prisma.permission.create({
        data: { roleName: 'ROLE_CLIENTE', permissionKey: key, enabled: true }
      });
      console.log(`Created ${key} for ROLE_CLIENTE`);
    }
  }

  console.log('--- Permissions Updated ---');
}

fixPermissions()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
