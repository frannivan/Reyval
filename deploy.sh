#!/bin/bash
echo "🚀 Iniciando despliegue de Reyval (NestJS + Angular)..."

# 1. Construir el Backend (NestJS)
echo "📦 Configurando el Backend..."
cd backend-api
npm install
npx prisma generate
npx prisma db push --accept-data-loss
node prisma/seed.js
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend (NestJS) listo y con datos."
else
    echo "❌ Error al construir el backend. Abortando."
    exit 1
fi

# 2. Reiniciar el servicio con PM2
echo "🔄 Reiniciando Reyval Backend en PM2..."
pm2 restart "reyval-backend" || pm2 start "npm run start" --name "reyval-backend"

# 3. Construir el Frontend (Angular)
echo "🎨 Compilando el Frontend (Angular)..."
cd ../frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend compilado con éxito."
    echo "🚀 Despliegue de Reyval completado. Accede por tu nueva URL."
else
    echo "❌ Error al compilar el frontend."
    exit 1
fi
