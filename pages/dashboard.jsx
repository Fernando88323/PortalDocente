import { useEffect, useState } from "react";
import Layout from "../components/DashboardLayout/DashboardLayout";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiBookOpen,
  FiFileText,
  FiCalendar,
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiAward,
  FiTarget,
  FiBell,
  FiClock,
} from "react-icons/fi";
import { useGrupos, GruposProvider } from "../context/contextGroups";
import {
  useEstudiantes,
  EstudiantesProvider,
} from "../context/contextEstudiantes";
import { useUser, UserProvider } from "../context/contextUser";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ProgressChart from "../components/dashboard/ProgressChart";
import StatCard from "../components/dashboard/StatCard";
import EventsWidget from "../components/dashboard/EventsWidget";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

// Componente para tarjetas de métricas modernas con animaciones
function ModernMetricCard({
  title,
  value,
  icon,
  color = "gray",
  trend,
  subtitle,
  onClick,
  loading = false,
}) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.6, delay: 0.2, ease: "easeOut" },
    },
  };

  // Mapeo de colores usando Tailwind con colores vivos que contrasten con el sidebar azul
  const iconColors = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    cyan: "bg-cyan-500",
    yellow: "bg-yellow-500",
    rose: "bg-rose-500",
    teal: "bg-teal-500",
    green: "bg-green-500",
    gray: "bg-gray-500", // Fallback color
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
        transition: { duration: 0.2 },
      }}
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200
        ${onClick ? "cursor-pointer" : ""} 
        hover:shadow-xl transition-all duration-300 group
      `}
    >
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            variants={iconVariants}
            className={`p-3 rounded-xl ${iconColors[color]} shadow-lg`}
          >
            <div className="text-white text-xl">{icon}</div>
          </motion.div>

          {trend && (
            <div
              className={`flex items-center space-x-1 ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <FiTrendingUp
                className={`text-sm ${trend < 0 ? "rotate-180" : ""}`}
              />
              <span className="text-sm font-medium">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </h3>

          <div className="text-3xl font-bold text-gray-900">
            {loading ? (
              <Skeleton height={40} width={80} />
            ) : typeof value === "number" ? (
              <CountUp
                end={value}
                duration={2}
                delay={inView ? 0.5 : 0}
                preserveValue
              />
            ) : (
              value
            )}
          </div>

          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// Componente para gráfica de barras de rendimiento por grupo
