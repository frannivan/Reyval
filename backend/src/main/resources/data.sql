-- FINAL ATTEMPT AT DATA INITIALIZATION (Nuclear Cleanup & Fresh Setup)

-- Disable integrity checks to allow clean slate
SET REFERENTIAL_INTEGRITY FALSE;

-- 1. Roles
MERGE INTO roles (id, name) KEY (id) VALUES (1, 'ROLE_USER');
MERGE INTO roles (id, name) KEY (id) VALUES (2, 'ROLE_ADMIN');
MERGE INTO roles (id, name) KEY (id) VALUES (3, 'ROLE_VENDEDOR');
MERGE INTO roles (id, name) KEY (id) VALUES (4, 'ROLE_RECEPCION');
MERGE INTO roles (id, name) KEY (id) VALUES (5, 'ROLE_CONTABILIDAD');
MERGE INTO roles (id, name) KEY (id) VALUES (6, 'ROLE_DIRECTIVO');
MERGE INTO roles (id, name) KEY (id) VALUES (7, 'ROLE_SOPORTE');

-- 2. Massive Clean Up (DISABLED TO PRESERVE DATA)
-- TRUNCATE TABLE mensajes;
-- TRUNCATE TABLE pagos;
-- TRUNCATE TABLE contratos;
-- TRUNCATE TABLE opportunities;
-- TRUNCATE TABLE leads;
-- TRUNCATE TABLE user_roles;
-- TRUNCATE TABLE clientes;
-- TRUNCATE TABLE role_permissions;
-- TRUNCATE TABLE role_permissions_default;
-- TRUNCATE TABLE USERS;
-- TRUNCATE TABLE lotes;
-- TRUNCATE TABLE fraccionamientos;

-- Re-enable integrity checks
SET REFERENTIAL_INTEGRITY TRUE;

