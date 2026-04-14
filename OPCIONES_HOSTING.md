# Guía de Hosting Económico para Múltiples Apps Java

Está guía detalla cómo alojar ~10 aplicaciones Java pequeñas de forma económica.

## El Problema de Java en la Nube
Java consume más memoria RAM inicial que otros lenguajes (Node.js/Go). En plataformas "Serverless" o PaaS (Railway, Render, Heroku), te cobran por recursos reservados.
- **Costo Promedio PaaS**: $5 USD/mes por app = **$50 USD/mes** para 10 apps.
- **Solución Propuesta (VPS)**: Contratar un Servidor Virtual Privado (VPS) con mucha RAM y desplegar todo allí usando Docker.
- **Costo Promedio VPS**: **$7 - $15 USD/mes** TOTALES para las 10 apps.

---

## Estrategia Recomendada: VPS + Coolify
En lugar de configurar "Tomcat a mano" (que es antiguo y difícil de mantener), usaremos **Coolify**. Es un panel de control open-source (tipo Vercel/Netlify) que instalas en tu servidor. Te permite conectar tu GitHub y desplegar automáticamente.

---

## 2. Opción B: Hetzner Cloud (La mejor Calidad/Precio)
Hetzner es un proveedor alemán con centros de datos en Europa y EE.UU. Es extremadamente fiable y barato.

### Costos Estimados
- **CPX21**: 3 vCPU, **4 GB RAM**, 80 GB Disco -> **~7.55 €/mes** (Suficiente para ~8-10 apps optimizadas).
- **CPX31**: 4 vCPU, **8 GB RAM**, 160 GB Disco -> **~14.40 €/mes** (Holgado para 10+ apps).

