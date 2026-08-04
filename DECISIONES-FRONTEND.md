# Decisiones — Frontend

Este documento cubre únicamente la parte de frontend, construida por
separado del backend NestJS descrito en la prueba técnica.

## 1. Contrato de API asumido

Como no se implementó el backend en este repositorio, el frontend se
construyó contra el siguiente contrato asumido. Si el backend real difiere,
solo hay que ajustar `src/api/*.ts`.

```
POST /auth/login
  body:  { username: string, password: string }
  resp:  { access_token: string }   // también se acepta "accessToken"

  El JWT (HS256) devuelto trae el rol embebido en el payload, no en un
  objeto "user" separado:
  { sub: number, username: string, role: 'admin' | string, iat: number, exp: number }

GET /lockers
  resp:  Locker[]

GET /lockers/:id
  resp:  Locker

PATCH /lockers/:id/status        (requiere Bearer token de admin)
  body:  { doorStatus?: 'abierto' | 'cerrado', occupancyStatus?: 'ocupado' | 'vacio' }
  resp:  Locker

POST /auth/register
  body:  { username: string, password: string }
  resp:  { access_token: string } (o "accessToken") si el backend loguea
         automáticamente al registrar; o 201 sin token si solo crea el
         usuario y exige login aparte (el frontend soporta ambos casos:
         si no hay token, redirige a /login con un mensaje de éxito).

GET /lockers/:id/bookings
  resp:  Booking[]

GET /users                        (requiere Bearer token de admin)
  resp:  AppUser[]

GET /users/:id/bookings           (requiere Bearer token de admin)
  resp:  Booking[]   // idealmente enriquecido con lockerCode/lockerSize;
                      // si no, el frontend cruza lockerId contra GET /lockers

AppUser = { id, username, role, createdAt? }

POST /lockers                     (requiere Bearer token de admin)
  body:  { code: string, size: 'S'|'M'|'L' }
  resp:  Locker   // se asume que el backend crea el casillero con puerta
                   // cerrada y ocupación vacía por defecto

POST /users                       (requiere Bearer token de admin)
  body:  { username: string, password: string, role: string }
  resp:  AppUser  // se usa con role: 'admin' para que un admin cree a otro

POST /lockers/:id/bookings       (requiere Bearer token)
  body:  { startTime: ISOString, endTime: ISOString, note?: string }
  resp:  Booking

Locker = { id, code, size: 'S'|'M'|'L', doorStatus, occupancyStatus, updatedAt? }
Booking = { id, lockerId, startTime, endTime, note?, createdAt? }
```

Errores esperados como JSON `{ message: string | string[] }`, que es el
formato por defecto de las excepciones HTTP de NestJS — así los mensajes de
validación y de conflicto de horario se pueden mostrar directamente en la UI.

## 2. Modelado del estado del casillero

El enunciado pide dos dimensiones independientes: **puerta**
(`abierto`/`cerrado`) y **ocupación** (`ocupado`/`vacío`). El frontend no
colapsa esto en un único enum; mantiene ambos campos separados y deriva la
presentación visual cruzando las 4 combinaciones (`getStatusMeta` en
`src/types/locker.ts`):

| Puerta   | Ocupación | Estado mostrado                  | Color   |
|----------|-----------|-----------------------------------|---------|
| cerrado  | vacío     | Disponible                        | verde   |
| abierto  | vacío     | Disponible · puerta abierta       | ámbar   |
| cerrado  | ocupado   | Ocupado                           | gris/azul |
| abierto  | ocupado   | Ocupado · puerta abierta (alerta) | rojo    |

**Supuesto:** la única combinación tratada como "alerta" es
ocupado + abierto, porque es la única que representa un riesgo real (un
casillero con contenido y la puerta sin asegurar). Las otras 3 son estados
operativos normales.

## 3. Autenticación / rol de administrador

- Login con `username`/`password` contra `/auth/login`. El backend devuelve
  un JWT (`access_token` o `accessToken`) firmado con HS256 cuyo payload ya
  trae `sub`, `username`, `role`, `iat` y `exp` — el frontend decodifica ese
  payload en el cliente (`decodeJwt` en `src/api/auth.ts`, sin verificar
  firma, solo para leer claims) en vez de pedir un `/auth/profile` aparte.
- El token se guarda en `localStorage` (`locker_auth_token`) y se envía como
  `Authorization: Bearer <token>` en las peticiones que lo requieren.
- Al cargar la app se valida `exp` contra la hora actual; si el token ya
  expiró, se descarta y se trata como sesión anulada.
