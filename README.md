# 📚 Portal Docente

> Sistema integral de gestión académica para docentes universitarios, desarrollado con Next.js y React

![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)
![React](https://img.shields.io/badge/React-19.0.0-61dafb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8)
![License](https://img.shields.io/badge/license-Private-red)

## 🎯 Descripción del Proyecto

Portal Docente es una aplicación web completa diseñada para optimizar la gestión académica de profesores universitarios. Proporciona herramientas para administrar grupos, estudiantes, evaluaciones, generar reportes analíticos y realizar seguimiento del rendimiento académico en tiempo real.

### ✨ Características Principales

- **📊 Dashboard Interactivo**: Visualización en tiempo real de estadísticas clave, tendencias académicas y métricas de rendimiento
- **👥 Gestión de Estudiantes**: Administración completa de información estudiantil con búsqueda avanzada y filtros
- **📝 Sistema de Evaluaciones**: Registro y seguimiento de calificaciones con cálculo automático de promedios
- **👨‍🏫 Administración de Grupos**: Control de grupos académicos, horarios y asignaciones
- **📈 Reportes Analíticos**: 
  - Reportes de tasa de aprobación
  - Estadísticas de rendimiento por grupo
  - Exportación a PDF y Excel
- **🔔 Sistema de Notificaciones**: Alertas y recordatorios en tiempo real
- **🎨 Interfaz Moderna**: Diseño responsive con animaciones fluidas y experiencia de usuario optimizada
- **🔒 Autenticación Segura**: Sistema de login con JWT y middleware de protección de rutas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework**: Next.js 15 (con App Router y Turbopack)
- **UI Library**: React 19
- **Estilos**: TailwindCSS, Flowbite React
- **Animaciones**: Framer Motion
- **Iconos**: React Icons, Lucide React, Font Awesome

### Visualización de Datos
- **Gráficas**: Chart.js, React Chart.js 2, Recharts
- **Componentes**: React CountUp, React Loading Skeleton

### Utilidades
- **Manejo de Fechas**: date-fns
- **Exportación**: jsPDF, jsPDF AutoTable, XLSX
- **Formularios**: React Select
- **Notificaciones**: React Hot Toast, Sonner
- **Tooltips**: React Tooltip

## 📁 Estructura del Proyecto

```
PortalDocente/
├── components/           # Componentes reutilizables
│   ├── common/          # Header, Sidebar, NavItem
│   ├── dashboard/       # Widgets del dashboard
│   ├── sections/        # Secciones de páginas
│   ├── DashboardLayout/ # Layout principal
│   └── Skeleton/        # Componentes de carga
├── context/             # Context API de React
│   ├── contextUser.jsx
│   ├── contextGroups.jsx
│   ├── contextEstudiantes.jsx
│   └── contextNotificaciones.jsx
├── pages/               # Páginas de la aplicación
│   ├── dashboard.jsx
│   ├── estudiantes.jsx
│   ├── evaluaciones.jsx
│   ├── grupos.jsx
│   ├── reportes/
│   └── notificacion/
├── public/              # Recursos estáticos
│   ├── Imagenes/
│   └── boletas/
└── styles/              # Estilos globales
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18.x o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Fernando88323/PortalDocente.git
cd PortalDocente
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 📦 Scripts Disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo con Turbopack
npm run build      # Genera el build de producción
npm start          # Inicia el servidor de producción
npm run lint       # Ejecuta el linter
```

## 🎨 Características Técnicas Destacadas

- **Optimización de Rendimiento**: Lazy loading, code splitting y optimización de imágenes
- **Estado Global**: Context API para manejo eficiente del estado
- **Animaciones Suaves**: Transiciones y micro-interacciones con Framer Motion
- **Diseño Responsive**: Totalmente adaptable a dispositivos móviles y tablets
- **Middleware de Autenticación**: Protección de rutas con JWT
- **Exportación de Datos**: Generación de reportes en PDF y Excel
- **Modo Oscuro**: Soporte para tema claro/oscuro (si aplica)

## 📊 Funcionalidades por Módulo

### Dashboard
- Estadísticas generales en tiempo real
- Gráficas de rendimiento académico
- Calendario de eventos
- Alertas y notificaciones importantes

### Estudiantes
- Lista completa con búsqueda y filtros
- Edición inline de información
- Historial académico
- Estadísticas individuales

### Evaluaciones
- Registro de calificaciones
- Cálculo automático de promedios
- Visualización de tendencias

### Reportes
- Tasa de aprobación por grupo
- Análisis comparativo
- Exportación a múltiples formatos

## 🔐 Seguridad

- Autenticación con JWT
- Validación de tokens en cada solicitud
- Middleware de protección de rutas
- Manejo seguro de datos sensibles

## 🤝 Contribuciones

Este es un proyecto privado desarrollado para fines académicos y profesionales.

## 👨‍💻 Autor

**Fernando**
- GitHub: [@Fernando88323](https://github.com/Fernando88323)

## 📄 Licencia

Este proyecto es privado y está protegido por derechos de autor.

---

Desarrollado con ❤️ usando Next.js y React
