# ECU/EIU: Monitoreo Técnico y Estatus (Health)

## 1. Objetivo
Proveer visibilidad en tiempo real sobre la salud de los servidores, el estado de los servicios backend y la integridad de las cargas de datos.

## 2. Especificación de Casos de Uso (ECU)

### CU_SYS_01: Telemetría de Servidores
- **Entrada:** Acceso al panel de infraestructura.
- **Lógica:**
  1. Consumo de endpoints de `HealthController` y `AppStatusController`.
  2. Evaluación de disponibilidad de Base de Datos y Sistema de Archivos.
  3. Cálculo de uptime y latencia de respuesta.
- **Salida:** Indicadores visuales de estado (Online/Offline/Warning).

### CU_SYS_02: Auditoría de Logs (Terminal)
- **Lógica:**
  1. Streaming de logs de aplicación.
  2. Filtrado por nivel (INFO, WARN, ERROR).
  3. Visualización en consola web de los eventos críticos de negocio (e.g., errores en firma digital o fallos en envío de emal).

## 3. Especificación de Interfaz de Usuario (EIU)

### Terminal Maestro
- **Vista:** `terminal.html`
- **Componentes:**
  - **Console View:** Fondo oscuro, fuente Mono, scrolling automático.
  - **Control de Filtros:** Checkboxes para niveles de log.

## 4. Mapeo Técnico (Java Doc)
- **Controller:** `HealthController.java`, `AppStatusController.java`.
