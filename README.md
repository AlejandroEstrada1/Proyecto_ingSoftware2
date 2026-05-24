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

- Frontend: 100% statements, 100% branches, 100% functions, 100% lines.
- Backend: 100% statements, 100% branches, 100% functions, 100% lines.

Pruebas E2E con Playwright:

```bash
npm run testse2e
```

Tambien se puede ejecutar con el alias solicitado en la guia:

```bash
npm run tests:e2e
```

Los E2E levantan una API aislada en `3044` y Vite en `5180`. Cubren:

- Login.
- Login con credenciales invalidas.
- Registro.
- Registro con confirmacion de contrasena invalida.
- Agregar producto al carrito.
- Editar cantidades del carrito.
- Eliminar producto del carrito.
- Vaciar carrito completo.
- Validacion de pago con tarjeta invalida.
- Checkout/pago simulado.

Total de casos E2E: 9 escenarios funcionales con Playwright.

Build de produccion:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Historias de Usuario y Criterios Gherkin

### HU-01 Registro de usuario

Como visitante, quiero crear una cuenta con mi nombre, correo y contrasena, para poder comprar productos en EcoMart.

```gherkin
Feature: Registro de usuarios
  Scenario: Registro exitoso
    Given el visitante se encuentra en la pantalla de registro
    When diligencia nombre, correo y contrasena valida
    Then el sistema crea la cuenta
    And muestra confirmacion de registro

  Scenario: Confirmacion de contrasena invalida
    Given el visitante se encuentra en la pantalla de registro
    When diligencia contrasenas diferentes
    Then el sistema muestra "Las contrasenas no coinciden."
```

### HU-02 Login de usuario

Como usuario registrado, quiero iniciar sesion con mis credenciales, para acceder a mi carrito y catalogo.

```gherkin
Feature: Login
  Scenario: Login exitoso
    Given existe un usuario registrado
    When ingresa correo y contrasena validos
    Then accede al catalogo de EcoMart
    And ve su nombre en la barra superior

  Scenario: Login fallido
    Given el usuario esta en la pantalla de login
    When ingresa credenciales incorrectas
    Then el sistema muestra un mensaje de error
```

### HU-03 Gestion del carrito

Como cliente, quiero agregar, editar, eliminar y vaciar productos del carrito, para controlar mi compra antes del pago.

```gherkin
Feature: CRUD del carrito
  Scenario: Agregar producto
    Given el cliente inicio sesion
    When agrega un producto del catalogo
    Then el producto aparece en el carrito
    And el subtotal se actualiza

  Scenario: Editar cantidades
    Given el cliente tiene un producto en el carrito
    When incrementa y decrementa la cantidad
    Then el sistema recalcula el total

  Scenario: Eliminar producto
    Given el cliente tiene un producto en el carrito
    When elimina la linea del carrito
    Then el carrito queda sin esa linea

  Scenario: Vaciar carrito
    Given el cliente tiene productos en el carrito
    When pulsa "Vaciar carrito"
    Then el carrito queda vacio
    And el subtotal queda en cero
```

### HU-04 Pago simulado

Como cliente, quiero pagar el carrito mediante un checkout simulado, para confirmar la compra y recibir un numero de pedido.

```gherkin
Feature: Checkout simulado
  Scenario: Pago exitoso
    Given el cliente tiene productos en el carrito
    When diligencia una tarjeta ficticia valida
    And confirma el pago
    Then el sistema registra el pedido
    And muestra total, numero de pedido y ultimos 4 digitos de la tarjeta

  Scenario: Pago invalido
    Given el cliente tiene productos en el carrito
    When diligencia una tarjeta invalida
    Then el sistema bloquea el pago
    And muestra el error de validacion
```

## Estrategia de Pruebas

La estrategia sigue la piramide de pruebas:

- Unitarias: validadores, helpers, componentes React, servicios de negocio y middlewares. Herramientas: Jest, Testing Library y Supertest.
- Integracion: API REST con base SQLite en memoria, autenticacion, carrito, checkout y migraciones de base de datos.
- E2E: flujos reales de usuario con Playwright, levantando frontend y backend aislados.
- No funcionales: lint con ESLint, cobertura con Jest y configuracion lista para SonarQube.

Metricas de aceptacion:

- Cobertura unitaria global mayor a 80%; resultado actual: 100% frontend y 100% backend.
- E2E minimo 8 casos; resultado actual: 9 casos.
- Ejecucion local con `npm run dev`.
- Build de produccion con `npm run build`.

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
