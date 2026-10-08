# SalesIA Enterprise - Semestre IV - Grupo 1

Aplicación web empresarial para la gestión de ventas, clientes, productos, inventario y análisis estadístico.

## Tecnologías principales

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + FastAPI
- **Base de datos:** PostgreSQL (integración definitiva en desarrollo)
- **Despliegue frontend:** Vercel
- **Despliegue backend:** Render

---

# 1. Estructura general del proyecto

```text
sales-ia-enterprise-grupo-1/
│
├── frontend/
│   ├── src/
│   ├── .env.local
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   ├── .venv/
│   ├── .env
│   ├── .env.example
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

> Los archivos `.env`, `.env.local` y los entornos virtuales no deben subirse a Git.  
> Cada integrante debe crear su propia configuración local.

---

# 2. Requisitos previos

Antes de ejecutar el proyecto, instalar:

- Git
- Node.js
- npm
- Python
- Visual Studio Code u otro editor
- PostgreSQL cuando se integre la base de datos definitiva

Para comprobar las instalaciones:

```bash
git --version
node --version
npm --version
python --version
```

---

# 3. Clonar el proyecto

```bash
git clone URL_DEL_REPOSITORIO
cd sales-ia-enterprise-grupo-1
```

Si ya tienes el proyecto clonado:

```bash
git pull
```

Antes de comenzar a trabajar, verifica tu rama:

```bash
git branch
```

---

# 4. Configurar el Frontend

Entrar a la carpeta:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

## Crear las variables de entorno del frontend

Cada integrante debe crear:

```text
frontend/.env.local
```

Puede hacerse copiando el archivo de ejemplo:

```bash
cp .env.example .env.local
```

El contenido para desarrollo local debe ser:

```env
VITE_API_URL=http://localhost:8000
```

Esta variable indica al frontend dónde se encuentra el backend.

Durante el desarrollo local:

```text
React/Vite
    ↓
http://localhost:8000
    ↓
FastAPI
```

No se debe cambiar manualmente `api.ts` entre localhost y Render.

El frontend obtiene la URL mediante:

```ts
const API_URL = import.meta.env.VITE_API_URL;
```

Por eso cada entorno puede utilizar una URL diferente sin modificar el código.

---

# 5. Configurar el Backend

Desde la raíz del proyecto:

```bash
cd backend
```

## Crear el entorno virtual

La primera vez:

```bash
python -m venv .venv
```

En Git Bash sobre Windows, activarlo con:

```bash
source .venv/Scripts/activate
```

Cuando el entorno está activo normalmente aparecerá algo similar a:

```text
(.venv)
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

## Variables de entorno del backend

Cada integrante puede crear:

```text
backend/.env
```

El archivo puede generarse desde el ejemplo:

```bash
cp .env.example .env
```

Para la etapa actual, el backend puede funcionar sin variables adicionales si todavía no las consume desde el código.

Sin embargo, la estructura recomendada para el proyecto es:

```env
FRONTEND_URL=http://localhost:5173

# Se utilizará cuando PostgreSQL quede integrado.
DATABASE_URL=postgresql://usuario:password@localhost:5432/salesia

# Se utilizará cuando se implemente autenticación.
SECRET_KEY=colocar_clave_local_aqui
```

Cada integrante debe reemplazar los valores según su propia configuración local.

Nunca subir credenciales reales al repositorio.

---

# 6. Forma recomendada de trabajar: 3 terminales

Para desarrollo se recomienda mantener **tres terminales abiertas**.

Esto permite tener frontend, backend y Git funcionando independientemente.

## Terminal 1 — Frontend

Desde la raíz:

```bash
cd frontend
npm run dev
```

Vite normalmente mostrará:

```text
http://localhost:5173
```

Esta terminal debe permanecer abierta mientras se desarrolla el frontend.

---

## Terminal 2 — Backend

Desde la raíz:

```bash
cd backend
source .venv/Scripts/activate
uvicorn main:app --reload
```

FastAPI estará disponible normalmente en:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Esta terminal también debe permanecer abierta mientras se desarrolla.

La opción:

```bash
--reload
```

permite que Uvicorn reinicie automáticamente el backend cuando detecta cambios en archivos Python.

---

## Terminal 3 — Git y comandos generales

Mantener esta terminal en la raíz:

```text
sales-ia-enterprise-grupo-1/
```

Utilizarla para:

```bash
git status
git branch
git pull
git add .
git commit -m "mensaje"
git push
```

También puede utilizarse para inspeccionar archivos, ejecutar builds o realizar otras tareas sin interrumpir frontend ni backend.

---

# 7. Flujo normal de desarrollo local

Con las tres terminales:

```text
TERMINAL 1
Frontend
npm run dev
        │
        ▼
localhost:5173


TERMINAL 2
Backend
uvicorn main:app --reload
        │
        ▼
localhost:8000


TERMINAL 3
Git
git status
git add
git commit
git push
```

El frontend local utilizará:

```env
VITE_API_URL=http://localhost:8000
```

Por lo tanto, para trabajar localmente no es necesario utilizar Render.

