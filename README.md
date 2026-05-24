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
- Registro con correo ya existente.
- Cierre de sesion.
- Agregar producto al carrito.
- Editar cantidades del carrito.
- Eliminar producto del carrito.
- Vaciar carrito completo.
- Persistencia del carrito al cerrar sesion y volver a entrar.
- Validacion de pago con tarjeta invalida.
- Checkout/pago simulado.

Total de casos E2E: 12 escenarios funcionales con Playwright.

Build de produccion:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Alineacion con el Documento Final

El documento final del proyecto define 17 requerimientos funcionales y 9 no funcionales. La implementacion actual cubre los grupos exigidos:

| Grupo | Requerimientos cubiertos | Implementacion |
| --- | --- | --- |
| Usuarios y sesion | RF1, RF2, RF3 | Registro, login JWT y cierre de sesion. |
| Catalogo | RF4, RF5, RF13 | Catalogo con precio, stock y disponibilidad. |
| Carrito CRUD | RF6, RF7, RF8, RF9, RF10, RF11, RF12 | Agregar, listar, actualizar, eliminar, vaciar, persistir y recalcular total. |
| Checkout | RF14, RF15, RF16, RF17 | Pago simulado, confirmacion, orden persistida y limpieza del carrito. |
| Calidad | RNF1, RNF4, RNF5, RNF8, RNF9 | bcrypt, SQLite, transacciones, pruebas 100% y SonarQube sin issues bloqueantes/altos. |

## Historias de Usuario y Criterios Gherkin

Las historias se alinean con el PDF final `Proyecto Final Entrega Parcial Final IS2.pdf`.

### HU01 Registro de cuenta personal

Como cliente potencial, quiero registrar mis datos basicos (nombre, correo y contrasena) para crear una cuenta que me permita ser identificado por la plataforma. Alineacion: RF1.

```gherkin
Feature: Registro de cuenta personal
  Scenario: Registro exitoso de usuario
    Given el usuario se encuentra en la pagina de registro
    When ingresa nombre, correo electronico valido y contrasena
    Then el sistema muestra un mensaje de registro exitoso
    And el usuario puede proceder a iniciar sesion

  Scenario: Registro con correo ya existente
    Given el usuario se encuentra en la pagina de registro
    When ingresa un correo electronico previamente registrado
    Then el sistema muestra un mensaje de error indicando que el correo ya esta en uso
```

### HU02 Acceso y control de sesion

Como usuario registrado, quiero iniciar y cerrar sesion de forma segura para proteger mi informacion personal y mantener la privacidad de mi cuenta. Alineacion: RF2 y RF3.

```gherkin
Feature: Acceso y control de sesion
  Scenario: Inicio de sesion exitoso
    Given el usuario se encuentra en la pagina de inicio de sesion
    When ingresa credenciales validas
    Then el sistema permite el acceso a la cuenta
    And el usuario es redirigido a la pagina principal

  Scenario: Credenciales incorrectas
    Given el usuario se encuentra en la pagina de inicio de sesion
    When ingresa credenciales invalidas
    Then el sistema muestra un mensaje de error de autenticacion

  Scenario: Cierre de sesion
    Given el usuario tiene una sesion activa
    When selecciona la opcion de cerrar sesion
    Then el sistema finaliza la sesion
    And el usuario es redirigido a la pagina de inicio de sesion
```

### HU03 Seleccion y consulta de articulos

Como cliente, quiero visualizar el catalogo de productos con su informacion y disponibilidad para tomar una decision de compra informada. Alineacion: RF4, RF5 y RF13.

```gherkin
Feature: Catalogo de productos
  Scenario: Visualizacion del catalogo de productos
    Given el usuario accede a la plataforma
    When ingresa a la seccion de productos
    Then el sistema muestra la lista de productos disponibles

  Scenario: Consulta de producto sin disponibilidad
    Given el usuario consulta un producto sin stock
    When accede al catalogo
    Then el sistema indica que el producto no se encuentra disponible
```

