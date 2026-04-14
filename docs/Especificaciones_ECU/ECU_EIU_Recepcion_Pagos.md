# ECU-10: Validación de Pagos (Recepción)
## Descripción
Permite al rol 'Recepción' validar o rechazar los pagos registrados en el sistema, asegurando que el comprobante y el monto coincidan.

## Actores
- Recepción

## Flujo Principal
1. Recepción ingresa al sistema y selecciona "Recepción: Pagos" en el menú.
2. Visualiza una tabla con los pagos filtrados por defecto en "PENDIENTE".
3. Revisa la referencia, monto y fecha del pago.
4. Da clic en "✅ Validar".
5. Confirma la acción.
6. El sistema actualiza el estatus a "VALIDADO".

## EIU-08: Dashboard de Recepción
- **Filtros**:
  - Buscador por Referencia/Monto.
  - Dropdown por Estatus (Todos, Pendiente, Validado, Rechazado).
- **Tabla de Pagos**:
  - Columnas: Fecha, Monto, Referencia, Concepto, Estatus, Acciones.
  - Acciones: Botones "Validar" y "Rechazar" (Solo visibles si estatus es PENDIENTE).
