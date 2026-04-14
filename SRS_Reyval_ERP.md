# Reyval ERP - Especificación de Requerimientos de Software
**Fecha:** 20 de febrero de 2026  
**Versión:** 1.0  
**Organización:** Reyval Real Estate

## 1. Introducción
El presente documento detalla la especificación formal de requerimientos para el sistema Reyval ERP, una solución integral diseñada para la gestión operativa y comercial de fraccionamientos inmobiliarios.

## 2. Alcance del Sistema
- **Geomática y Visualización:** SVG/Google Maps.
- **Gestión de Inventario:** Estatus en tiempo real (Libre, Apartado, Contratado).
- **CRM Inmobiliario:** Ciclo Lead -> Oportunidad -> Cliente -> Contrato (Kanban).
- **Simulación Financiera:** Motor de cálculo multi-canal (Admin, Vendedor, Recepción, Chatbot).
- **Gestión de Cobranza:** Historial de pagos y validación contable.
- **Carga Masiva:** Importación Excel/CSV.
- **Gestión Documental:** Expediente digital (INE, comprobantes).
- **Automatización Documental:** Contratos PDF automáticos.
- **Inteligencia de Negocio:** Reportes de ventas y rendimiento.
- **Seguridad:** Roles (Admin, Vendedor, Recepción, Contabilidad).

## 3. Identificación de Actores (UML)
| Actor | Rol | Descripción |
| :--- | :--- | :--- |
| **Administrador** | Estratégico | Control total, configuración y cargas masivas. |
| **Vendedor** | Comercial | CRM y formalización de contratos. |
| **Recepción** | Operativo | Carga de expedientes y registro de leads. |
| **Cliente** | Externo | Consultas y simulaciones públicas. |
| **Chatbot (IA)** | Autónomo | Atención 24/7 y cotizaciones preliminares. |
| **Contabilidad** | Financiero | Validación de cobros y conciliación bancaria. |
| **Directivo** | Gerencial | Dashboards y reportes ejecutivos. |

## 4. Especificación de Casos de Uso (ECU)
| ID | Nombre | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| **CU01** | Configurar Fraccionamiento | Admin | Base geográfica y plano SVG. |
| **CU02** | Gestión Inventario Lotes | Admin | Alta y precio de unidades. |
| **CU03** | CRM Inmobiliario | Vend/Recep | Seguimiento en embudo Kanban. |
| **CU04** | Expediente Digital | Recep | Validación de documentos oficiales. |
| **CU05** | Simulación Financiera | Todos | Cálculo de amortizaciones y cotizaciones. |
| **CU06** | Emisión de Contrato | Admin/Vend | Formalización legal en PDF. |
| **CU07** | Carga Masiva | Admin | Importación masiva desde Excel. |
| **CU09** | Seguimiento de Pagos | Contab/Recep | Registro y validación de abonos. |
| **CU10** | Reportes e BI | Directivo | Inteligencia de negocio y dashboards. |

## 5. Especificación de Interfaz de Usuario (EIU)
- **Nexus Design System:** Estándar visual premium.
- **Simulador Reactivo:** Ajuste de plazos y tasas en tiempo real.
- **Tablero Kanban:** Gestión visual del estado de prospectos.

## 6. Stack Tecnológico
- **Backend:** Java 17 / Spring Boot 2.7.18.
- **Frontend:** Angular 21.0.
- **Infraestructura:** OCI / Nginx / PostgreSQL.