-- 3. Users (FRESH START)
-- Passwords: password123 ($2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou)
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (1, 'admin', 'admin@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 2, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (2, 'vendedor', 'vendedor@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 3, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (3, 'recepcion', 'recepcion@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 4, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (4, 'contabilidad', 'contabilidad@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 5, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (5, 'directivo', 'directivo@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 6, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (6, 'soporte', 'soporte@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 7, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (101, 'franivan@test.com', 'franivan@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 1, CURRENT_TIMESTAMP);
MERGE INTO USERS (id, username, email, password, role_id, created_at) KEY (id) VALUES (102, 'maria@test.com', 'maria@test.com', '$2a$10$qbVHd72aWuXZTIrAm75aIud8plhMfJKbdps00KbjmqDrniX4bcpou', 1, CURRENT_TIMESTAMP);

-- 5. Entities
MERGE INTO fraccionamientos (id, nombre, ubicacion, descripcion, logo_url, coordenadas_geo, poligono_delimitador) KEY (id) VALUES 
(1, 'Residencial Las Palmas', 'Cancún, Quintana Roo', 'Exclusivo fraccionamiento.', '/reyval/api/images/palmas.png', '21.1619, -86.8515', '[[21.162795,-86.849289],[21.162170,-86.848870],[21.161319,-86.850695],[21.161560,-86.850947],[21.161840,-86.850936],[21.162055,-86.850850],[21.162795,-86.849321]]'),
(2, '7 Mares Residencial', 'Mazunte, Oaxaca', 'Eco-turístico.', '/reyval/api/images/7mares.png', '15.6665, -96.5556', '[[15.667814,-96.555597],[15.667711,-96.555114],[15.665727,-96.555081],[15.665992,-96.555699]]'),
(3, 'Marina Azure', 'Puerto Vallarta, Jalisco', 'Vista espectacular al mar.', '/reyval/api/images/marina.png', '20.6534, -105.2435', '[[20.6550,-105.2450],[20.6550,-105.2420],[20.6520,-105.2420],[20.6520,-105.2450]]'),
(4, 'Hacienda Real', 'Tequila, Jalisco', 'Tradición y confort.', '/reyval/api/images/hacienda.png', '20.8845, -103.8345', '[[20.8860,-103.8360],[20.8860,-103.8330],[20.8830,-103.8330],[20.8830,-103.8360]]');

MERGE INTO lotes (id, numero_lote, manzana, precio_total, area_metros_cuadrados, coordenadas_geo, estatus, fraccionamiento_id, plano_coordinates) KEY (id) VALUES 
(1, 'A001', 'MZ A', 150000.0, 200.0, '21.1622, -86.8494', 'VENDIDO', 1, '[[21.162237,-86.849375],[21.162157,-86.849568],[21.161922,-86.849423],[21.162032,-86.849224],[21.162222,-86.849364]]'),
(2, 'M001', 'Calle Mar', 100000.0, 500.0, '15.6665, -96.5556', 'DISPONIBLE', 2, '[[15.666449,-96.555699],[15.666444,-96.555477],[15.665992,-96.555482],[15.665990,-96.555750],[15.666418,-96.555705]]'),
(3, 'MAR-01', 'Manzana 1', 250000.0, 300.0, '20.6535, -105.2430', 'DISPONIBLE', 3, '[[20.6540,-105.2440],[20.6540,-105.2430],[20.6530,-105.2430],[20.6530,-105.2440]]'),
(4, 'HAC-01', 'Calle Principal', 120000.0, 450.0, '20.8845, -103.8340', 'DISPONIBLE', 4, '[[20.8850,-103.8350],[20.8850,-103.8340],[20.8840,-103.8340],[20.8840,-103.8350]]');

MERGE INTO clientes (id, nombre, apellidos, email, telefono, direccion, ine, fecha_registro, user_id) KEY (id) VALUES 
(1, 'Francisco', 'Iván', 'franivan@test.com', '9981234567', 'Av. Kabah #123, Cancún', 'INE12345678', CURRENT_TIMESTAMP, 101),
(2, 'María', 'García', 'maria@test.com', '9987654321', 'Colonia Centro, Mazunte', 'INE87654321', CURRENT_TIMESTAMP, 102);

-- RESET SEQUENCES
ALTER TABLE USERS ALTER COLUMN id RESTART WITH 200;
ALTER TABLE clientes ALTER COLUMN id RESTART WITH 10;
ALTER TABLE fraccionamientos ALTER COLUMN id RESTART WITH 10;
ALTER TABLE lotes ALTER COLUMN id RESTART WITH 10;

-- 6. Leads & Opportunities
MERGE INTO leads (id, nombre, email, telefono, mensaje, source, interes, status, fecha_registro) KEY (id) VALUES 
(101, 'Carlos Ramirez', 'carlos@email.com', '5511223344', 'Interesado en Marina Azure', 'WEB', 'COTIZACION', 'NEW', CURRENT_TIMESTAMP),
(102, 'Elena Gomez', 'elena@email.com', '5566778899', 'Busca casa de campo', 'CHATBOT', 'REPRESENTANTE', 'IN_PROGRESS', CURRENT_TIMESTAMP),
(103, 'Roberto Diaz', 'roberto@email.com', '3344556677', 'Inversión patrimonial', 'WEB', 'COTIZACION', 'NEW', CURRENT_TIMESTAMP);

MERGE INTO opportunities (id, lead_id, lote_id, monto_estimado, status, notas, fecha_cierre_estimada) KEY (id) VALUES 
(101, 101, 1, 180000.0, 'NEGOTIATION', 'Interés alto en lote frente al mar', '2026-04-10'),
(102, 102, 2, 95000.0, 'PROSPECTING', 'Buscando opciones de preventa', '2026-05-20');

-- 7. Sample Messages (Internal + CRM)
INSERT INTO mensajes (id, tipo, direccion, contenido, remitente, fecha, asunto, leido, remitente_user_id, destinatario_user_id) VALUES
(1, 'INTERNO', 'ENVIADO', 'Hola Admin, quería comentarte que el lote A001 ya fue visitado por el cliente.', 'vendedor', PARSEDATETIME('2026-02-20 09:30:00', 'yyyy-MM-dd HH:mm:ss'), 'Actualización Lote A001', false, 2, 1),
(2, 'INTERNO', 'ENVIADO', 'Perfecto, gracias por el aviso. ¿El cliente mostró interés en otros lotes?', 'admin', PARSEDATETIME('2026-02-20 10:15:00', 'yyyy-MM-dd HH:mm:ss'), 'Re: Actualización Lote A001', true, 1, 2),
(3, 'INTERNO', 'ENVIADO', 'El pago del mes de enero del cliente Francisco está pendiente de verificación.', 'recepcion', PARSEDATETIME('2026-02-19 14:00:00', 'yyyy-MM-dd HH:mm:ss'), 'Pago pendiente de verificar', false, 3, 1),
(4, 'INTERNO', 'ENVIADO', 'Por favor confirmen si el lote M001 sigue disponible, tengo un cliente interesado.', 'vendedor', PARSEDATETIME('2026-02-21 08:00:00', 'yyyy-MM-dd HH:mm:ss'), 'Disponibilidad Lote M001', false, 2, 3),
(5, 'INTERNO', 'ENVIADO', 'Adjunto el reporte de ventas del mes pasado para revisión.', 'contabilidad', PARSEDATETIME('2026-02-18 16:30:00', 'yyyy-MM-dd HH:mm:ss'), 'Reporte de Ventas - Enero 2026', false, 4, 5);

INSERT INTO mensajes (id, target_id, tipo, direccion, contenido, remitente, fecha, leido) VALUES
(6, 1, 'WA', 'ENVIADO', 'Hola, le escribimos de Reyval. ¿Sigue interesado en el lote A001?', 'Vendedor', PARSEDATETIME('2026-02-20 11:00:00', 'yyyy-MM-dd HH:mm:ss'), false),
(7, 1, 'WA', 'RECIBIDO', 'Sí, me gustaría agendar una visita esta semana.', 'Cliente', PARSEDATETIME('2026-02-20 11:05:00', 'yyyy-MM-dd HH:mm:ss'), false),
(8, 1, 'WA', 'ENVIADO', 'Perfecto, ¿le parece el jueves a las 10am?', 'Vendedor', PARSEDATETIME('2026-02-20 11:10:00', 'yyyy-MM-dd HH:mm:ss'), false),
(9, 1, 'EMAIL', 'ENVIADO', 'ASUNTO: Cotización Lote A001\n\nEstimado cliente,\n\nAdjunto encontrará la cotización del Lote A001 en Residencial Las Palmas.\n\nPrecio: $150,000 MXN\nÁrea: 200 m²\n\nQuedamos a sus órdenes.', 'Vendedor', PARSEDATETIME('2026-02-19 15:00:00', 'yyyy-MM-dd HH:mm:ss'), false);

ALTER TABLE mensajes ALTER COLUMN id RESTART WITH 100;

-- 8. Default Permissions Reference Table
CREATE TABLE IF NOT EXISTS role_permissions_default (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL,
    permission_key VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    UNIQUE(role_name, permission_key)
);

-- Nuclear Clean for Permissions
DELETE FROM role_permissions;
DELETE FROM role_permissions_default;

-- Seed Default Permissions (Comprehensive Inventory)
INSERT INTO role_permissions_default (role_name, permission_key, is_enabled) VALUES 
-- ADMIN
('ROLE_ADMIN', 'menu:home', true),
('ROLE_ADMIN', 'menu:admin_dashboard', true),
('ROLE_ADMIN', 'menu:clientes', true),
('ROLE_ADMIN', 'menu:users', true),
('ROLE_ADMIN', 'menu:leads', true),
('ROLE_ADMIN', 'menu:opportunities', true),
('ROLE_ADMIN', 'menu:fraccionamientos', true),
('ROLE_ADMIN', 'action:fraccionamiento:edit', true),
('ROLE_ADMIN', 'action:fraccionamiento:delete', true),
('ROLE_ADMIN', 'menu:lotes', true),
('ROLE_ADMIN', 'menu:reportes', true),
('ROLE_ADMIN', 'menu:carga_datos', true),
('ROLE_ADMIN', 'menu:documentacion', true),
('ROLE_ADMIN', 'menu:soporte', true),
('ROLE_ADMIN', 'menu:permissions', true),
('ROLE_ADMIN', 'menu:contratos', true),
('ROLE_ADMIN', 'action:cliente:create', true),
('ROLE_ADMIN', 'action:cliente:edit', true),

-- RECEPCIÓN
('ROLE_RECEPCION', 'menu:home', true),
('ROLE_RECEPCION', 'section:pagos', true),
('ROLE_RECEPCION', 'menu:payments_view', true),
('ROLE_RECEPCION', 'menu:contratos', true),
('ROLE_RECEPCION', 'menu:contracts_view', true),
('ROLE_RECEPCION', 'menu:leads', true),
('ROLE_RECEPCION', 'menu:clientes', true),
('ROLE_RECEPCION', 'menu:fraccionamientos', true),
('ROLE_RECEPCION', 'menu:lotes', true),
('ROLE_RECEPCION', 'menu:documentacion', true),
('ROLE_RECEPCION', 'action:pago:validate', true),
('ROLE_RECEPCION', 'action:pago:create', true),
('ROLE_RECEPCION', 'action:cliente:create', true),
('ROLE_RECEPCION', 'action:cliente:edit', true),
('ROLE_RECEPCION', 'action:fraccionamiento:edit', true),
('ROLE_RECEPCION', 'action:fraccionamiento:delete', true),
('ROLE_RECEPCION', 'menu:soporte', true),

-- VENDEDOR
('ROLE_VENDEDOR', 'menu:home', true),
('ROLE_VENDEDOR', 'menu:panel_vendedor', true),
('ROLE_VENDEDOR', 'menu:clientes', true),
('ROLE_VENDEDOR', 'menu:leads', true),
('ROLE_VENDEDOR', 'menu:opportunities', true),
('ROLE_VENDEDOR', 'menu:fraccionamientos', true),
('ROLE_VENDEDOR', 'menu:lotes', true),
('ROLE_VENDEDOR', 'menu:cotizaciones', true),
('ROLE_VENDEDOR', 'menu:documentacion', true),
('ROLE_VENDEDOR', 'menu:soporte', true),
('ROLE_VENDEDOR', 'menu:contratos', true),
('ROLE_VENDEDOR', 'action:cliente:create', true),
('ROLE_VENDEDOR', 'action:cliente:edit', true),

-- CONTABILIDAD
('ROLE_CONTABILIDAD', 'menu:home', true),
('ROLE_CONTABILIDAD', 'menu:panel_contabilidad', true),
('ROLE_CONTABILIDAD', 'menu:payments_view', true),
('ROLE_CONTABILIDAD', 'section:pagos', true),
('ROLE_CONTABILIDAD', 'action:pago:validate', true),
('ROLE_CONTABILIDAD', 'menu:clientes', true),
('ROLE_CONTABILIDAD', 'menu:reportes', true),
('ROLE_CONTABILIDAD', 'menu:soporte', true),

-- DIRECTIVO
('ROLE_DIRECTIVO', 'menu:home', true),
('ROLE_DIRECTIVO', 'menu:panel_directivo', true),
('ROLE_DIRECTIVO', 'menu:reportes', true),
('ROLE_DIRECTIVO', 'menu:fraccionamientos', true),
('ROLE_DIRECTIVO', 'action:fraccionamiento:edit', true),
('ROLE_DIRECTIVO', 'action:fraccionamiento:delete', true),
('ROLE_DIRECTIVO', 'menu:soporte', true),
('ROLE_DIRECTIVO', 'menu:permissions', true),

-- CLIENTE
('ROLE_USER', 'menu:panel_cliente', true),
('ROLE_USER', 'menu:profile', true),
('ROLE_USER', 'menu:payments_history', true),
('ROLE_USER', 'menu:contract_details', true),
('ROLE_USER', 'menu:lot_details', true),
('ROLE_USER', 'menu:home', true),

-- SOPORTE (System Admin)
('ROLE_SOPORTE', 'menu:home', true),
('ROLE_SOPORTE', 'menu:soporte', true),
('ROLE_SOPORTE', 'menu:admin_dashboard', true),
('ROLE_SOPORTE', 'menu:users', true);

-- Synchronize active role_permissions with defaults
INSERT INTO role_permissions (role_name, permission_key, is_enabled)
SELECT role_name, permission_key, is_enabled FROM role_permissions_default;