---

# 8. Desarrollo local vs producción

El proyecto utiliza distintas variables según el entorno.

## Desarrollo local

```text
Frontend local
http://localhost:5173
        ↓
Backend local
http://localhost:8000
```

Configuración:

```text
frontend/.env.local
```

```env
VITE_API_URL=http://localhost:8000
```

## Producción

```text
Frontend
Vercel
    ↓
Backend
Render
```

En Vercel se configura:

```env
VITE_API_URL=https://URL-DEL-BACKEND.onrender.com
```

Esta variable se configura directamente desde:

```text
Vercel
→ Project
→ Settings
→ Environment Variables
```

No hace falta escribir la URL de Render directamente en el código.

Después de modificar variables en Vercel debe realizarse un nuevo deployment para que Vite utilice los nuevos valores.

---

# 9. Variables de entorno que sí se suben y las que no

## NO subir

```text
frontend/.env.local
backend/.env
```

Estos archivos contienen configuración específica de cada desarrollador y pueden llegar a contener credenciales.

## SÍ subir

```text
frontend/.env.example
backend/.env.example
```

Los archivos `.env.example` sirven para indicar qué variables necesita el proyecto, pero no deben contener contraseñas ni secretos reales.

Ejemplo:

### frontend/.env.example

```env
VITE_API_URL=http://localhost:8000
```

### backend/.env.example

```env
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://usuario:password@localhost:5432/salesia
SECRET_KEY=colocar_clave_aqui
```

Después de clonar el proyecto:

```bash
cd frontend
cp .env.example .env.local
```

y:

```bash
cd ../backend
cp .env.example .env
```

---

# 10. `.gitignore`

El proyecto utiliza un `.gitignore` principal en la raíz.

Debe ignorar, entre otros:

```gitignore
# Variables de entorno
.env
.env.local
.env.*.local

# Permitimos los archivos de ejemplo
!.env.example

# Python
__pycache__/
*.py[cod]
.venv/
venv/

# Node / Vite
node_modules/
dist/
```

Esto evita subir:

- entornos virtuales;
- dependencias de Node;
- archivos compilados de Python;
- builds;
- archivos de configuración local;
- secretos y credenciales.

---

# 11. Comprobar que el proyecto funciona

## Frontend

```bash
cd frontend
npm run build
```

Si termina correctamente deberá aparecer algo similar a:

```text
✓ built in ...
```

Luego:

```bash
npm run dev
```

## Backend

Con el entorno virtual activo:

```bash
cd backend
uvicorn main:app --reload
```

Abrir:

```text
http://localhost:8000/
```

y Swagger:

```text
http://localhost:8000/docs
```

---

# 12. Problemas frecuentes

## `Failed to fetch`

Comprobar que el backend esté ejecutándose:

```bash
uvicorn main:app --reload
```

Comprobar también:

```text
frontend/.env.local
```

Debe contener:

```env
VITE_API_URL=http://localhost:8000
```

Si se acaba de modificar `.env.local`, reiniciar Vite:

```bash
Ctrl + C
npm run dev
```

---

## `404 Not Found`

El servidor está funcionando, pero el endpoint solicitado no existe.

Revisar Swagger:

```text
http://localhost:8000/docs
```

para confirmar qué endpoints están registrados.

---

## `ERR_CONNECTION_REFUSED`

Normalmente significa que el frontend intenta conectarse a una dirección donde no hay ningún servidor ejecutándose.

En desarrollo, confirmar que FastAPI esté activo en:

```text
http://localhost:8000
```

---

## Cambios en `.env` no se reflejan

Reiniciar el proceso correspondiente.

Frontend:

```bash
Ctrl + C
npm run dev
```

Backend:

```bash
Ctrl + C
uvicorn main:app --reload
```

---

# 13. Flujo recomendado antes de subir cambios

Primero comprobar:

```bash
git status
```

Para cambios del frontend:

```bash
cd frontend
npm run build
```

Si el build termina correctamente, volver a la raíz:

```bash
cd ..
```

Agregar cambios:

```bash
git add .
```

Crear commit:

```bash
git commit -m "feat: descripción del cambio"
```

Subir:

```bash
git push
```

Evitar subir cambios que no hayan sido probados localmente.

---

# 14. Importante para el equipo

Cada integrante debe mantener su propia configuración local.

No modificar el código únicamente para cambiar entre:

```text
localhost
```

y:

```text
Render
```

La selección de backend debe realizarse mediante variables de entorno.

La idea es que el mismo código funcione en todos los ambientes:

```text
MISMO CÓDIGO
    │
    ├── desarrollo → .env.local → localhost
    │
    └── producción → Vercel → Render
```

Esto evita conflictos entre integrantes y facilita el despliegue.

---

# 15. Resumen rápido para un integrante nuevo

Después de clonar:

## Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Backend

En otra terminal:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

## Git

En una tercera terminal, desde la raíz:

```bash
git status
git branch
```

Después de esto:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8000

Swagger:
http://localhost:8000/docs
```

El proyecto queda preparado para desarrollar y probar cambios localmente.