### HU04 Gestion del ciclo de vida del carrito

Como cliente autenticado, quiero agregar, listar, actualizar cantidades y eliminar productos de mi carrito para gestionar mi pedido antes de pagar. Alineacion: RF6, RF7, RF8, RF9 y RF12.

```gherkin
Feature: CRUD del carrito
  Scenario: Agregar producto al carrito
    Given el usuario visualiza un producto disponible
    When selecciona la opcion de agregar al carrito
    Then el sistema anade el producto al carrito
    And actualiza la cantidad de productos en el carrito

  Scenario: Actualizacion de cantidad de producto
    Given el usuario tiene productos en el carrito
    When modifica la cantidad de un producto
    Then el sistema actualiza la cantidad seleccionada
    And recalcula el subtotal correspondiente

  Scenario: Eliminacion de producto del carrito
    Given el usuario tiene productos en el carrito
    When selecciona la opcion de eliminar un producto
    Then el sistema elimina el producto del carrito

  Scenario: Vaciar carrito completo
    Given el usuario tiene productos en el carrito
    When selecciona la opcion de vaciar carrito
    Then el sistema elimina todas las lineas
    And el subtotal queda en cero
```

### HU05 Persistencia de la seleccion de compra

Como cliente, quiero que los productos agregados permanezcan en mi carrito incluso si cierro sesion, para retomar mi compra despues. Alineacion: RF10.

```gherkin
Feature: Persistencia del carrito
  Scenario: Carrito conservado despues de cerrar sesion
    Given el cliente tiene productos en el carrito
    When cierra sesion y vuelve a iniciar sesion
    Then el sistema conserva los productos agregados previamente
```

### HU06 Revision de costos y totales

Como cliente, quiero visualizar el calculo automatico del subtotal y total segun las cantidades elegidas para conocer el monto exacto a pagar. Alineacion: RF11.

```gherkin
Feature: Calculo de totales
  Scenario: Recalculo por cambio de cantidades
    Given el usuario tiene un producto en el carrito
    When incrementa o disminuye la cantidad
    Then el subtotal y total se recalculan automaticamente
```

### HU07 Finalizacion y confirmacion de compra

Como cliente, quiero realizar una simulacion de pago y recibir una confirmacion de exito que registre mi transaccion y vacie mi carrito. Alineacion: RF14, RF15, RF16 y RF17.

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

## Diseno Arquitectonico

### Vista de contexto

```text
Cliente Web -> Frontend React/Vite -> API Express -> SQLite
                          |              |
                          |              +-> JWT, bcrypt, validadores Zod
                          +-> Playwright/Jest para validacion automatizada
```

### Vista de informacion

```text
Usuario 1---N CarritoItem N---1 Producto
Usuario 1---N Orden 1---N OrdenItem N---1 Producto
Orden almacena total, estado de pago simulado, referencia y ultimos 4 digitos.
```

### Vista de componentes

```text
Frontend
  App/Login/Registro/Tienda/Cart/CartItem
Backend
  routes -> controllers -> services -> db SQLite
Validacion
  Zod en auth/cart, AppError y middleware centralizado
Pruebas
  Jest + Testing Library + Supertest + Playwright
```

## Estrategia de Pruebas

La estrategia sigue la piramide de pruebas:

- Unitarias: validadores, helpers, componentes React, servicios de negocio y middlewares. Herramientas: Jest, Testing Library y Supertest.
- Integracion: API REST con base SQLite en memoria, autenticacion, carrito, checkout y migraciones de base de datos.
- E2E: flujos reales de usuario con Playwright, levantando frontend y backend aislados.
- No funcionales: lint con ESLint, cobertura con Jest y configuracion lista para SonarQube.

Metricas de aceptacion:

- Cobertura unitaria global mayor a 80%; resultado actual: 100% frontend y 100% backend.
- E2E minimo 8 casos; resultado actual: 12 casos.
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
