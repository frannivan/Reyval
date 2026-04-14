# ⚖️ Especificación Técnica — Contratación Legal

> **Proyecto**: Reyval  
> **Módulos**: CU06 (Contratos / Plantillas)  
> **Fecha**: 21 de Febrero, 2026

---

## 1. El Motor de Plantillas Dinámicas

El sistema genera contratos legales inyectando datos del mundo Java (Entidades) en plantillas predefinidas.

### 1.1 El Proceso de "Tokenización"
Las plantillas (en formato .docx o HTML) contienen tokens como `${cliente.nombre}` o `${lote.precio}`. El backend utiliza una librería (ej. **Thymeleaf** o **Apache Velocity**) para sustituir estos valores.

```mermaid
graph LR
    A[Plantilla Base] --> B[Template Engine]
    C[Objeto Cliente] --> B
    D[Objeto Lote] --> B
    E[Objeto Simulación] --> B
    B --> F[Documento Generado PDF]
```

---

## 2. Diagrama de Secuencia: Generación de Contrato

```mermaid
sequenceDiagram
    participant U as 👤 Usuario Admin
    participant BE as ⚙️ Backend API
    participant JS as 📄 Jasper/OpenPDF
    participant CL as ☁️ Cloud Storage

    U->>BE: POST /api/contratos/generar {clienteId, loteId, plantillaId}
    BE->>BE: Fetch Data from DB
    BE->>BE: Validar estatus del Lote (Debe ser APARTADO)
    BE->>JS: Map data to Template tokens
    JS-->>BE: byte[] (PDF Buffer)
    BE->>CL: Subir archivo (contratos/C-123.pdf)
    BE->>BE: Crear registro en Tabla CONTRATO (Link a PDF)
    BE-->>U: 200 OK (URL de descarga)
```

---

## 3. Modelo de Datos del Contrato

```mermaid
classDiagram
    class Contrato {
        +Long id
        +String folio
        +LocalDateTime fechaFirma
        +EContratoStatus estatus [BORRADOR, FIRMADO, CANCELADO]
        +String urlArchivoPdf
        +Double valorOperacion
        +Integer version
    }

    class Plantilla {
        +Long id
        +String nombre
        +String contenidoHtml
        +EContratoTipo tipo [COMPRAVENTA, APARTADO, CESION]
    }

    Contrato "N" --> "1" Cliente
    Contrato "N" --> "1" Lote
    Contrato "N" --> "1" Plantilla
```

---

## 4. Workflow de Firma y Formalización

1. **Borrador**: El sistema genera la primera versión. El vendedor revisa errores.
2. **Revisión**: Se pueden hacer ajustes manuales (edición de tokens).
3. **Formalizado**: Se marca como "FIRMADO". El Lote cambia automáticamente a estatus **VENDIDO**.
4. **Resguardo**: El PDF se vincula perpetuamente al Dossier del Cliente.

---

## 5. Auditoría Legal

> [!CAUTION]
> Para garantizar la integridad legal, cada contrato generado tiene un **Hash SHA-256** único almacenado en base de datos. Si el archivo es modificado fuera del sistema, el hash no coincidirá, alertando sobre una posible alteración del documento.

---

## 6. Futuras Integraciones

- [ ] **Firma Digital (eFirma)**: Integración con proveedores como DocuSign o HelloSign.
- [ ] **Notario Digital**: Envío automático de copias a carpetas compartidas con notarías externas.
