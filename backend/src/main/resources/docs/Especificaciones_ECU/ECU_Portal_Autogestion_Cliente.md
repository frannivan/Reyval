# ECU: Portal de Autogestión de Clientes

## 1. Objetivo
Proporcionar al cliente una interfaz segura y centralizada para consultar su patrimonio inmobiliario, historial de pagos validados y estatus legal de sus contratos.

## 2. Actores
- **Cliente**: Usuario final con acceso restringido a su propia información.
- **Backend (ClientPortal)**: Filtra los datos para asegurar que el cliente solo vea su expediente.

## 3. Especificación de Casos de Uso (ECU)

### CU_PORTAL_01: Dashboard de Consolidación
- **Entrada:** Token de usuario autenticado.
- **Lógica:**
  1. El sistema identifica al `Cliente` vinculado al `User` mediante `clienteRepository.findByUserId()`.
  2. Recupera todos los contratos del cliente (`contratoRepository.findByClienteId()`).
  3. Para cada contrato, calcula el **Total Pagado** sumando únicamente los pagos con estatus `VALIDADO`.
  4. Calcula el saldo pendiente restando lo validado del monto total del contrato.
- **Salida:** Respuesta JSON estructurada (`ClientDashboardResponse`) con totales acumulados.

### CU_PORTAL_02: Visualización de Estado de Cuenta
- **Lógica:**
  1. Presentación cronológica de abonos.
  2. Acceso a comprobantes PDF mediante `PagoController.getComprobante`.
  3. Badge de estatus: "Pendiente de Validación" (registrado pero no validado) o "Validado".

## 4. Mapeo Técnico (Java Doc)
- **Controller:** `ClientPortalController.java`
- **Endpoint:** `/api/client/dashboard`
- **DTO Principal:** `ContratoSummary`
