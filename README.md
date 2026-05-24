# EcoMart

EcoMart es una aplicacion de comercio digital construida con React, Vite, Node.js, Express y SQLite. Incluye registro de usuarios, login con JWT, carrito persistente por usuario, CRUD completo del carrito y checkout/pago simulado con formulario de tarjeta ficticia.

## Tecnologias

- Frontend: React 19, Vite, CSS.
- Backend: Node.js, Express, SQLite con `better-sqlite3`.
- Seguridad: JWT, bcrypt, validaciones con Zod.
- Pruebas: Jest, Testing Library, Supertest y Playwright.
- Calidad: ESLint, cobertura Jest y configuracion de SonarQube.

## Requisitos

- Node.js `>=20 <27`.
- npm `>=9`.
- Para SonarQube: servidor SonarQube activo y `SONAR_TOKEN`.

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
cd backend
npm install
cd ..
```

## Configuracion Local

### Frontend

El archivo `.env.development` usa rutas relativas y proxy de Vite hacia el backend local. Si necesitas otro puerto de API, crea `.env.development.local`:

```bash
VITE_PROXY_TARGET=http://127.0.0.1:3001
```

Tambien puedes usar una URL absoluta:

```bash
VITE_API_URL=http://127.0.0.1:3001
```

### Backend

El backend puede iniciar en desarrollo sin `.env` porque genera un `JWT_SECRET` efimero al arrancar. Para sesiones estables entre reinicios, usa `backend/.env.example` como referencia:

```bash
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=8h
DATABASE_PATH=./data/ecmart.db
```

No subas archivos `.env` reales al repositorio.

## Ejecucion

Para levantar frontend y backend juntos:

```bash
npm run dev
```

Servicios esperados:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`

## Pruebas

Unitarias y de integracion con cobertura:

```bash
npm run tests
```

Este comando ejecuta frontend y backend. La cobertura validada localmente queda por encima del 80%:

- Frontend: 88.84% statements, 80% branches, 86.53% functions, 91.13% lines.
- Backend: 90.54% statements, 62.37% branches, 97.67% functions, 90.84% lines.

Pruebas E2E con Playwright:

```bash
npm run testse2e
```

Los E2E levantan una API aislada en `3044` y Vite en `5180`. Cubren:

- Login.
- Registro.
- Agregar producto al carrito.
- Eliminar producto del carrito.
- Checkout/pago simulado.

Build de produccion:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## SonarQube

El proyecto incluye `sonar-project.properties` y el script:

```bash
npm run sonar
```

Requisitos para ejecutar el analisis:

```bash
set SONAR_TOKEN=tu_token
npm run tests
npm run sonar -- -Dsonar.host.url=http://localhost:9000 -Dsonar.token=%SONAR_TOKEN%
```

En PowerShell:

```powershell
$env:SONAR_TOKEN="tu_token"
npm run tests
npm run sonar -- -Dsonar.host.url=http://localhost:9000 -Dsonar.token=$env:SONAR_TOKEN
```

La configuracion envia los reportes `coverage/lcov.info` y `backend/coverage/lcov.info`, excluye `node_modules`, `dist`, archivos de cobertura y archivos de entrada no testeables.

## API REST

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Estado de la API. |
| `POST` | `/auth/register` | No | Registro de usuario. Devuelve `user` y `token`. |
| `POST` | `/auth/login` | No | Login. Devuelve `user` y `token`. |
| `GET` | `/products` | No | Catalogo con stock disponible. |
| `GET` | `/cart` | Si | Obtiene carrito persistente del usuario. |
| `POST` | `/cart/items` | Si | Agrega producto o incrementa cantidad. |
| `PUT` | `/cart/items/:id` | Si | Actualiza cantidad de una linea. |
| `DELETE` | `/cart/items/:id` | Si | Elimina una linea del carrito. |
| `DELETE` | `/cart` | Si | Vacia el carrito completo. |
| `POST` | `/cart/checkout` | Si | Valida pago simulado, crea pedido, descuenta stock y vacia carrito. |

Payload de checkout:

```json
{
  "payment": {
    "cardholder": "Cliente Prueba",
    "cardNumber": "4111111111111111",
    "expiry": "12/99",
    "cvv": "123"
  }
}
```

La tarjeta no se almacena completa. El backend solo devuelve estado simulado, codigo de autorizacion y ultimos 4 digitos.

## Decisiones Tecnicas

- SQLite evita depender de un servidor externo de base de datos y permite persistencia real para un proyecto academico.
- `better-sqlite3@12.10.0` se usa por compatibilidad con Node 20 a 26, incluyendo Node 24 en Windows.
- JWT via `Authorization: Bearer` mantiene la API stateless.
- bcrypt evita almacenar contrasenas en texto plano.
- Zod centraliza validaciones y genera errores estructurados.
- El carrito vive en backend por usuario, no solo en `localStorage`, por lo que persiste entre sesiones.
- El checkout es simulado: valida datos de tarjeta ficticia, valida carrito, valida stock, crea orden, registra lineas, descuenta inventario y limpia carrito dentro de una transaccion.
- Los scripts de entrega son los comandos fuente de verdad: `npm run dev`, `npm run tests` y `npm run testse2e`.

## Estructura

```text
backend/
  src/
    controllers/
    middleware/
    routes/
    services/
    validators/
  tests/
e2e/
src/
  componentes/
  lib/
  __tests__/
```
