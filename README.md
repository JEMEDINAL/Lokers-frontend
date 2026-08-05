# Locker Frontend

Frontend en React + TypeScript (Vite) para el sistema de alquiler de casilleros
de la prueba técnica. Consume una API REST  en NestJS para listar
casilleros, cambiar su estado  y agendar su uso.


## Requisitos

- Node.js 18+
- npm 9+

## Instalación y ejecución local

```bash
cd locker-frontend
npm install
cp .env.example .env      # ajusta VITE_API_URL si tu backend no corre en :3000
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Build de producción

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
  api/            # capa de acceso HTTP  al backend
  components/     # componentes de UI reutilizables
  context/        # AuthContext (sesión de administrador)
  hooks/          # hooks de datos (useLockers)
  pages/          # BoardPage (tablero) y LoginPage
  types/          # tipos de dominio + lógica de estado visual
```

## Funcionalidad

- Tablero de casilleros agrupados por tamaño (S/M/L), con leyenda de estados.
- Filtro por tamaño.
- Detalle de casillero en panel lateral: estado actual, reservas existentes
  y formulario para agendar.
- Cambio de estado (puerta / ocupación) restringido a usuarios con rol
  `admin` autenticados.
- Manejo de estados de carga y error en listado, detalle y formularios.

## Variables de entorno

| Variable        | Descripción                          | Default                 |
|-----------------|---------------------------------------|--------------------------|
| `VITE_API_URL`  | URL base del backend NestJS           | `http://localhost:3000` |

Ver `DECISIONES-FRONTEND.md` para el contrato de API asumido, las
decisiones de diseño.
