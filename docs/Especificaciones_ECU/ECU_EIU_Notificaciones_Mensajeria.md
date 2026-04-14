# ECU/EIU: Notificaciones y Mensajería Unificada

## 1. Objetivo
Centralizar todas las comunicaciones (internas entre empleados y externas hacia clientes vía WhatsApp) para garantizar el seguimiento oportuno de prospectos y cobranza.

## 2. Especificación de Casos de Uso (ECU)

### CU_MSG_01: Bandeja de Mensajería Interna
- **Entrada:** Identificador de usuario.
- **Lógica:**
  1. Recuperación de mensajes recibidos/enviados mediante `MensajeController.getRecibidos()`.
  2. Marcado de lectura automático al abrir el detalle.
  3. Conteo de no leídos para visualización en el sidebar (`/no-leidos/count`).
- **Salida:** Bandeja de entrada interactiva.

### CU_MSG_02: Seguimiento WhatsApp (External)
- **Entrada:** Datos del Lead/Contrato.
- **Lógica:**
  1. El sistema utiliza el número de teléfono formateado.
  2. Genera un presupuesto dinámico o liga de pago.
  3. Lanza el intent de WhatsApp con un mensaje pre-configurado basado en la plantilla del proceso (e.g., "Recordatorio de Pago", "Cotización de Lote").
- **Salida:** Despliegue de aplicación de mensajería externa con contenido poblado.

## 3. Especificación de Interfaz de Usuario (EIU)

### Centro de Mensajes
- **Vista:** `mensajes.html`
- **Componentes:**
  - **Tabs:** Recibidos, Enviados, Redactar.
  - **Thread View:** Visualización tipo chat para hilos de conversación.
  - **Botón WhatsApp:** Icono flotante o integrado en expedientes (Verde #25D366).

## 4. Mapeo Técnico (Java Doc)
- **Controller:** `MensajeController.java`, `CRMController` (sendBudget).
- **Entidad:** `Mensaje`
