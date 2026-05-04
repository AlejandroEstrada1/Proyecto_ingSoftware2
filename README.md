# EcoMart

Plataforma de comercio digital para proyecto final de ingeniería de software: **React (Vite) + Node (Express) + SQLite**, con autenticación JWT, contraseñas con **bcrypt**, carrito persistente por usuario y **checkout simulado**.

## Arquitectura (por qué está así)

| Decisión | Motivo |
|----------|--------|
| **SQLite + `better-sqlite3`** | Persistencia real sin instalar servidor de base de datos; consultas **parametrizadas** evitan inyección SQL. |
| **JWT en cabecera `Authorization`** | API stateless, escalable y estándar; expiración configurable (`JWT_EXPIRES_IN`) limita el riesgo si roban el token. |
| **bcrypt** | Las contraseñas nunca se guardan en texto plano; ante filtración de BD el coste de romper hashes es alto. |
| **Zod en validación** | Errores de entrada homogéneos (`400`) con `details` estructurados; menos lógica duplicada en controladores. |
| **Servicios + controladores finos** | Mantiene la API testeable y alineada con buenas prácticas (SonarQube: funciones con una responsabilidad). |
| **Carrito en tablas `cart_items`** | El carrito **pertenece al usuario** y sobrevive cierres de sesión: al volver a iniciar sesión con el mismo usuario los ítems siguen en servidor. |

## Requisitos

- Node.js **18+** (recomendado 20 LTS)
- npm 9+

## Puesta en marcha

### 1. Backend — variables de entorno

```bash
cd backend
copy .env.example .env
```

En macOS/Linux: `cp .env.example .env`

Edita `.env` y define al menos **`JWT_SECRET`** (cadena larga y aleatoria). Nunca subas `.env` al repositorio.

### 2. Instalar dependencias

Desde la **raíz del proyecto** (donde está el `package.json` del frontend):

```bash
npm install
cd backend && npm install && cd ..
```

### 3. Arranque en desarrollo

```bash
npm run dev
```

Levanta en paralelo:

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3001  

El archivo **`.env.development`** fija `VITE_API_URL=http://127.0.0.1:3001` para que registro/login hablen siempre con Express (evita peticiones al puerto de Vite por error). El backend usa CORS por **función** que admite cualquier puerto en `localhost` y `127.0.0.1`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite + API con recarga (`concurrently`). |
| `npm run build` | Build de producción del frontend. |
| `npm run tests` | Tests unitarios del backend + cobertura (Jest). |
| `npm run tests:e2e` | E2E con Playwright (levanta `npm run dev` si hace falta). |

### Tests E2E (Playwright)

La primera vez instala el navegador usado por los tests:

```bash
npx playwright install chromium
```

Los tests levantan **su propia API en el puerto 3044** y **Vite en 5180** (ver `e2e/constants.js`) para no chocar con un `npm run dev` habitual. Cierra otros procesos en esos puertos si Playwright avisa que están en uso.

Los escenarios viven en `e2e/` y cubren:

1. **Login:** usuario creado vía API → login en UI → catálogo visible.  
2. **Carrito + checkout:** login → añadir producto → simular pago → mensaje con número de pedido.

## API REST (resumen)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Registro; respuesta incluye `token` y `user`. |
| `POST` | `/auth/login` | No | Login; devuelve `token` y `user`. |
| `GET` | `/products` | No | Catálogo (stock en vivo). |
| `GET` | `/cart` | JWT | Carrito con `items` y `subtotal`. |
| `POST` | `/cart/items` | JWT | Body: `{ productId, quantity }`. |
| `PUT` | `/cart/items/:id` | JWT | Body: `{ quantity }` (`id` = fila `cart_items`). |
| `DELETE` | `/cart/items/:id` | JWT | Elimina línea. |
| `POST` | `/cart/checkout` | JWT | Pedido + descuento de stock + carrito vacío. |

Errores JSON: `{ "error": "mensaje", "details?": ... }` con códigos `400`, `401`, `404`, `409`, `500` según caso.

## Resultados de tests (referencia)

Tras `npm run tests` (Jest en `backend/`), en un entorno local reciente se obtuvo aproximadamente:

- **Statements / líneas:** ~90%  
- **Funciones:** ~97%  
- **Ramas:** ~60% global (las ramas de middleware de errores y JWT tienen muchas combinaciones; el umbral de ramas en Jest está fijado de forma conservadora; líneas y funciones superan el 80% académico pedido).

Ejecuta siempre `npm run tests` en tu máquina antes de la sustentación y adjunta el informe de cobertura generado en `backend/coverage/`.

## SonarQube / calidad

- Sin secretos en código: usar `.env` (ver `.env.example`).  
- Sin rutas antiguas `/api/...` mezcladas: la API nueva es `/auth`, `/cart`, `/products`.  
- Errores async propagados al middleware mediante `asyncHandler`.

## Estructura de carpetas

```
├── backend/
│   ├── src/           # app, server, rutas, servicios, middleware
│   ├── tests/         # Jest
│   ├── data/          # SQLite (gitignored *.db)
│   └── .env.example
├── e2e/               # Playwright
├── src/               # React
└── playwright.config.js
```

---

Proyecto académico EcoMart — **no usar en producción** sin endurecer despliegue (HTTPS, rotación de secretos, rate limiting, etc.).
