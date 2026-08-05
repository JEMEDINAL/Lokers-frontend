# Decisiones — Frontend

## 1. Contrato de API 


backend ya está construido y el frontend está integrado contra él.

```
POST /auth/login
  body:  { username: string, password: string }
  resp:  { access_token: string, user: { id, username, role } }

  El JWT (HS256) trae el rol embebido en el payload:
  { sub: number, username: string, role: 'admin' | 'user', iat: number, exp: number }

POST /auth/register-user           (público, sin token)
  body:  { username: string, password: string }
  resp:  { id: number, username: string }
  Crea siempre un usuario con role 'user'. No devuelve token: el frontend
  redirige a /login tras un registro exitoso.

POST /auth/register                (requiere Bearer token de admin)
  body:  { username: string, password: string }
  resp:  { id: number, username: string, role: 'admin' }
  Es el mismo endpoint que se usa para crear nuevos administradores desde
  el panel de usuarios — no existe un endpoint separado tipo /admin/invite.

GET /lockers
  resp:  Locker[]

GET /lockers/:id
  resp:  Locker

POST /lockers                      (requiere Bearer token de admin)
  body:  { code: string, size: 'S'|'M'|'L' }
  resp:  Locker   // el backend crea el casillero con doorStatus 'cerrado',
                   // occupancyStatus 'vacio' e isMaintenance false por defecto

PATCH /lockers/:id/status          (requiere Bearer token de admin)
  body:  { doorStatus?: 'abierto'|'cerrado', occupancyStatus?: 'ocupado'|'vacio',
           isMaintenance?: boolean }
  resp:  Locker
  El backend valida que no se pueda guardar doorStatus 'abierto' junto con
  occupancyStatus 'ocupado' (estado inconsistente) y responde 400 en ese caso.

DELETE /lockers/:id                (requiere Bearer token de admin)
  resp:  204 sin cuerpo

GET /reservations
  resp:  Reservation[]   // todas las reservas, ordenadas por startTime;
                          // se usa para calcular las reservas de un
                          // casillero específico filtrando en el cliente
                          // (no existe GET /lockers/:id/bookings)

GET /reservations/user/:reservedBy
  resp:  Reservation[]
  IMPORTANTE: el filtro es por username (reservedBy), no por id de usuario.
  El panel de admin llama a este endpoint con user.username, aunque
  internamente indexa los resultados en su estado local por user.id.

GET /reservations/:id
  resp:  Reservation

POST /reservations                 (sin guard de autenticación en el backend;
                                     el frontend igual exige sesión iniciada
                                     para poder enviar reservedBy)
  body:  { lockerId: number, reservedBy: string, lockerCode: string,
           startTime: ISOString, endTime: ISOString, note?: string }
  resp:  Reservation
  El backend valida startTime < endTime y rechaza solapamientos de horario
  para el mismo lockerId con 409 Conflict.

DELETE /reservations/:id/end       (requiere Bearer token; solo el dueño
                                     de la reserva, comparado por username)
  resp:  204 sin cuerpo
  Termina la reserva eliminándola por completo (no se conserva historial)
  y libera el casillero: occupancyStatus 'vacio', doorStatus 'cerrado'.

PATCH /reservations/:id/open-door  (requiere Bearer token; solo el dueño
                                     de la reserva, comparado por username)
  resp:  Reservation
  Solo funciona si el momento actual está dentro de [startTime, endTime]
  de la reserva; si no, responde 400. Pone doorStatus 'abierto' en el
  casillero asociado.

GET /users                         (requiere Bearer token de admin)
  resp:  AppUser[]   // sin passwordHash

Locker = { id, code, size: 'S'|'M'|'L', doorStatus: 'abierto'|'cerrado',
           occupancyStatus: 'ocupado'|'vacio', isMaintenance: boolean,
           createdAt?, updatedAt? }

Reservation = { id, lockerId, reservedBy, codeLoker, startTime, endTime,
                createdAt, note?, locker: Locker }
                // nótese "codeLoker", no "lockerCode", en la respuesta

AppUser = { id, username, role, createdAt? }
```



## 2. Modelado del estado del casillero

El casillero tiene **tres** campos independientes, no dos: `doorStatus`,
`occupancyStatus` y `isMaintenance`. `isMaintenance` tiene prioridad visual
sobre los otros dos: si está en mantenimiento, se muestra ese estado sin
importar la combinación de puerta/ocupación (`getStatusMeta` en
`src/types/locker.ts`).

| isMaintenance | Puerta   | Ocupación | Estado mostrado                    | Color   |
|---------------|----------|-----------|-------------------------------------|---------|
| true          | —        | —         | En mantenimiento                    | morado  |
| false         | cerrado  | vacío     | Disponible                          | verde   |
| false         | abierto  | vacío     | Disponible · puerta abierta         | ámbar   |
| false         | cerrado  | ocupado   | Ocupado                             | gris/azul |
| false         | abierto  | ocupado   | Ocupado · puerta abierta (alerta)   | rojo    |

**Supuesto (confirmado por el backend):** la única combinación de
puerta/ocupación tratada como "alerta" es ocupado + abierto. El backend
además rechaza guardar esa combinación directamente vía `PATCH
/lockers/:id/status`, así que en la práctica ese estado
solo puede darse si un usuario abre la puerta de su propia reserva activa
mientras el casillero ya estaba marcado como ocupado — flujo válido y
esperado, no un bug.