function GroupPerformanceChart({ grupos }) {
  const data = {
    labels: grupos
      .slice(0, 6)
      .map((grupo) => grupo.nombre || `Grupo ${grupo.id}`),
    datasets: [
      {
        label: "Promedio",
        data: grupos.slice(0, 6).map(() => Math.floor(Math.random() * 40) + 60),
        backgroundColor: "rgba(16, 185, 129, 0.8)", // emerald-500
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-80 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-emerald-500 rounded-lg mr-3">
          <FiBarChart className="text-white text-lg" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Rendimiento por Grupo
        </h3>
      </div>
      <div className="h-60">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// Componente para gráfica de dona de aprobados vs reprobados
function ApprovalChart({ passed, failed }) {
  const data = {
    labels: ["Aprobados", "Reprobados"],
    datasets: [
      {
        data: [passed, failed],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // green-500 para aprobados
          "rgba(239, 68, 68, 0.8)", // red-500 para reprobados
        ],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: "medium",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        cornerRadius: 8,
      },
    },
    cutout: "60%",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-80 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-emerald-500 rounded-lg mr-3">
          <FiPieChart className="text-white text-lg" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Estado de Estudiantes
        </h3>
      </div>
      <div className="h-52">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

function Dashboard() {
  const { grupos, noCicloDisponible, loading: loadingGrupos } = useGrupos();
  const { user, loading } = useUser();
  const { todosLosEstudiantes, loadingAllStudents } = useEstudiantes();

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    notesLoaded: 85,
    passedPercentage: 78,
    averageByGroup: 8.4,
    passedVsFailed: { passed: 156, failed: 44 },
    totalGruposAsignados: 0,
    attendanceRate: 92,
    avgGrade: 8.2,
    completedAssignments: 89,
  });

  const [dashboardData, setDashboardData] = useState({
    monthlyProgress: [75, 82, 78, 85, 88, 92],
    recentGrades: [8.5, 7.8, 9.2, 8.1, 8.8, 9.0],
    subjectPerformance: {
      Matemáticas: 8.5,
      Ciencias: 7.9,
      Historia: 8.8,
      Literatura: 8.2,
    },
  });

  useEffect(() => {
    if (grupos && Array.isArray(grupos)) {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        totalGruposAsignados: grupos.length,
      }));
    }
  }, [grupos]);

  useEffect(() => {
    if (todosLosEstudiantes && Array.isArray(todosLosEstudiantes)) {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        totalStudents: todosLosEstudiantes.length,
      }));
    }
  }, [todosLosEstudiantes]);

  const router = useRouter();
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Entrega de Proyecto Final",
      date: "2025-05-15",
      priority: "high",
    },
    {
      id: 2,
      title: "Revisión de Exámenes",
      date: "2025-05-20",
      priority: "medium",
    },
    {
      id: 3,
      title: "Reunión de Departamento",
      date: "2025-05-18",
      priority: "low",
    },
  ]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const NEXT_PUBLIC_NOTIFICACIONES =
          process.env.NEXT_PUBLIC_NOTIFICACIONES;
        const res = await fetch(NEXT_PUBLIC_NOTIFICACIONES, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al cargar notificaciones");
        const data = await res.json();
        setNotifications(
          data.map((n) => {
            let archivos = [];
            if (n.archivo_path) {
              try {
                if (
                  n.archivo_path.startsWith("[") &&
                  n.archivo_path.endsWith("]")
                ) {
                  const parsed = JSON.parse(n.archivo_path);
                  if (Array.isArray(parsed)) {
                    archivos = parsed;
                  } else {
                    archivos = [n.archivo_path];
                  }
                } else {
                  archivos = [n.archivo_path];
                }
              } catch (parseError) {
                archivos = [n.archivo_path];
              }
            }
            return {
              id: n.IDNotificacion,
              mensaje: n.mensaje,
              cuerpo: n.cuerpo,
              archivos,
              url: n.url_destino,
              leida: Boolean(n.leida),
              time: new Date(n.fecha).toLocaleString(),
            };
          })
        );
      } catch (err) {
        console.error(err);
        setNotifications([]);
      }
    };
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  const renderSkeleton = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton height={40} width={300} />
        <Skeleton height={20} width={500} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <Skeleton height={60} width={60} className="mb-4" />
              <Skeleton height={20} width={100} className="mb-2" />
              <Skeleton height={40} width={80} />
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton height={300} />
        </div>
        <div>
          <Skeleton height={300} />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <main className="p-4 lg:p-8 space-y-8 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 min-h-screen relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full opacity-60"
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-3 h-3 bg-pink-400 rounded-full opacity-50"
            animate={{
              y: [0, 15, 0],
              x: [0, 10, 0],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-70"
            animate={{
              x: [0, 20, 0],
              opacity: [0.7, 0.9, 0.7],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {/* Header Section */}
            <motion.div
              className="relative space-y-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Enhanced background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute top-10 right-20 w-16 h-16 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full opacity-30 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full opacity-25 blur-2xl"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <h1 className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 mb-2">
                      ¡Bienvenido/a!
                    </h1>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </motion.div>

                  <motion.h2
                    className="text-xl lg:text-2xl text-gray-700 font-semibold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {user ? user.empleado.NombreCompleto : "Cargando..."}
                  </motion.h2>

                  <motion.div
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">
                      {new Date().toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  className="hidden lg:block"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl shadow-xl border-0 p-6 relative overflow-hidden">
                    {/* Animated background elements */}
                    <motion.div
                      className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full opacity-10"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ transform: "translate(50%, -50%)" }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300 rounded-full opacity-20"
                      animate={{
                        x: [0, 10, 0],
                        y: [0, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ transform: "translate(-50%, 50%)" }}
                    />

                    <div className="flex items-center space-x-4 relative z-10">
                      <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20"
                        animate={{
                          rotate: [0, 8, -8, 0],
                          scale: [1, 1.05, 0.98, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.span
                          className="text-2xl filter drop-shadow-lg"
                          animate={{
                            rotate: [0, -8, 8, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1.5,
                            ease: "easeInOut",
                          }}
                        >
                          👋
                        </motion.span>
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-sm text-blue-100 font-semibold tracking-wide"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.8 }}
                        >
                          ¡Hola,{" "}
                          {user?.empleado?.NombreCompleto?.split(" ")[0] ||
                            "Profesor"}
                          !
                        </motion.p>
                        <motion.p
                          className="text-2xl font-bold text-white mb-1 tracking-tight"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 1 }}
                        >
                          Excelente día ✨
                        </motion.p>
                        <motion.p
                          className="text-xs text-purple-100 font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 1.2 }}
                        >
                          Inspirando el futuro 🚀
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="mt-4 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                  <p className="text-gray-700 text-lg leading-relaxed font-medium">
                    🎯 Gestiona tus grupos, evalúa a tus estudiantes y mantén un
                    seguimiento completo del progreso académico desde este{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold">
                      panel de control inteligente
                    </span>
                    .
                  </p>

                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Sistema activo</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Datos sincronizados</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>Portal optimizado</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Main Metrics Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white rounded-2xl shadow-lg border-0 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiUsers className="text-white text-xl" />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                      Total Estudiantes
                    </h3>
                    <div className="text-3xl font-bold text-gray-900">
                      {loadingAllStudents ? (
                        <Skeleton height={40} width={80} />
                      ) : (
                        metrics.totalStudents
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      Activos este semestre
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`relative group ${
                  noCicloDisponible
                    ? "cursor-not-allowed opacity-75"
                    : "cursor-pointer"
                }`}
                onClick={() => !noCicloDisponible && router.push("/grupos")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white rounded-2xl shadow-lg border-0 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiBookOpen className="text-white text-xl" />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                      Grupos Asignados
                    </h3>
                    <div className="text-3xl font-bold text-gray-900">
                      {noCicloDisponible ? "—" : metrics.totalGruposAsignados}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {noCicloDisponible
                        ? "No hay ciclo académico configurado"
                        : "En curso actual • Click para ver detalles"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Charts and Analytics Section 
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GroupPerformanceChart grupos={grupos || []} />
              </div>

              <ApprovalChart
                passed={metrics.passedVsFailed.passed}
                failed={metrics.passedVsFailed.failed}
              />
            </section> 
            */}

            {/* Additional Metrics and Activity 
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ModernMetricCard
                title="Notas Ingresadas"
                value={metrics.notesLoaded}
                icon={<FiBarChart />}
                color="cyan"
                trend={15.2}
                subtitle="Del total esperado (%)"
              />

              <ModernMetricCard
                title="Tasa de Aprobación"
                value={metrics.passedPercentage}
                icon={<FiTrendingUp />}
                color="indigo"
                trend={5.8}
                subtitle="Estudiantes aprobados (%)"
              />

              <EventsWidget events={events} />
            </section> 
            */}

            {/* Progress Analytics 
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressChart
                title="Progreso Mensual"
                data={dashboardData.monthlyProgress}
                color="rgb(34, 197, 94)"
              />

              <ProgressChart
                title="Rendimiento por Materia"
                data={Object.values(dashboardData.subjectPerformance).map(
                  (val) => val * 10
                )}
                color="rgb(249, 115, 22)"
              />
            </section> 
            */}

            {/* Quick Stats Section 
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Promedio General"
                value={metrics.avgGrade}
                change={2.3}
                changeType="positive"
                icon={<FiTrendingUp />}
                color="emerald"
                decimals={1}
              />

              <StatCard
                title="Exámenes Pendientes"
                value={12}
                change={-15}
                changeType="negative"
                icon={<FiFileText />}
                color="orange"
              />

              <StatCard
                title="Horas de Clase"
                value={48}
                change={8}
                changeType="positive"
                icon={<FiClock />}
                color="purple"
                suffix=" hrs"
              />

              <StatCard
                title="Satisfacción"
                value={94}
                change={3.2}
                changeType="positive"
                icon={<FiAward />}
                color="pink"
                suffix="%"
                decimals={0}
              />
            </section> 
            */}
          </>
        )}
      </main>
    </Layout>
  );
}

export default () => (
  <GruposProvider>
    <EstudiantesProvider>
      <UserProvider>
        <Dashboard />
      </UserProvider>
    </EstudiantesProvider>
  </GruposProvider>
);