- **Supuesto:** el listado y detalle de casilleros son de lectura pública
  (no requieren login), tal como pide el enunciado ("debe existir un
  frontend que permita visualizar..."). Solo el cambio de estado exige rol
  `admin`.
- **Supuesto:** existe un único rol relevante para el frontend (`admin`);
  cualquier otro valor de `role` se trata como usuario no administrador y
  solo ve controles de solo lectura.
- Se agregó registro de usuarios "normales" (`/register`, componente
  `RegisterPage`) contra `POST /auth/register` con `{ username, password }`.
  **Supuesto:** el rol por defecto que asigna el backend a un usuario
  registrado por esta vía nunca es `admin` (los admins se crean por otro
  medio, ej. seed/consola). El frontend no permite elegir rol en el
  formulario de registro.

## 4. Agendamiento (bookings)

- Se asume que agendar un casillero requiere sesión iniciada (no
  necesariamente rol admin), y que la validación de no solapamiento de
  horarios se hace en el backend; el frontend solo valida en el cliente que
  `fin > inicio` y muestra el mensaje de error que devuelva la API si hay
  conflicto (ej. HTTP 409).
- **Simplificación por tiempo:** el formulario no filtra visualmente huecos
  disponibles ni muestra un calendario; lista las reservas existentes en
  orden cronológico y deja que el backend rechace solapamientos.

## 5. Decisiones de arquitectura del frontend

- **Vite + React + TypeScript**, sin framework adicional de estado global:
  el estado remoto se maneja con hooks simples (`useLockers`) más
  `AuthContext` para la sesión, suficiente para el alcance del reto.
- **CSS plano con variables (tokens)** en `src/index.css` en lugar de una
  librería de UI, para controlar bien la semántica visual de los 4 estados.
- Capa `src/api/` separada de los componentes: cada recurso (auth, lockers,
  bookings) tiene su propio archivo sobre un `client.ts` común que centraliza
  headers, token y manejo de errores.
- El detalle de un casillero se muestra en un panel lateral (drawer) en vez
  de una ruta aparte, para mantener el contexto del tablero.

## 6. Panel de usuarios (admin)

- Ruta `/admin/usuarios`, visible en el header solo cuando `isAdmin` es
  `true`. Si alguien entra directo a la URL sin ser admin, se muestra un
  mensaje en vez del listado (no es una ruta protegida a nivel de router,
  el backend sigue siendo la única barrera real).
- Lista usuarios (`GET /users`) y, al hacer clic en uno, carga sus reservas
  (`GET /users/:id/bookings`) de forma perezosa (solo la primera vez que se
  expande cada usuario).
- **Supuesto:** `GET /users/:id/bookings` reutiliza la misma forma que
  `Booking`. Si el backend no incluye `lockerCode`, el frontend lo resuelve
  cruzando `lockerId` contra el listado de `GET /lockers` (por eso esta
  página también pide los casilleros al cargar).
- **Supuesto:** "casilleros que tiene reservados o ha usado" se interpreta
  como el historial completo de reservas del usuario (pasadas y futuras),
  no solo la reserva activa en este momento; no se aplicó filtro de fechas
  para mantenerlo simple.
- Botón **"+ Nuevo casillero"** en el tablero (`BoardPage`), visible solo si
  `isAdmin`. Abre un modal con `CreateLockerForm` → `POST /lockers` con
  `{ code, size }`; el estado inicial (puerta/ocupación) se asume que lo
  pone el backend por defecto, el formulario no lo pide para mantenerlo
  simple.
- Botón **"+ Nuevo administrador"** en `AdminUsersPage`. Abre un modal con
  `CreateAdminForm` → `POST /users` con `{ username, password, role: 'admin' }`.
  **Supuesto:** este es el mismo recurso `/users` que ya se usa para listar,
  y crear con `role: 'admin'` es suficiente para que el backend otorgue
  privilegios de administrador (no hay un endpoint separado tipo
  `/admin/invite`).

## 7. No implementado / pendiente

- Backend real (NestJS + SQL) — este repo es solo frontend.
- Tests automatizados (unitarios de `getStatusMeta` y de componentes clave
  con React Testing Library) — no alcanzó el tiempo, se dejarían como
  siguiente paso.
- Paginación / búsqueda por código si el número de casilleros crece.
- Manejo de expiración/renovación de token (actualmente si el token expira,
  las peticiones protegidas simplemente devuelven error y se muestra el
  banner correspondiente).
- Vista de calendario para bookings (actualmente es una lista simple).

## 8. Cómo levantar el proyecto

Ver `README.md`. Resumen:

```bash
npm install
cp .env.example .env
npm run dev
```

Requiere un backend disponible en `VITE_API_URL` (por defecto
`http://localhost:3000`) que cumpla el contrato de la sección 1.