## 3. Autenticación / rol de administrador

- Login con `username`/`password` contra `/auth/login`. El backend devuelve
  tanto el `access_token` (HS256, con `sub`, `username`, `role`, `iat`,
  `exp`) como un objeto `user` plano. El frontend usa los claims
  decodificados del JWT para las llamadas que necesitan el username actual
  (por ejemplo, para armar `reservedBy` al crear una reserva).
- El token se guarda en `localStorage` (`locker_auth_token`) y se envía
  como `Authorization: Bearer <token>` en las peticiones protegidas.
- Al cargar la app se valida `exp` contra la hora actual; si expiró, se
  descarta y se trata como sesión anulada.
- Los roles reales son `'admin'` y `'user'` (antes se documentaba como
  "cualquier valor distinto de admin"); ahora está confirmado que el
  backend asigna `'user'` explícitamente en el registro público.
- Listado y detalle de casilleros son de lectura pública (no requieren
  login). Cambiar el estado de un casillero exige rol `admin` (impuesto
  también por el backend con `@Roles(Role.ADMIN)`, no solo en el frontend).
- El registro público (`RegisterPage` → `POST /auth/register-user`) nunca
  asigna rol admin; los administradores solo se crean desde el panel de
  usuarios por un admin ya autenticado, contra `POST /auth/register`.

## 4. Agendamiento (bookings)

- Crear una reserva requiere sesión iniciada del lado del frontend (para
  poder enviar `reservedBy`), aunque el endpoint `POST /reservations` no
  tiene guard de autenticación en el backend — es una validación que hoy
  solo vive en el cliente.
- La validación de no solapamiento de horarios se hace en el backend
  (409 Conflict); el frontend solo valida en el cliente que `fin > inicio`.
- **Simplificación mantenida:** el formulario no filtra visualmente huecos
  disponibles ni muestra un calendario; lista las reservas existentes en
  orden cronológico y deja que el backend rechace solapamientos.

## 5. Autoservicio de reservas (usuario)

Funcionalidad agregada tras la integración con el backend, no contemplada
en la versión inicial del contrato: cada usuario puede gestionar sus
propias reservas activas desde la pestaña "Mis reservas" del tablero.

- **Terminar reserva** (`DELETE /reservations/:id/end`): elimina la
  reserva por completo — no queda historial de "reservas terminadas", se
  borra de la base de datos — y libera el casillero (vacío, puerta
  cerrada). Protegido por `JwtAuthGuard`; el backend verifica que
  `reservedBy` coincida con el `username` del token, no solo el frontend.
- **Abrir puerta** (`PATCH /reservations/:id/open-door`): solo funciona si
  la hora actual está dentro de la ventana `[startTime, endTime]` de la
  reserva y si el usuario autenticado es el dueño. Si falla cualquiera de
  las dos condiciones, el backend responde 400 y el frontend muestra el
  mensaje de error debajo del botón correspondiente.
- Ambos botones deshabilitan su propio estado de carga de forma
  independiente por reserva (usando el `id` de la reserva como llave), para
  evitar doble clic mientras la petición está en curso.

## 6. Decisiones de arquitectura del frontend

- **Vite + React + TypeScript**, sin framework adicional de estado global:
  el estado remoto se maneja con hooks simples (`useLockers`,
  `useMyBookings`) más `AuthContext` para la sesión.
- **CSS plano con variables (tokens)** en `src/index.css`, para controlar
  bien la semántica visual de los 5 estados del casillero.
- Capa `src/api/` separada de los componentes: cada recurso (auth,
  lockers, bookings, users) tiene su propio archivo sobre un `client.ts`
  común que centraliza headers, token y manejo de errores (`ApiError`).
- El detalle de un casillero se muestra en un panel lateral (drawer) en
  vez de una ruta aparte, para mantener el contexto del tablero.

## 7. Panel de usuarios (admin)

- Ruta `/admin/usuarios`, visible en el header solo cuando `isAdmin` es
  `true`. No es una ruta protegida a nivel de router — el backend sigue
  siendo la única barrera real (`@Roles(Role.ADMIN)` en `GET /users`).
- Lista usuarios (`GET /users`) y, al expandir uno, carga sus reservas
  contra `GET /reservations/user/:reservedBy` usando el **username** del
  usuario (no su id), de forma perezosa (solo la primera vez que se
  expande cada fila). Los resultados se cachean localmente indexados por
  `user.id` para no repetir la llamada al volver a expandir.
- El código del casillero se toma directamente de `booking.codeLoker`; si
  llegara a faltar, se resuelve cruzando `booking.lockerId` contra
  `GET /lockers` (por eso esta página también carga el listado de
  casilleros al montar).
- "Casilleros que tiene reservados o ha usado" se interpreta como el
  historial completo de reservas del usuario (pasadas y futuras); no se
  aplicó filtro de fechas.
- Botón **"+ Nuevo casillero"** en el tablero (`BoardPage`), visible solo
  si `isAdmin` → `POST /lockers` con `{ code, size }`.
- Botón **"+ Nuevo administrador"** en `AdminUsersPage` → `POST
  /auth/register` (no `POST /users`, como se asumía originalmente; ese
  endpoint no existe). El backend siempre asigna `role: 'admin'` a los
  usuarios creados por esta vía, así que el formulario no pide el rol.


