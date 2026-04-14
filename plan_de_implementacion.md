# Plan de Implementación (Gap Analysis) - Reyval

Este documento sirve como checklist maestro para el control del avance del proyecto.

## 1. Configuración Inicial y Arquitectura
- [x] **Configuración Backend**
    - [x] Inicialización Spring Boot (Maven/Gradle).
    - [x] Configuración Base de Datos H2.
    - [x] Configuración de Seguridad (Spring Security + JWT).
    - [x] Configuración CORS y Manejo de Excepciones Global.
- [x] **Configuración Frontend**
    - [x] Inicialización Angular Project.
    - [x] Configuración de Routing y Estructura de Carpetas.
    - [x] Integración de Angular Material / TailwindCSS (Estilos Custom).
    - [x] Servicio de Interceptor para Token JWT (Manejado en Auth Service/Interceptor).

## 2. Gestión de Usuarios y Roles (Auth)
- [x] **Backend**
    - [x] Entidad `Usuario` y `Rol`.
    - [x] Repositorios y Servicios de Auth.
    - [x] Endpoint `login`.
    - [x] Endpoint `register` (para admins o registro público opcional).
- [x] **Frontend**
    - [x] Pantalla de Login.
    - [x] Guardias de Rutas (AuthGuard, RoleGuard - Implementado en lógica de componentes).

## 3. Módulo de Inventario y Lotificación
- [x] **Backend (Refactorización)**
    - [x] Entidad `Fraccionamiento` (Agrupación de lotes).
    - [x] Filtros de búsqueda (Implementado):
        - Fraccionamiento (Dropdown dinámico).
        - Ciudad/Ubicación (Dropdown dinámico).
        - Ordenar por Precio (Asc/Desc).
    - [x] Actualización `Lote` para soportar múltiples imágenes (Galería).
- [x] **Backend (Original)**
    - [x] Entidad `Lote` (precio, dimensiones, coordenadas, status).
    - [x] API CRUD Lotes.
    - [x] Lógica para cambio de estatus (Disponible -> Apartado -> Vendido).

## 4. Portal Público
- [x] **Frontend**
    - [x] Landing Page (Home).
    - [x] Catálogo de Terrenos (Grid/Lista).
        - [x] Detalles del Lote (Vista individual con foto y datos).
        - [x] **Mapa Interactivo (Leaflet.js)**:
            - **Objetivo**: Visualizar lotes en un mapa georreferenciado.
            - **Tecnología**: Leaflet (Ligero, Open Source).
            - **Características**:
                - Pines Dorados para Fraccionamientos (Filtro).
                - Pines Azules para Lotes Independientes.
                - **Admin**: Selector de ubicación con mapa (Click-to-set).
        - [x] Formulario de contacto.

## 5. Gestión de Clientes (CRM)
- [x] **Backend**
    - [x] Entidad `Cliente` (Datos personales, contacto).
    - [ ] Entidad `Interaccion` o `Seguimiento` (Fase 2).
    - [x] API CRUD Clientes.
- [x] **Frontend**
    - [x] Módulo "Registrar Cliente" (Panel Admin).

## 6. Ventas y Contratos
- [x] **Backend**
    - [x] Entidad `Cotizacion` (Manejada en VentaController).
    - [x] Entidad `Contrato`.
    - [x] Generación de Tabla de Amortización (Lógica de crédito).
    - [ ] Generación de documentos (PDF/Texto) del contrato.
- [x] **Frontend**
    - [x] Módulo "Generar Contrato" (Panel Admin).

## 7. Control de Pagos y Cobranza
- [x] **Backend**
    - [x] Entidad `Pago`.
    - [x] Lógica de aplicación de pagos a cuotas (Interés vs Capital).
    - [ ] Detección de mora y recargos.
    - [x] Estados de Cuenta (Backend/Frontend).
- [x] **Frontend**
    - [x] Módulo "Registrar Pago" (Panel Admin).

## 8. Portal Privado de Clientes
- [x] **Frontend**
    - [x] Dashboard Cliente (Visualización básica de contratos y perfil).
    - [x] Visualización de Detalle de Pagos / Estado de Cuenta.

## 9. Reportes
- [x] **Backend**
    - [x] Endpoints de estadísticas (Ventas por mes, ingresos, etc.).
- [ ] **Frontend**
    - [x] Panel Gráfico (Dashboard Admin - Tarjetas de Métricas).
        - [x] KPIs Financieros (Ingresos, Saldos) y Ventas Recientes.
    - [ ] Exportación a Excel/PDF.

## 10. Documentación Final
- [x] Manual de Usuario (Versión 1.0).
- [x] Manual Técnico.
