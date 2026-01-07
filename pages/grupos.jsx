// NUEVA VERSIÓN MODERNA DE GRUPOS CON COLORES VIVOS
import Layout from "../components/DashboardLayout/DashboardLayout";
import { useRouter } from "next/router";
import { useGrupos } from "../context/contextGroups";
import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GruposProvider } from "../context/contextGroups";
import {
  CicloActualProvider,
  useCicloActual,
} from "../context/contextCicloActual";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiGrid,
  FiEye,
  FiX,
  FiUser,
  FiList,
} from "react-icons/fi";

// Global mappings for field icon colors and pale backgrounds
const fieldIconColors = {
  jornada: "text-purple-600",
  aula: "text-orange-500",
  docente: "text-emerald-600",
};
const fieldBgMapping = {
  jornada: "bg-purple-100",
  aula: "bg-orange-100",
  docente: "bg-emerald-100",
};

// Componente moderno para tarjeta de grupo con animaciones
function ModernGroupCard({ grupo, onClick, index }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, delay: index * 0.1, ease: "easeOut" },
    },
  };

  const colors = ["emerald", "orange", "purple", "pink", "cyan", "indigo"];
  const colorClass = colors[index % colors.length];

  const colorMapping = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    indigo: "bg-indigo-500",
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl hover:border-gray-200 transition-all duration-300"
    >
      {/* Enhanced background decoration - reducido en móviles */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full opacity-40 transform translate-x-8 sm:translate-x-12 -translate-y-8 sm:-translate-y-12 group-hover:opacity-60 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-100 to-cyan-100 rounded-full opacity-30 transform -translate-x-6 sm:-translate-x-8 translate-y-6 sm:translate-y-8 group-hover:opacity-50 transition-opacity duration-300"></div>

      <div className="relative z-10">
        {/* Header with enhanced icon */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <motion.div
            className={`p-2 sm:p-3 rounded-xl ${colorMapping[colorClass]} shadow-lg group-hover:shadow-xl`}
            whileHover={{ rotate: 6, scale: 1.08 }}
            transition={{ duration: 0.2 }}
          >
            <FiBookOpen className="text-white text-lg sm:text-xl" />
          </motion.div>

          <div className="text-right">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Grupo
            </span>
            <p className="text-base sm:text-lg font-bold text-gray-800">
              {grupo.Identificador}
            </p>
          </div>
        </div>

        {/* Enhanced content */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors leading-tight">
            {grupo.Nombre}
          </h3>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center text-gray-600">
              <div
                className={`p-1.5 rounded-lg ${fieldBgMapping.jornada} mr-2 flex items-center justify-center flex-shrink-0`}
              >
                <FiClock
                  className={`${fieldIconColors.jornada} w-3.5 h-3.5 sm:w-4 sm:h-4`}
                />
              </div>
              <span className="text-xs sm:text-sm truncate">
                {grupo.Jornada}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <div
                className={`p-1.5 rounded-lg ${fieldBgMapping.aula} mr-2 flex items-center justify-center flex-shrink-0`}
              >
                <FiMapPin
                  className={`${fieldIconColors.aula} w-3.5 h-3.5 sm:w-4 sm:h-4`}
                />
              </div>
              <span className="text-xs sm:text-sm truncate">{grupo.Aula}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <div
                className={`p-1.5 rounded-lg ${fieldBgMapping.docente} mr-2 flex items-center justify-center flex-shrink-0`}
              >
                <FiUser
                  className={`${fieldIconColors.docente} w-3.5 h-3.5 sm:w-4 sm:h-4`}
                />
              </div>
              <span className="text-xs sm:text-sm truncate">
                {grupo.Docente || "Sin asignar"}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced action button */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Ver detalles</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Componente para vista de lista de grupos
function ModernGroupListItem({ grupo, onClick, index }) {
  const colors = [
    "emerald",
    "orange",
    "purple",
    "pink",
    "cyan",
    "indigo",
    "teal",
  ];
  const color = colors[index % colors.length];

  const colorMapping = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-2xl hover:border-gray-200 transition-all duration-300 relative overflow-hidden"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Enhanced background decoration for list items - reducido en móviles */}
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-bl from-purple-100 via-pink-100 to-blue-100 rounded-full opacity-20 transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 group-hover:opacity-40 transition-opacity duration-300"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Enhanced icon with hover effects - responsivo */}
            <motion.div
              className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${colorMapping[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl flex-shrink-0`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <FiBookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </motion.div>

            {/* Enhanced information - mejor overflow */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 truncate">
                {grupo.NombreGrupo}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600 mt-1">
                <div className="flex items-center flex-shrink-0">
                  <div
                    className={`p-1 rounded-lg ${fieldBgMapping.jornada} mr-2 flex items-center justify-center`}
                  >
                    <FiClock
                      className={`${fieldIconColors.jornada} w-3 h-3 sm:w-4 sm:h-4`}
                    />
                  </div>
                  <span className="truncate">{grupo.Horario}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <div
                    className={`p-1 rounded-lg ${fieldBgMapping.aula} mr-2 flex items-center justify-center`}
                  >
                    <FiMapPin
                      className={`${fieldIconColors.aula} w-3 h-3 sm:w-4 sm:h-4`}
                    />
                  </div>
                  <span className="truncate">{grupo.Aula}</span>
                </div>
                <div className="items-center flex-shrink-0 hidden sm:flex">
                  <div
                    className={`p-1 rounded-lg ${fieldBgMapping.docente} mr-2 flex items-center justify-center`}
                  >
                    <FiUser
                      className={`${fieldIconColors.docente} w-3 h-3 sm:w-4 sm:h-4`}
                    />
                  </div>
                  <span className="truncate">
                    {grupo.Docente || "Sin asignar"}
                  </span>
                </div>
              </div>
              {/* Docente en línea separada en móviles */}
              <div className="flex items-center text-xs text-gray-600 mt-1 sm:hidden">
                <FiUser className="w-3 h-3 mr-1 text-gray-400" />
                <span className="truncate">
                  {grupo.Docente || "Sin asignar"}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced status and button - adaptable */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="text-right hidden lg:block">
              <div className="text-xs sm:text-sm text-gray-500">Estado</div>
              <span
                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  grupo.Estado === "Activo"
                    ? "bg-green-100 text-green-800 group-hover:bg-green-200 group-hover:shadow-sm"
                    : "bg-gray-100 text-gray-800 group-hover:bg-gray-200 group-hover:shadow-sm"
                }`}
              >
                <FiCheckCircle className="w-3 h-3 mr-1" />
                {grupo.Estado || "Activo"}
              </span>
            </div>

            {/* Estado simplificado para pantallas pequeñas */}
            <div className="lg:hidden">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  grupo.Estado === "Activo"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <FiCheckCircle className="w-3 h-3" />
              </span>
            </div>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
              }}
              className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente para tarjeta de estadística moderna
function StatsCard({ title, value, icon, color, subtitle }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const colorMapping = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === "number" ? (
              <CountUp end={value} duration={2} preserveValue />
            ) : (
              value
            )}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl ${colorMapping[color]} shadow-lg`}>
          <div className="text-white text-2xl">{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente principal rediseñado
function Grupos() {
  const { grupos, error, loading, grupoSeleccionado, setGrupoSeleccionado } =
    useGrupos();

  // Estados para el ciclo actual dinámico - usando context
  const {
    cicloActual,
    loadingCiclo,
    errorCiclo,
    obtenerCicloActual,
    setCicloActualFallback,
  } = useCicloActual();

  const [viewMode, setViewMode] = useState("grid");
  const toastShown = useRef(false);
  const cicloLoaded = useRef(false); // Agregar ref para controlar carga
  const router = useRouter();

  // Calcular estadísticas
  const ciclos = useMemo(
    () => [...new Set(grupos.map((g) => g.Ciclo))],
    [grupos]
  );
  const cicloFromGroups = ciclos.length === 1 ? ciclos[0] : ciclos.join(", ");

  // Cargar el ciclo actual al montar el componente
  useEffect(() => {
    if (grupos.length > 0 && !cicloLoaded.current) {
      cicloLoaded.current = true;
      obtenerCicloActual(grupos);
    }
  }, [grupos]);

  // Actualizar ciclo actual cuando cambian los grupos (fallback)
  useEffect(() => {
    if (!cicloActual && cicloFromGroups && !loadingCiclo) {
      setCicloActualFallback(cicloFromGroups);
    }
  }, [cicloFromGroups, cicloActual, loadingCiclo, setCicloActualFallback]);

  // Toast success mejorado
  useEffect(() => {
    if (!loading && !error && !toastShown.current && grupos.length > 0) {
      toast.success("Grupos cargados correctamente", {
        description: `Se encontraron ${grupos.length} grupos disponibles${
          cicloActual ? ` para el período ${cicloActual}` : ""
        }`,
        duration: 4000,
        position: "bottom-right",
        icon: (
          <div className="p-1 bg-emerald-100 rounded-lg">
            <FiCheckCircle className="text-emerald-600 text-lg" />
          </div>
        ),
        style: {
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "font-medium",
      });
      toastShown.current = true;
    } else if (!loading && error && !toastShown.current) {
      toast.error("Error al cargar los grupos", {
        description:
          "Hubo un problema al obtener la información. Por favor, intenta recargar la página.",
        duration: 5000,
        position: "bottom-right",
        icon: (
          <div className="p-1 bg-red-100 rounded-lg">
            <FiX className="text-red-600 text-lg" />
          </div>
        ),
        style: {
          background: "linear-gradient(145deg, #ffffff 0%, #fef2f2 100%)",
          border: "1px solid #ef4444",
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "font-medium",
      });
      toastShown.current = true;
    }
  }, [loading, error, grupos.length, cicloActual]);

  const handleGrupoClick = useCallback(
    (id) => {
      const grupo = grupos.find((g) => g.IDGrupo === id);
      setGrupoSeleccionado(id);

      // Mostrar toast y redirigir directamente a la página de estudiantes
      toast.success(
        `Redirigiendo a estudiantes de ${grupo?.NombreGrupo || "grupo"}`,
        {
          icon: <FiEye className="w-5 h-5 text-blue-600" />,
          description: `Abriendo lista de estudiantes para ${
            grupo?.NombreGrupo || "grupo"
          }`,
          duration: 1200,
        }
      );

      router.push(`/estudiantes?groupId=${id}`);
    },
    [setGrupoSeleccionado, grupos, router]
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);

      // Toast profesional para cambio de vista
      const modeText = mode === "grid" ? "Cuadrícula" : "Lista";
      const icon =
        mode === "grid" ? (
          <FiGrid className="w-5 h-5 text-purple-600" />
        ) : (
          <FiList className="w-5 h-5 text-indigo-600" />
        );
      const bgGradient =
        mode === "grid"
          ? "linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)"
          : "linear-gradient(145deg, #ffffff 0%, #f0f4ff 100%)";
      const borderColor = mode === "grid" ? "#a855f7" : "#6366f1";

      toast.success(`Vista cambiada a ${modeText}`, {
        icon,
        description: `Mostrando grupos en formato de ${modeText.toLowerCase()}`,
        style: {
          background: bgGradient,
          border: `1px solid ${borderColor}`,
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "font-medium",
        duration: 1500,
      });
    },
    [setViewMode]
  );

  const renderSkeleton = () =>
    viewMode === "grid" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
      </div>
    ) : (
      <div className="space-y-3 sm:space-y-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-3 sm:p-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 sm:w-48 mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-40 sm:w-64"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 rounded w-14 sm:w-16"></div>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    );

  return (
    <Layout>
      <main className="p-3 sm:p-4 lg:p-8 space-y-3 sm:space-y-4 bg-slate-50 min-h-screen">
        {/* Tarjeta principal de información */}
        <motion.section
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-3 sm:p-4 bg-emerald-100 rounded-xl flex-shrink-0">
                <FiCalendar className="text-emerald-600 text-xl sm:text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Ciclo Académico
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {loadingCiclo ? (
                    <span className="animate-pulse text-gray-400">
                      Cargando...
                    </span>
                  ) : errorCiclo ? (
                    <span className="text-red-500" title={errorCiclo}>
                      Error
                    </span>
                  ) : (
                    cicloActual || cicloFromGroups || "No disponible"
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {errorCiclo ? (
                    <span className="text-red-400">Error al cargar</span>
                  ) : (
                    "Período actual"
                  )}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total de Grupos
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                <CountUp end={grupos.length} duration={2} preserveValue />
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Grupos asignados
              </p>
            </div>
          </div>
        </motion.section>

        {/* Panel de información (search removed) */}
        <motion.section
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="space-y-4">
            {/* Banner de estado del ciclo */}
            {errorCiclo && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">
                      Error al cargar el ciclo académico
                    </p>
                    <p className="text-red-600 text-sm">{errorCiclo}</p>
                    <p className="text-red-600 text-xs mt-1">
                      Usando datos de los grupos disponibles como respaldo
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      cicloLoaded.current = false;
                      obtenerCicloActual(grupos);
                    }}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Panel superior simplificado - vista UI removed */}
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  {/* Vista display */}
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-pink-100 rounded-lg flex-shrink-0">
                      <FiGrid className="text-pink-600 text-base" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Vista
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {viewMode === "grid" ? "Cuadrícula" : "Lista"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Controles de vista */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleViewModeChange("grid")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "grid"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Vista de cuadrícula"
                    >
                      <FiGrid size={16} />
                    </button>

                    <button
                      onClick={() => handleViewModeChange("list")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "list"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Vista de lista"
                    >
                      <FiList size={16} />
                    </button>
                  </div>

                  {/* Contador */}
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {grupos.length} de {grupos.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contenido principal - Tarjetas de grupos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            renderSkeleton()
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 sm:p-8 lg:p-12 text-center"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">😞</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">
                Error al cargar los grupos
              </h3>
              <p className="text-sm sm:text-base text-red-500">
                Hubo un problema al obtener la información. Intenta recargar la
                página.
              </p>
            </motion.div>
          ) : grupos.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <AnimatePresence>
                  {grupos.map((grupo, index) => (
                    <ModernGroupCard
                      key={grupo.IDGrupo}
                      grupo={grupo}
                      index={index}
                      onClick={() => handleGrupoClick(grupo.IDGrupo)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {grupos.map((grupo, index) => (
                    <ModernGroupListItem
                      key={grupo.IDGrupo}
                      grupo={grupo}
                      index={index}
                      onClick={() => handleGrupoClick(grupo.IDGrupo)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12 text-center"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiBookOpen className="text-gray-400 text-xl sm:text-2xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                No hay grupos para mostrar
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {"No tienes grupos asignados actualmente"}
              </p>
            </motion.div>
          )}
        </motion.section>
      </main>
    </Layout>
  );
}

export default () => (
  <CicloActualProvider>
    <GruposProvider>
      <Grupos />
    </GruposProvider>
  </CicloActualProvider>
);
