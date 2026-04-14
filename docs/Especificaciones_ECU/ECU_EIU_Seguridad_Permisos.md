# ECU/EIU: Seguridad y Control de Acceso (RBAC)

## 1. Objetivo
Gestionar de manera granular los permisos y roles de los usuarios del sistema Reyval, permitiendo la habilitación o deshabilitación de funciones específicas sin necesidad de cambios en el código.

## 2. Actores
- **Administrador / Directivo**: Únicos autorizados para modificar la matriz de permisos.
- **Backend (AuthSystem)**: Valida cada petición contrastando el rol del usuario contra la tabla `role_permissions`.

## 3. Especificación de Casos de Uso (ECU)

### CU_SEC_01: Gestión de Matriz de Permisos
- **Entrada:** Selección de Rol y Toggle de Permiso (Switch).
- **Lógica:**
  1. El sistema carga los permisos actuales desde `PermissionController.getAllPermissions()`.
  2. Al cambiar un estado, se envía un `POST` a `/api/permissions` con el `permissionKey` y el nuevo estado `enabled`.
  3. Si el permiso no existe para ese rol, se crea un nuevo registro.
- **Salida:** Actualización inmediata de la base de datos y persistencia del cambio.

### CU_SEC_02: Reset a Valores de Fábrica
- **Entrada:** Click en botón "Restablecer Valores Predeterminados".
- **Lógica:**
  1. Se ejecuta `PermissionController.resetPermissions()`.
  2. El sistema vacía la tabla `role_permissions`.
  3. Se repuebla la tabla utilizando los valores maestros de `role_permissions_default`.
- **Salida:** Notificación de éxito y recarga de la cuadrícula de seguridad.

## 4. Especificación de Interfaz de Usuario (EIU)

### Matriz de Seguridad (Grid)
- **Vista:** `security.html`
- **Componentes:**
  - **Selector de Rol:** Botones tipo pill para alternar entre ADMIN, VENDEDOR, RECEPCION, etc.
  - **Tabla de Funciones:** Columna "Funcionalidad" y Columna "Estado" (Switch interactivo).
  - **Categorías:** Agrupación visual por módulos (Ventas, CRM, Inventario).

## 5. Mapeo Técnico (Java Doc)
- **Controller:** `PermissionController.java`
- **Entidad:** `RolePermission`
- **Seguridad:** `@PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTIVO')")`
