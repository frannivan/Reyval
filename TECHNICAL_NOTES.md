# Reyval - Detalles Técnicos y Configuración

Este documento centraliza las configuraciones necesarias para el desarrollo y despliegue del proyecto Reyval.

## 1. Base de Datos Local (Docker)

Para el desarrollo local, recomendamos usar MySQL 8.0 vía Docker para asegurar paridad con el futuro entorno de AWS RDS.

### Comando de Inicialización
Ejecuta el siguiente comando en tu terminal para levantar el contenedor:

```bash
docker run -d \
  --name reyval-db \
  -e MYSQL_ROOT_PASSWORD=reyval_root_pass \
  -e MYSQL_DATABASE=reyval_db \
  -p 3306:3306 \
  mysql:8.0
```

---

## 2. Autenticación (Better-Auth)

### Requerimientos de Esquema
Better-Auth requiere las siguientes tablas técnicas en Prisma, las cuales se integrarán al `schema.prisma` principal:
- `User` (extendido)
- `Account`
- `Session`
- `Verification`

---

## 3. Comandos Útiles

| Acción | Comando | Directorio |
| :--- | :--- | :--- |
| Generar Cliente Prisma | `npx prisma generate` | `shared/database` |
| Sincronizar DB (Migración) | `npx prisma db push` | `shared/database` |
| Abrir Prisma Studio | `npx prisma studio` | `shared/database` |
| Iniciar Frontend (Angular) | `npm start` o `ng serve` | `frontend/` |

---

## 4. Almacenamiento (AWS S3)

*Pendiente de configurar credenciales de AWS IAM para el manejo de expedientes y comprobantes.*
