# 🔄 Especificación Técnica: Cancelaciones & Devoluciones
> **Versión**: 1.0.0 | **Módulo**: Finanzas/Comercial | **Tipo**: ECU (Especificación de Componentes)

---

## 1. Alcance del Proceso
Define el flujo operativo y financiero para revertir una venta, liberar el inventario y gestionar los reembolsos correspondientes, asegurando que la contabilidad del fraccionamiento quede saneada.

## 2. Flujo de Reversión (UML)

```mermaid
graph LR
    A[Solicitud de Cancelación] --> B{Motivo?}
    B -- Impago --> C[Cancelación por Mora]
    B -- Voluntaria --> D[Rescisión de Contrato]
    C --> E[Cálculo de Penalización]
    D --> E
    E --> F[Liberación de Lote: DISPONIBLE]
    F --> G[Generación de Nota de Crédito]
    G --> H[Reversión de Comisiones]
    H --> I[Estatus: Cancelado]
```

---

## 3. Especificaciones de Componente (ECU)

### [Motor de Penalizaciones]
- **Regla Estándar**: Si la cancelación ocurre en los primeros 3 meses, se retiene el 100% del enganche.
- **Regla Posterior**: Después de 3 meses, se retiene el 20% del monto total pagado por concepto de gastos administrativos.
- **Excepciones**: Solo el rol **[ADMIN]** puede autorizar devoluciones íntegras.

### [Liberación de Inventario]
- **Acción**: Al confirmar la cancelación, el sistema dispara un evento al `LoteService` para cambiar el estatus de **[CONTRATADO]** a **[DISPONIBLE]**, eliminando el vínculo con el cliente pero manteniendo el historial en el expediente del lote.

---

## 4. Interfaz de Usuario (EIU) - Módulo de Bajas

El usuario administrativo gestiona las bajas mediante un asistente de tres pasos:

1.  **Cálculo Financiero**: Previsualización de cuánto se le debe devolver al cliente tras penalizaciones.
2.  **Carga de Documento**: Requisito de subir el "Convenio de Rescisión" firmado.
3.  **Confirmación Final**: Ejecución de la reversión en base de datos.

> [!WARNING]
> **Efecto de Cascada**: La cancelación de un contrato revierte automáticamente cualquier comisión que aún no haya sido dispersada al vendedor. Si ya fue pagada, el monto se cargará como un saldo negativo en su siguiente liquidación.

> [!NOTE]
> Las devoluciones monetarias se procesan fuera de banda por el departamento de Tesorería en un plazo de 15 a 30 días hábiles tras la cancelación en el sistema.
