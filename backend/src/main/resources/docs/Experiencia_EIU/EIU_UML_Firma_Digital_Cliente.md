# ✍️ Experiencia del Cliente — Firma Digital de Contrato

> **Proyecto**: Reyval ERP  
> **Enfoque**: Cliente Final (Comprador)  
> **Propósito**: Modelar la formalización legal sin traslados físicos, centrada en la comodidad del cliente.

---

## 1. El Momento de la Firma

La firma del contrato es el hito emocional más alto. El sistema debe garantizar que este proceso sea solemne pero digitalmente sencillo.

```mermaid
graph TD
    A[📧 Notificación de Contrato Listo] --> B[👁️ Revisión desde cualquier dispositivo]
    B --> C[🔐 Verificación de Identidad]
    C --> D[🖋️ Firma en Pantalla / OTP]
    D --> E[📥 Descarga de Copia Certificada]
    E --> F[🥳 Bienvenida Oficial]
```

---

## 2. Diagrama de Secuencia: "Firma desde Casa"

```mermaid
sequenceDiagram
    actor C as 👤 Cliente
    participant BE as ⚙️ Backend Reyval
    participant FS as 🖋️ Motor de Firma (Docusign/eFirma)
    participant CL as ☁️ Almacenamiento Seguro

    BE->>C: Envía Email/SMS con link único de firma
    C->>BE: Accede al portal seguro
    C->>C: Lee el documento PDF generado
    C->>BE: Click en "Proceder a Firmar"
    BE->>FS: Solicitar sesión de firma digital
    FS-->>C: Pide código de seguridad (OTP al celular)
    C->>FS: Ingresa código y dibuja firma
    FS->>CL: Guarda documento con Sellos de Tiempo
    CL-->>BE: Devuelve URL de contrato final
    BE-->>C: ✅ Contrato firmado. ¡Enviado a tu email!
```

---

## 3. Valor Entregado al Cliente

| Característica | Beneficio para el Cliente |
|----------------|---------------------------|
| **Cero Desplazamientos** | Ahorro de tiempo y costos de traslado a oficina o notaría. |
| **Disponibilidad Permanente** | Puede leer el contrato a las 11 PM con calma desde su tablet. |
| **Seguridad Inviolable** | Certificado digital que garantiza que nadie alteró el contrato después de firmado. |

---

## 4. Certeza Jurídica para el Comprador

- **¿Qué validez tiene esto?**  
  El sistema utiliza la Ley de Firma Electrónica, con sellos de tiempo y constancias de conservación (NOM-151).
- **¿Qué pasa si me equivoco?**  
  Puedes rechazar el borrador y dejar un comentario para que el vendedor lo corrija antes de volver a enviarlo a firma.

---

> [!NOTE]
> **Toque Humano**: Una vez firmado, el sistema puede agendar automáticamente una llamada de bienvenida de parte de la dirección general.
