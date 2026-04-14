# Configuración de Despliegue (Reyval)

## 1. Backend (Render)
*   **Tipo**: Web Service (Docker)
*   **Root Directory**: `backend` (o `.` si subes solo la carpeta backend)
*   **Runtime**: Docker
*   **Environment Variables**:
    *   `PORT`: `8080`
    *   `DB_URL`: `jdbc:h2:mem:reyvaldb;DB_CLOSE_DELAY=-1` (Por defecto usará H2 en memoria)
    *   `JWT_SECRET`: (Opcional, usa un valor largo y seguro)

## 2. Frontend (Vercel)
*   **Framework Preset**: Angular
*   **Root Directory**: `frontend`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist/browser`
*   **Install Command**: `npm install`

## 3. URLs Importantes
*   **Frontend Environment**: Asegúrate de que `frontend/src/environments/environment.prod.ts` tenga la URL de tu backend en Render.
    ```typescript
    export const environment = {
      production: true,
      apiUrl: 'https://tu-servicio-backend.onrender.com/api'
    };
    ```
