
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function repair() {
  console.log('--- Identiy System Unification v4.6.2 (Orphan Fix) ---');

  // 1. Ensure ROLE_CLIENTE exists
  let roleCliente = await prisma.role.findUnique({ where: { name: 'ROLE_CLIENTE' } });
  if (!roleCliente) {
    roleCliente = await prisma.role.create({ data: { name: 'ROLE_CLIENTE' } });
    console.log('Created ROLE_CLIENTE');
  }

  // 2. Clear ROLE_USER if still exists
  const roleUser = await prisma.role.findUnique({ where: { name: 'ROLE_USER' } });
  if (roleUser) {
    await prisma.user.updateMany({
      where: { roleId: roleUser.id },
      data: { roleId: roleCliente.id }
    });
    await prisma.role.delete({ where: { id: roleUser.id } });
    console.log('Deleted legacy ROLE_USER entry');
  }

  // 3. Fix Orphan Users (roleId is null)
  const orphanUsers = await prisma.user.updateMany({
    where: { roleId: null },
    data: { roleId: roleCliente.id }
  });
  console.log(`Updated ${orphanUsers.count} orphan users to ROLE_CLIENTE`);

  // 4. Link existing Clientes to Users by email
  const clientes = await prisma.cliente.findMany({ where: { userId: null } });
  for (const cliente of clientes) {
    if (!cliente.email) continue;
    const user = await prisma.user.findUnique({ where: { email: cliente.email } });
    if (user) {
      await prisma.cliente.update({ where: { id: cliente.id }, data: { userId: user.id } });
    }
  }

  console.log('--- Unification Complete ---');
}

repair()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
