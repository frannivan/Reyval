# Technical Manual - Reyval

## 1. System Architecture
The system uses a decoupled monolithic microservices architecture (Separate Frontend and Backend).

- **Backend**: Spring Boot 2.7.18 (Java 11).
    - **Database**: H2 (Local file `./data/reyval_db`).
    - **Security**: Spring Security + JWT.
    - **Persistence**: Spring Data JPA.
- **Frontend**: Angular 18.
    - **Styling**: Custom CSS with Bootstrap-like utilities.
    - **Communication**: HTTP Client.
    - **Configuration**: The `src/environments/environment.prod.ts` file must point to the backend host (e.g., `https://KOYEB-APP-NAME.koyeb.app/api`).

## 2. Installation Requirements
- **Java JDK 11** or higher.
- **Node.js 18** or higher (v20+ recommended).
- **Maven** (optional, if not using the wrapper).

## 3. Configuration and Execution

### Backend
1.  Navigate to the `backend` folder.
2.  Run: `mvn spring-boot:run`
    - The server will start at `http://localhost:8080`.
    - H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/reyval_db`, User: `sa`, Pass: `password`).

### Frontend
1.  Navigate to the `frontend` folder.
2.  Install dependencies: `npm install`
3.  Run: `npm start`
    - The application will start at `http://localhost:4200`.

## 4. Pre-loaded Users (Seed Data)
The system automatically creates Roles (`ROLE_USER`, `ROLE_ADMIN`).
To create an initial administrator, you can register via the API `/api/auth/signup` sending the `admin` role or manually insert into the H2 DB:
```sql
INSERT INTO users (username, email, password) VALUES ('admin', 'admin@reyval.com', '$2a$10$encodedPassword');
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2); -- Assuming ID 2 is Admin
```

## 5. Troubleshooting (Bugs and Fixes)
- **CORS Error**: An Angular Proxy (`proxy.conf.json`) was configured to avoid CORS issues during development.
- **Spring Boot Version**: v2.7.x was used for compatibility with the environment's Java 11.
- **Angular Analytics**: Disabled to avoid hangs during headless installations.

## 6. Additional Modules
### PDF Reports
- **Library**: `com.github.librepdf:openpdf` (v1.3.30).
- **Backend**:
    - `PdfService`: Generates the PDF Blob.
    - `ReporteController`: 
        - `GET /api/reportes/dashboard`: General statistics.
        - `GET /api/reportes/estado-cuenta/{id}`: File download.
- **Frontend**:
    - `VentaService`: Handles `responseType: 'blob'` for download.
    - Access: History Modal in the Inventory table.

## 7. Deployment (Koyeb + Neon.tech)

The backend application is configured to deploy on [Koyeb](https://www.koyeb.com/) using Docker.

### Database (Neon.tech)
A managed PostgreSQL from **Neon.tech** is used with the connection pooler enabled.
- **Required Environment Variables**:
    - `DATABASE_URL`: Connection string (must end in `-pooler...`).
    - `DB_DRIVER`: `org.postgresql.Driver`
    - `DB_DIALECT`: `org.hibernate.dialect.PostgreSQLDialect`

### Deployment Steps on Koyeb
1.  Create a new **Web Service** in Koyeb.
2.  Connect your GitHub repository and select the `./backend` folder.
3.  Choose the **Docker** option (it will detect the Dockerfile automatically).
4.  Configure the **Environment Variables** (DATABASE_URL, DB_DRIVER, DB_DIALECT).
5.  Koyeb will provide a URL like `https://...koyeb.app`. Use it for the frontend.

## 8. Monitoring (Oracle Cloud Server)

Advanced monitoring tools are configured on the Oracle Cloud production server.

### GoAccess (TecnoBit Traffic)
Provides real-time web traffic analysis for the `/tecno/` path.
- **URL**: [http://143.47.101.209/report/](http://143.47.101.209/report/)
- **Geo Location**: Enabled using free DB-IP City Lite database.
- **Note**: If data appears stale, force-refresh the browser (`Ctrl+F5` or `Cmd+Shift+R`).

### Netdata (Server Resources)
Premium monitoring for system performance (CPU, RAM, Network).
- **URL**: [http://143.47.101.209:19999](http://143.47.101.209:19999)
- **Status**: Active. Ensure port `19999` is open in Oracle Cloud Ingress Rules.

### Cockpit (System Admin)
- **URL**: [http://143.47.101.209:9090](http://143.47.101.209:9090)
- **Usage**: Terminal access, system logs, and package management.
