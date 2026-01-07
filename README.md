# Portal Docente

**Portal Docente** es una aplicación web desarrollada como proyecto de tesis para la **Universidad de Sonsonate**, resultado de un trabajo colaborativo orientado a resolver necesidades reales de gestión académica universitaria.

![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)
![React](https://img.shields.io/badge/React-19.0.0-61dafb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933)
![Express](https://img.shields.io/badge/Express-4.x-black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1)

## Descripción

Portal Docente es una aplicación web orientada a la **gestión académica universitaria**, desarrollada con **React y Next.js** en el frontend y **Node.js con Express** en el backend, utilizando **MySQL** como sistema de base de datos.

La plataforma permite a **docentes y decanos** administrar grupos, estudiantes y evaluaciones, así como generar reportes de rendimiento académico. Además, implementa **control de acceso por roles** (Docente / Decano) y gestión de **períodos de evaluación**, asegurando un flujo de información estructurado y seguro.

## Funcionalidades Principales

**Dashboard Analítico**
- Visualización de estadísticas en tiempo real con gráficas interactivas.
- Métricas de rendimiento académico por grupo y estudiante.
- Widgets de eventos y progreso con animaciones.

**Gestión de Estudiantes**
- CRUD completo con búsqueda avanzada y filtros.
- Edición inline de información.
- Visualización de historial académico y estadísticas individuales.

**Sistema de Evaluaciones Docentes y Decano**
- Evaluaciones con preguntas dinámicas y calificación automática.
- Control de períodos de evaluación con validación de fechas.
- Sistema de respuestas con persistencia local (LocalStorage).
- Manejo diferenciado por rol (docente/decano).

**Gestión de Grupos Académicos**
- Administración de grupos con información de jornada, aula y horarios.
- Visualización en tarjetas animadas con diseño moderno.
- Filtros y búsqueda en tiempo real.

**Reportes Avanzados**
- Tasa de aprobación por grupo y cuota.
- Exportación a PDF y Excel.
- Visualización con tablas interactivas y búsqueda.
- Generación dinámica según rol del usuario.

**Sistema de Notificaciones**
- Notificaciones en tiempo real con rutas dinámicas.
- Integración con React Hot Toast y Sonner.

## Stack Tecnológico

**Core**
- Next.js 15.1.6 con Turbopack.
- React 19.
- Context API para estado global.

**UI/UX**
- TailwindCSS 3.4.1
- Framer Motion (animaciones)
- React Icons, Lucide React, Font Awesome

**Gráficas y Visualización**
- Chart.js con React Chart.js 2.
- Recharts.
- React CountUp.

**Utilidades**
- jsPDF y jsPDF AutoTable (PDFs).
- XLSX (Excel).
- React Select (formularios).
- date-fns (fechas).
- jsonwebtoken (autenticación).

## Arquitectura del Proyecto

```
├── components/
│   ├── common/              # Header, Sidebar, NavItem
│   ├── dashboard/           # StatCard, ProgressChart, EventsWidget
│   ├── DashboardLayout/     # Layout principal con navegación
│   ├── TasaAprobacionPanel.jsx  # Componente complejo de reportes
│   └── Skeleton/            # Estados de carga
├── context/                 # Gestión de estado global
│   ├── contextUser.jsx      # Usuario y autenticación
│   ├── contextGroups.jsx    # Grupos académicos
│   ├── contextEstudiantes.jsx
│   ├── contextCicloActual.jsx
│   └── contextNotificaciones.jsx
├── pages/                   # Rutas de la aplicación
│   ├── dashboard.jsx        # Dashboard principal con métricas
│   ├── estudiantes.jsx      # CRUD de estudiantes
│   ├── evaluaciones.jsx     # Sistema de evaluaciones (4344 líneas)
│   ├── grupos.jsx           # Gestión de grupos
│   ├── reportes/
│   │   └── tasa-aprobacion.jsx
│   └── notificacion/[id].jsx
├── middleware.js            # Protección de rutas con JWT
└── styles/
    └── globals.css
```

## Características Técnicas Destacadas

**Autenticación y Seguridad**
- Middleware de Next.js para protección de rutas.
- Validación de JWT en cookies.
- Redirección automática según estado de autenticación.
- Sistema de roles (Docente, Decano).

**Optimización de Rendimiento**
- Lazy loading y code splitting.
- Skeleton loaders para mejor UX.
- Memoización con useMemo y useCallback.
- Optimización de re-renders con React 19.

**Estado y Datos**
- Context API para compartir estado entre componentes.
- Persistencia local con LocalStorage para evaluaciones.
- Gestión de ciclos académicos dinámicos.
- Validación de formato de ciclos (01/26).

**Exportación de Datos**
- PDFs con diseño personalizado y tablas automáticas.
- Hojas de Excel con formateo y múltiples sheets.
- Descarga de reportes según filtros seleccionados.

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/Fernando88323/PortalDocente.git
cd PortalDocente

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

## Scripts

```bash
npm run dev    # Desarrollo con Turbopack
npm run build  # Build de producción
npm start      # Servidor de producción
npm run lint   # Linter
```

## Autor

Fernando - [@Fernando88323](https://github.com/Fernando88323)

## Licencia

Proyecto privado con fines académicos y profesionales.