### Pasos a Seguir
1.  **Registro**: Ve a [Hetzner Cloud](https://www.hetzner.com/cloud) y regístrate. Te pedirán verificar identidad (foto DNI/Pasaporte) o añadir tarjeta de crédito.
2.  **Crear Proyecto**: En la consola, crea un nuevo "Project".
3.  **Añadir Servidor**:
    *   **Location**: Ashburn, VA (EE.UU.) si estás en América, o Falkenstein (Alemania) para Europa.
    *   **Image**: Ubuntu 22.04 o 24.04.
    *   **Type**: Standard -> **CPX31** (Recomendado 8GB RAM para estar seguro) o **CPX21** (4GB para probar).
    *   **SSH Key**: Crea una llave SSH en tu PC (`ssh-keygen`) y pega la pública aquí para entrar sin contraseña. O elige recibir password por email.
    *   **Create & Buy**.
4.  **Instalar Coolify**:
    *   Conéctate por terminal: `ssh root@<IP_DEL_SERVIDOR>`
    *   Ejecuta el comando auto-instalador de Coolify:
        ```bash
        curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
        ```
    *   Espera unos minutos. Al finalizar te dará una URL (ej: `http://<IP>:8000`).
5.  **Desplegar**:
    *   Entra a la URL, crea usuario y conecta tu cuenta de GitHub.
    *   Importa tus repositorios Java. Coolify leerá tus `Dockerfile` y los desplegará igual que Railway.

---

## 3. Opción C: Oracle Cloud Free Tier (Gratis, Potente, Difícil de conseguir)
Oracle ofrece una capa gratuita "Always Free" increíblemente generosa, pero el proceso de registro suele fallar sin explicación (rechazan tarjetas).

### Beneficios (Gratis de por vida)
- **Instancias ARM (Ampere)**: Hasta **4 vCPUs** y **24 GB de RAM**.
- **Costo**: $0.00.

### Pasos a Seguir
1.  **Registro y Lucha (El paso difícil)**:
    *   Ve a [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
    *   Intenta registrarte. Si te rechazan la tarjeta ("Error processing transaction"), prueba con otra tarjeta, otro email, o desde otra IP. Es cuestión de suerte.
2.  **Crear Instancia VM**:
    *   Si logras entrar, ve a "Compute" -> "Instances" -> "Create Instance".
    *   **Image**: Ubuntu 22.04.
    *   **Shape (Importante)**: Cambia el "Shape". Selecciona **Ampere** (VM.Standard.A1.Flex).
    *   **Configuración**: Mueve los sliders al máximo gratuito (4 OCPU, 24 GB RAM).
    *   Descarga la llave SSH privada que te ofrecen (¡No la pierdas!).
3.  **Configurar Red (Ingress Rules)**:
    *   Por defecto Oracle bloquea todo. Ve a la "VCN" (Virtual Cloud Network) de tu instancia -> "Security Lists".
    *   Añade "Ingress Rules" para abrir los puertos: 80 (HTTP), 443 (HTTPS), 3000 o 8000 (Panel Coolify), 22 (SSH).
4.  **Conexión e Instalación**:
    *   `ssh -i tu_llave.key ubuntu@<IP_PUBLICA>`
    *   Instala Coolify igual que en el paso anterior.
    *   **Nota**: Al ser ARM, asegúrate de que tus Dockerfiles usen imágenes base compatibles con ARM (la mayoría de OpenJDK lo son).

---

## 4. Análisis de AWS (Amazon Web Services)
¿Es viable AWS? Sí. ¿Es económico para esto? **No**.

AWS está diseñado para escalabilidad empresarial, no para hostear barato VPS pequeños con mucha RAM.

### Costo de una Máquina Ubuntu (EC2)
Para correr 10 aplicaciones Java, necesitas mínimo 4GB de RAM, idealmente 8GB.

*   **Instancia t3.medium** (2 vCPU, **4 GB RAM**):
    *   Costo por hora: ~$0.0416 USD
    *   Costo mensual: **~$30.40 USD/mes**
*   **Instancia t3.large** (2 vCPU, **8 GB RAM**):
    *   Costo mensual: **~$60.80 USD/mes**

### Costos Ocultos (Extras)
A esos $30 USD debes sumar:
1.  **Storage (EBS)**: El disco duro se cobra aparte. 40GB SSD GP3 = ~$4 USD/mes.
2.  **Data Transfer**: AWS cobra la salida de datos (aprox $0.09/GB después de los primeros 100GB).
3.  **Elastic IP**: Gratis si está en uso, pero si apagas la máquina te cobran.
4.  **Complejidad**: Tienes que configurar VPCs, Security Groups, Key Pairs, IAM Roles... es mucho más complejo que un VPS simple.

### Veredicto sobre AWS
**Te costará mínimo $35 - $40 USD al mes** por una máquina de 4GB RAM que en Hetzner te cuesta $8 USD o en Contabo $6 USD. **No lo recomiendo** para proyectos personales que buscan economía.

---

## Resumen Final

| Proveedor | RAM | Costo Aprox | Dificultad | Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| **Hetzner** | 4 GB | ~ $8 USD | Media | ⭐⭐⭐⭐⭐ (Mejor Balance) |
| **Contabo** | 8 GB | ~ $7 USD | Media | ⭐⭐⭐⭐ (Más barato, hardware modesto) |
| **Oracle** | 24 GB | **Gratis** | Alta (Registro) | ⭐⭐⭐ (Si logras registrarte) |
| **AWS** | 4 GB | ~ $40 USD | Alta | ⭐ (Muy caro para este uso) |
| **Railway** | N/A | ~ $50+ USD | Muy Baja | ⭐⭐ (Caro para 10 apps) |

**Mi consejo**: Intenta registrarte en **Oracle Cloud** hoy mismo. Si falla (que es probable), contrata una **CPX21 o CPX31 en Hetzner** o un **Cloud VPS S en Contabo**. Instala **Coolify** en cualquiera de ellos y tendrás tu propio "Railway" privado ilimitado por una fracción del precio.
