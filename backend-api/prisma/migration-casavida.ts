import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const sqlPath = path.join(__dirname, '../../../../CasaVida/backend/src/main/resources/data.sql');

async function migrate() {
  console.log('--- STARTING MIGRATION FROM CASAVIDA ---');

  if (!fs.existsSync(sqlPath)) {
    console.error('ERROR: data.sql not found at', sqlPath);
    return;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // 1. CLEAR DUMMY DATA (Optional but recommended for a clean migration)
  console.log('Cleaning existing data...');
  await prisma.permission.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.pago.deleteMany({});
  await prisma.contrato.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.lote.deleteMany({});
  await prisma.fraccionamiento.deleteMany({});

  // 2. MIGRATE ROLES
  console.log('Migrating Roles...');
  const roles = [
    { id: 1, name: 'ROLE_USER' },
    { id: 2, name: 'ROLE_ADMIN' },
    { id: 3, name: 'ROLE_VENDEDOR' },
    { id: 4, name: 'ROLE_RECEPCION' },
    { id: 5, name: 'ROLE_CONTABILIDAD' },
    { id: 6, name: 'ROLE_DIRECTIVO' },
    { id: 7, name: 'ROLE_SOPORTE' },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 3. MIGRATE FRACCIONAMIENTOS
  console.log('Migrating Fraccionamientos...');
  const fraccMatches = sqlContent.matchAll(/MERGE INTO fraccionamientos .*? VALUES\s*\((.*?)\);/gs);
  for (const match of fraccMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      const id = parseInt(parts[0]);
      await prisma.fraccionamiento.create({
        data: {
          id,
          nombre: parts[1],
          ubicacion: parts[2],
          descripcion: parts[3],
          logoUrl: parts[4],
          coordenadasGeo: parts[5],
          poligonoDelimitador: parts[6],
        }
      });
    }
  }

  // 4. MIGRATE LOTES
  console.log('Migrating Lotes...');
  const lotesMatches = sqlContent.matchAll(/MERGE INTO lotes .*? VALUES\s*\((.*?)\);/gs);
  for (const match of lotesMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      await prisma.lote.create({
        data: {
          id: parseInt(parts[0]),
          numeroLote: parts[1],
          manzana: parts[2],
          precioTotal: parseFloat(parts[3]),
          areaMetrosCuadrados: parseFloat(parts[4]),
          coordenadasGeo: parts[5],
          estatus: parts[6],
          fraccionamientoId: parseInt(parts[7]),
          planoCoordinates: parts[8],
        }
      });
    }
  }

  // 5. MIGRATE CLIENTES
  console.log('Migrating Clientes...');
  const clienteMatches = sqlContent.matchAll(/MERGE INTO clientes .*? VALUES\s*\((.*?)\);/gs);
  for (const match of clienteMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      await prisma.cliente.create({
        data: {
          id: parseInt(parts[0]),
          nombre: parts[1],
          apellidoPaterno: parts[2], // Map 'apellidos' to 'apellidoPaterno'
          email: parts[3],
          telefono: parts[4],
          domicilio: parts[5],
          rfc: parts[6], // Key 'ine' in SQL -> 'rfc' in Prisma (guessed from intent)
          fechaRegistro: new Date(),
        }
      });
    }
  }

  // 6. MIGRATE LEADS
  console.log('Migrating Leads...');
  const leadMatches = sqlContent.matchAll(/MERGE INTO leads .*? VALUES\s*\((.*?)\);/gs);
  for (const match of leadMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      await prisma.lead.create({
        data: {
          id: parseInt(parts[0]),
          nombre: parts[1],
          email: parts[2],
          telefono: parts[3],
          mensaje: parts[4],
          source: parts[5],
          interes: parts[6],
          status: parts[7],
          fechaRegistro: new Date(),
        }
      });
    }
  }

  // 7. MIGRATE OPPORTUNITIES
  console.log('Migrating Opportunities...');
  const oppMatches = sqlContent.matchAll(/MERGE INTO opportunities .*? VALUES\s*\((.*?)\);/gs);
  for (const match of oppMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      await prisma.opportunity.create({
        data: {
          id: parseInt(parts[0]),
          leadId: parseInt(parts[1]),
          loteId: parts[2] === 'NULL' ? null : parseInt(parts[2]),
          status: parts[4], // Match index 4 as status (monto_estimado is 3)
          notas: parts[5],
        }
      });
    }
  }

  // 8. MIGRATE PERMISSIONS
  console.log('Migrating Permissions...');
  const permMatches = sqlContent.matchAll(/INSERT INTO role_permissions_default .*? VALUES\s*\((.*?)\);/gs);
  for (const match of permMatches) {
    const rows = match[1].split(/\),\s*\(/);
    for (const row of rows) {
      const parts = row.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      await prisma.permission.create({
        data: {
          roleName: parts[0],
          permissionKey: parts[1],
          enabled: parts[2] === 'true',
        }
      });
    }
  }

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
