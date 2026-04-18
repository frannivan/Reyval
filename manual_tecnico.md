# Manual Técnico de Despliegue - REYVAL (NestJS + Angular)

Este manual documenta el pipeline correcto para levantar la arquitectura oficial de tu ERP Reyval (**NestJS Node.js + Angular**) en un entorno Ubuntu limpio y de forma independiente.

---

## FASE 1: Obtención del Código

**1. Descarga el repositorio nuevo de Reyval:**
```bash
cd /home/ubuntu
git clone git@github.com:frannivan/Reyval.git
# Si ya existe: cd /home/ubuntu/Reyval && git pull
```

---

## FASE 2: Levantamiento del BACKEND (NestJS / Node.js)

Tu cerebro de base de datos y procesamiento corre en **NestJS**. 

**1. Entrar a la carpeta del Backend-API e Instalar:**
```bash
cd /home/ubuntu/Reyval/backend-api
npm install
```

**2. Generar Cliente Prisma (Base de Datos):**
```bash
npx prisma generate
```

**3. Iniciar Backend con PM2:**
```bash
pm2 start "npm run start" --name "reyval-backend"
pm2 save --force
```
*(Nota: El backend corre internamente en el puerto **3001**).*

---

## FASE 3: Compilación del FRONTEND (Angular)

**1. Entrar y Compilar la Interfaz Visual:**
```bash
cd /home/ubuntu/Reyval/frontend
npm install
npm run build
```

**2. Puesta en Producción (NGINX Independiente):**
En el archivo `/etc/nginx/sites-available/reyval`, la ruta raíz debe apuntar a la carpeta compilada limpia:

```nginx
server {
    listen 80;
    server_name reyval.duckdns.org;

    root /home/ubuntu/Reyval/frontend/dist/reyval-ui/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ^~ /api/ {
        proxy_pass http://localhost:3001/api/;
    }
}
```

---

## FASE 4: Seguridad SSL (DuckDNS)
```bash
sudo certbot --nginx -d reyval.duckdns.org
```
