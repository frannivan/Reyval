# ⚙️ Manual de Usuario: Administrador del Sistema

> **Objetivo**: Guía para la configuración de seguridad, roles y despliegue de nuevos desarrollos.

---

## 1. Gestión de Seguridad y Roles (RBAC)

Como administrador, controlas quién puede ver qué. No necesitas tocar código:

1.  Ve a **Configuración > Usuarios y Roles**.
2.  En la tabla de permisos, verás las columnas de acciones (Crear, Editar, Borrar).
3.  **Señal de Control**: Usa los interruptores (Toggles) para activar o desactivar módulos enteros para un rol específico.
    *   *Ejemplo*: Desactiva "Exportar" para el rol de Vendedor si no quieres que descarguen la base de datos.

![Lista de Usuarios y Roles Real](images/manuals/user_roles_real.png)

---

## 2. Alta de Fraccionamientos (Nuevos Mapas)

Para subir un nuevo desarrollo inmobiliario:

1.  Carga el archivo **SVG** mapeado en el módulo de Inventario.
2.  **Señal de Carga Masiva**: Sube el Excel con la lista de lotes, precios y dimensiones.
3.  El sistema validará que los IDs del Excel coincidan con los del SVG.

---

## 3. Monitoreo de Integraciones

1.  Revisa el panel de **Logs de IA** para ver qué están preguntando los clientes al Chatbot.
2.  Si detectas una respuesta errónea, actualiza la "Base de Conocimientos" en el módulo correspondiente.

---

> [!NOTE]
> Para detalles de base de datos, API REST o infraestructura en la nube, consulta los documentos **ECU (Especificación de Componentes)** en la carpeta técnica.
