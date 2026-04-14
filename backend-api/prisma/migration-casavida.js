const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { Decimal } = require('decimal.js');

const prisma = new PrismaClient();
const sqlPath = path.join(__dirname, '../../../CasaVida/backend/src/main/resources/data.sql');

// Parser de filas CSV que respeta valores entre comillas simples y campos opcionales
function parseRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  // Quitar paréntesis exteriores si los tiene
  const str = row.trim().replace(/^\(|\)$/g, '');
  while (i < str.length) {
    const ch = str[i];
    if (ch === "'" && str[i - 1] !== '\\') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^'|'$/g, ''));
      current = '';
      i++;
      continue;
    } else {
      current += ch;
    }
    i++;
  }
  result.push(current.trim().replace(/^'|'$/g, ''));
  return result;
}

// Función para calcular amortización francesa (copia de AmortizationService)
function generateAmortizationPlan(montoTotal, enganche, plazoMeses, tasaAnual, fechaInicio) {
  const P = new Decimal(montoTotal).sub(new Decimal(enganche));
  const n = plazoMeses;
  const i = new Decimal(tasaAnual).div(1200);

  const onePlusI = new Decimal(1).add(i);
  const pow = onePlusI.pow(n);
  const cuotaMensual = P.mul(i).mul(pow).div(pow.sub(1)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const plan = [];
  let fecha = new Date(fechaInicio);
  
  for (let k = 1; k <= n; k++) {
    fecha.setMonth(fecha.getMonth() + 1);
    plan.push({
      numeroPago: k,
      fechaVencimiento: new Date(fecha),
      monto: cuotaMensual.toNumber(),
      estatus: 'PENDIENTE'
    });
  }
  return plan;
}

async function migrate() {
  console.log('--- STARTING COMPREHENSIVE MIGRATION FROM CASAVIDA ---');

  if (!fs.existsSync(sqlPath)) {
    console.error('ERROR: data.sql not found');
    return;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('Cleaning existing data (Nuclear)...');
  await prisma.planPago.deleteMany({});
  await prisma.pago.deleteMany({});
  await prisma.contrato.deleteMany({});
  await prisma.interaccion.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.loteImagen.deleteMany({});
  await prisma.lote.deleteMany({});
  await prisma.fraccionamientoImagen.deleteMany({});
  await prisma.fraccionamiento.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({}); // Añadido: Limpiar roles para evitar conflictos de ID
  await prisma.permission.deleteMany({});

  // 1. ROLES
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
    await prisma.role.create({
      data: { id: role.id, name: role.name },
    });
  }

  // 2. USERS & ACCOUNTS (Auth)
  console.log('Migrating Users...');
  const userMatches = sqlContent.matchAll(/MERGE INTO USERS .*? VALUES\s*\n?([\s\S]*?);/g);
  for (const match of userMatches) {
    const rowsRaw = match[1].trim().split(/\),\s*\n?\s*\(/);
    for (const row of rowsRaw) {
      const parts = parseRow(row);
      const id = parts[0];
      const username = parts[1];
      const email = parts[2];
      const password = parts[3];
      const roleId = parseInt(parts[4]);

      await prisma.user.create({
        data: {
          id,
          username,
          email,
          emailVerified: true,
          roleId,
          accounts: {
            create: {
              id: `acc_${id}`,
              accountId: id,
              providerId: 'credentials',
              password: password,
            }
          }
        }
      });
    }
  }

  // 3. FRACCIONAMIENTOS
  console.log('Migrating Fraccionamientos...');
  const fraccMatches = sqlContent.matchAll(/MERGE INTO fraccionamientos .*? VALUES\s*\n?([\s\S]*?);/g);
  for (const match of fraccMatches) {
    const rowsRaw = match[1].trim().split(/\),\s*\n?\s*\(/);
    for (const row of rowsRaw) {
      const parts = parseRow(row);
      await prisma.fraccionamiento.create({
        data: {
          id: parseInt(parts[0]),
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

  // 4. LOTES
  console.log('Migrating Lotes...');
  const lotesMatches = sqlContent.matchAll(/MERGE INTO lotes .*? VALUES\s*\n?([\s\S]*?);/g);
  for (const match of lotesMatches) {
    const rowsRaw = match[1].trim().split(/\),\s*\n?\s*\(/);
    for (const row of rowsRaw) {
      const parts = parseRow(row);
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

  // 5. CLIENTES
  console.log('Migrating Clientes...');
  const clienteMatches = sqlContent.matchAll(/MERGE INTO clientes .*? VALUES\s*\n?([\s\S]*?);/g);
  for (const match of clienteMatches) {
    const rowsRaw = match[1].trim().split(/\),\s*\n?\s*\(/);
    for (const row of rowsRaw) {
      const parts = parseRow(row);
      await prisma.cliente.create({
        data: {
          id: parseInt(parts[0]),
          nombre: parts[1],
          apellidoPaterno: parts[2],
          email: parts[3],
          telefono: parts[4],
          domicilio: parts[5],
          rfc: parts[6],
          fechaRegistro: new Date(),
        }
      });
    }
  }

  // 6. PERMISSIONS
  console.log('Migrating Permissions...');
  const permSeedMatches = sqlContent.matchAll(/INSERT INTO role_permissions_default .*? VALUES\s*\n?([\s\S]*?);/g);
  for (const match of permSeedMatches) {
     const rowsRaw = match[1].trim().split(/\),\s*\n?\s*\(/);
     for (const row of rowsRaw) {
       const parts = parseRow(row);
       await prisma.permission.create({
         data: {
           roleName: parts[0],
           permissionKey: parts[1],
           enabled: parts[2] === 'true'
         }
       });
     }
  }

  // 7. INITIAL CONTRACTS (If not in SQL, we seed some based on Lote status VENDIDO)
  console.log('Generating sample contracts for VENDIDO lots...');
  const soldLots = await prisma.lote.findMany({ where: { estatus: 'VENDIDO' } });
  for (const [index, lote] of soldLots.entries()) {
    const clienteId = (index % 2) + 1; // Alternar entre cliente 1 y 2
    const fechaContrato = new Date('2025-01-10'); // Hace unos meses para probar mora
    
    const montoTotal = lote.precioTotal;
    const enganche = new Decimal(montoTotal).mul(0.1).toNumber();
    const plazoMeses = 12;
    const tasaAnual = 12.0;
    
    const plan = generateAmortizationPlan(montoTotal, enganche, plazoMeses, tasaAnual, fechaContrato);
    const mensualidad = plan[0].monto;

    await prisma.contrato.create({
      data: {
        id: index + 100,
        clienteId,
        loteId: lote.id,
        vendedorId: "2", // Vendedor predeterminado
        fechaContrato,
        montoTotal,
        enganche,
        plazoMeses,
        tasaInteresAnual: tasaAnual,
        mensualidad,
        estatus: 'ACTIVO',
        planPagos: {
           createMany: {
              data: plan
           }
        }
      }
    });
  }

  console.log('--- COMPREHENSIVE MIGRATION COMPLETED ---');
}

migrate()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
