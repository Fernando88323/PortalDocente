import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { toast } from "sonner";

// Icons
import {
  FiUsers,
  FiSearch,
  FiSettings,
  FiEdit3,
  FiSave,
  FiX,
  FiCheckCircle,
  FiTrendingUp,
  FiTarget,
  FiBookOpen,
  FiXCircle,
  FiInfo,
  FiAlertTriangle,
  FiUser,
  FiAward,
  FiBarChart,
  FiBook,
  FiMapPin,
  FiClock,
  FiCalendar,
  FiLock,
  FiUnlock,
} from "react-icons/fi";

// Components
import Layout from "../components/DashboardLayout/DashboardLayout";

// Contexts
import { useGrupos, GruposProvider } from "../context/contextGroups";
import {
  useEstudiantes,
  EstudiantesProvider,
} from "../context/contextEstudiantes";
import {
  useConfiguracion,
  ConfiguracionProvider,
} from "../context/contextConfiguracion";
import { useUser, UserProvider } from "../context/contextUser";
import {
  useCicloActual,
  CicloActualProvider,
} from "../context/contextCicloActual";

// Components para las estadísticas modernas
const ModernStatsCard = ({ title, value, icon, color, subtitle }) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const colorClasses = {
    indigo: {
      bg: "from-indigo-600 to-blue-700",
      icon: "bg-indigo-100 text-indigo-600",
      border: "border-indigo-200",
    },
    emerald: {
      bg: "from-emerald-500 to-teal-600",
      icon: "bg-emerald-100 text-emerald-600",
      border: "border-emerald-200",
    },
    orange: {
      bg: "from-orange-500 to-amber-600",
      icon: "bg-orange-100 text-orange-600",
      border: "border-orange-200",
    },
    purple: {
      bg: "from-purple-500 to-pink-600",
      icon: "bg-purple-100 text-purple-600",
      border: "border-purple-200",
    },
  };

  const classes = colorClasses[color] || colorClasses.indigo;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 20, scale: 0.9 }
      }
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-2xl shadow-lg border ${classes.border} p-6 relative overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.bg} opacity-5`}
      ></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${classes.icon}`}>{icon}</div>
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${classes.bg} opacity-10`}
          ></div>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {inView && typeof value === "number" ? (
            <CountUp end={value} duration={1.5} />
          ) : (
            value
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

// Tabla moderna de estudiantes
const ModernStudentTable = ({
  estudiantes,
  columnas,
  etiquetas,
  globalEdit,
  handleInputChange,
  getBgClass,
  getBgClassHeader,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-700">
          <tr>
            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-blue-700 border-r border-blue-500">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <FiUser className="text-blue-200 text-xs sm:text-sm" />
                <span className="hidden sm:inline">EXPEDIENTE</span>
                <span className="sm:hidden">EXP</span>
              </div>
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-blue-700 border-r border-blue-500">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <FiBook className="text-blue-200 text-xs sm:text-sm" />
                <span>Estudiante</span>
              </div>
            </th>
            {columnas.map((col) => (
              <th
                key={col}
                className={`px-1.5 sm:px-3 py-2 sm:py-3 text-center text-xs font-semibold text-white uppercase tracking-wider ${getBgClassHeader(
                  col
                )} border-r border-opacity-30 last:border-r-0`}
              >
                <div className="flex items-center justify-center space-x-1">
                  {col === "NF" && (
                    <FiAward className="text-indigo-200 text-xs" />
                  )}
                  <span className="text-xs">{etiquetas[col]}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {estudiantes.map((estudiante, index) => (
            <motion.tr
              key={estudiante.IDInscripcion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-sm font-medium text-gray-900 bg-white border-r border-gray-200">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-base hidden sm:inline">
                    {estudiante.IDExpediente}
                  </span>
                </div>
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap bg-white border-r border-gray-200">
                <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-none truncate">
                  {estudiante.NombreEstudiante}
                </div>
              </td>
              {columnas.map((col) => (
                <td
                  key={col}
                  className={`px-1.5 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-center border-r border-gray-200 last:border-r-0 ${getBgClass(
                    col
                  )}`}
                >
                  {globalEdit && col !== "np" && col !== "NF" ? (
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={estudiante[col] || 0}
                      onChange={(e) =>
                        handleInputChange(e, estudiante.IDInscripcion, col)
                      }
                      className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all text-xs sm:text-sm"
                    />
                  ) : (
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        col === "NF"
                          ? parseFloat(estudiante[col] || 0) >= 6
                            ? "text-green-800 bg-green-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold"
                            : "text-red-800 bg-red-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold"
                          : "text-gray-900"
                      }`}
                    >
                      {estudiante[col] || "0.0"}
                    </span>
                  )}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Modal moderno de configuración
const ModernConfigModal = ({
  openConfig,
  setOpenConfig,
  ponderacion,
  handlePonderacionChange,
  etiquetas,
  sumaEditables,
  ponderacionError,
  handleCancelConfigModal,
  handleApplyConfigModal,
  nma,
  errorNma,
}) => {
  // Hook para manejar la tecla Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && openConfig) {
        handleCancelConfigModal();
      }
    };

    if (openConfig) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [openConfig, handleCancelConfigModal]);

  const sumaTotal = sumaEditables(ponderacion) + 40;
  const excedeLimite = sumaTotal > 100;

  return (
    <AnimatePresence>
      {openConfig && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
          // Removido onClick para evitar cierre al hacer clic fuera
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-lg mx-auto p-4 sm:p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="relative flex items-center justify-center mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-3">
                <FiSettings className="text-blue-600" size={16} />
                <span className="text-sm sm:text-base">
                  Configurar Ponderación
                </span>
              </h3>
              <button
                onClick={handleCancelConfigModal}
                className="absolute right-0 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="text-gray-500" size={16} />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Campos de ponderación en dos columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Primera columna: P1, P2, P3 */}
                <div className="space-y-2 sm:space-y-3">
                  <h5 className="text-xs sm:text-sm font-semibold text-gray-700 text-center border-b border-gray-200 pb-1">
                    Parciales
                  </h5>
                  {["p1", "p2"].map((field) => (
                    <div key={field}>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
                        {etiquetas[field]}
                      </label>
                      <input
                        min="0"
                        max="100"
                        value={ponderacion[field]}
                        onChange={handlePonderacionChange(field)}
                        className="w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
                      P3 (Fijo)
                    </label>
                    <input
                      value={40}
                      disabled
                      className="w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>

                {/* Segunda columna: L1, L2, L3 */}
                <div className="space-y-2 sm:space-y-3">
                  <h5 className="text-xs sm:text-sm font-semibold text-gray-700 text-center border-b border-gray-200 pb-1">
                    Laboratorios
                  </h5>
                  {["pl1", "pl2", "pl3"].map((field) => (
                    <div key={field}>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
                        {etiquetas[field]}
                      </label>
                      <input
                        min="0"
                        max="100"
                        value={ponderacion[field]}
                        onChange={handlePonderacionChange(field)}
                        className="w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fila inferior: NMA y Suma total */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* NMA Display - Izquierda */}
                <div>
                  {nma ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center space-x-1">
                        <FiCheckCircle className="text-green-600" size={20} />
                        <span>
                          NMA:{" "}
                          <span className="text-lg font-bold text-green-700">
                            {nma.nma_actual || "N/A"}
                          </span>
                        </span>
                      </h5>
                    </div>
                  ) : errorNma ? (
                    <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <FiAlertTriangle
                          className="text-orange-500"
                          size={12}
                        />
                        <strong>NMA no disponible</strong>
                      </div>
                      <div className="text-xs">{errorNma}</div>
                    </div>
                  ) : null}
                </div>

                {/* Suma total - Derecha */}
                <div>
                  <div
                    className={`p-2 sm:p-3 rounded-lg border ${
                      excedeLimite
                        ? "bg-red-50 border-red-200"
                        : "bg-indigo-50 border-indigo-200"
                    }`}
                  >
                    <div
                      className={`text-xl sm:text-2xl font-bold ${
                        excedeLimite ? "text-red-700" : "text-blue-700"
                      }`}
                    >
                      <h5
                        className={`text-xs sm:text-sm font-semibold mb-1 ${
                          excedeLimite ? "text-red-700" : "text-blue-700"
                        }`}
                      >
                        Suma Total:
                        <span
                          className={`text-base sm:text-lg font-bold ml-1 ${
                            excedeLimite ? "text-red-700" : "text-blue-700"
                          }`}
                        >
                          {sumaTotal}%
                        </span>
                      </h5>
                    </div>
                  </div>
                  {excedeLimite && (
                    <div className="text-xs text-center text-red-600 mt-1">
                      Máximo permitido: 100%
                    </div>
                  )}
                </div>
              </div>

              {/* Advertencia si excede 100% */}
              {excedeLimite && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm flex items-start space-x-3"
                >
                  <FiAlertTriangle
                    className="text-red-500 mt-0.5 flex-shrink-0"
                    size={14}
                  />
                  <div>
                    <strong>¡Error!</strong> Solo es posible el 100% como
                    máximo. Reduce los valores para continuar.
                  </div>
                </motion.div>
              )}

              {ponderacionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
                  {ponderacionError}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mt-3 sm:mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelConfigModal}
                className="flex-1 px-3 sm:px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs sm:text-sm"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: excedeLimite ? 1 : 1.02 }}
                whileTap={{ scale: excedeLimite ? 1 : 0.98 }}
                onClick={() => !excedeLimite && handleApplyConfigModal()}
                disabled={excedeLimite}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm ${
                  excedeLimite
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Aplicar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function EstudiantesPage() {
  // URLs constants
  const CONFIGURACION_DOCENTE_URL =
    process.env.NEXT_PUBLIC_CONFIGURACION_DOCENTE;
  const ESTUDIANTES_GRUPO_URL = process.env.NEXT_PUBLIC_ESTUDIANTES_GRUPO;

  const [globalEdit, setGlobalEdit] = useState(false);
  const [editingData, setEditingData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [openConfig, setOpenConfig] = useState(false);
  const [ponderacionError, setPonderacionError] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Estado para NMA
  const [nma, setNMA] = useState(null);
  const [errorNma, setErrorNma] = useState(null);

  // Estado para controlar el toast de recálculo
  const [showRecalcToast, setShowRecalcToast] = useState(true);
  // Estado para boton cancelar notas
  const [modoEdicion, setModoEdicion] = useState(false);
  const toastShownRef = useRef(false);
  const cicloLoaded = useRef(false); // Agregar ref para controlar carga

  // Estados para el ciclo actual dinámico
  const {
    cicloActual,
    loadingCiclo,
    errorCiclo,
    obtenerCicloActual,
    setCicloActualFallback,
  } = useCicloActual();

  const router = useRouter();
  const { groupId } = router.query;

  const { grupos, setGrupoSeleccionado, IDDocente } = useGrupos();
  const {
    estudiantes,
    busqueda,
    errorMsg,
    setErrorMsg,
    setBusqueda,
    loading,
    setEstudiantes,
  } = useEstudiantes();

  const { enableNotes } = useConfiguracion();
  const { user } = useUser();
  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];
  // Coaccionar a número para soportar respuestas donde IDRol venga como string
  const isDecano = roles.some((rol) => Number(rol?.IDRol) === 2);
  const isDocente = roles.some((rol) => Number(rol?.IDRol) === 10);
  // Fallback: si ya tenemos IDDocente en contexto, tratar como docente para mostrar acciones
  const canSeeNoteActions = useMemo(
    () => isDecano || isDocente || Boolean(IDDocente),
    [isDecano, isDocente, IDDocente]
  );

  // Estados para permisos específicos del grupo
  const [permisosGrupo, setPermisosGrupo] = useState(null);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  // Determinar si puede editar notas basado en permisos específicos del grupo
  const puedeEditarNotas = useMemo(() => {
    // Si tenemos permisos específicos del grupo, usarlos (tanto para decano como docente)
    if (permisosGrupo !== null) {
      const puedeEditar =
        permisosGrupo.habilitada || permisosGrupo.cuadrosNotasHabilitados;
      // console.log(
      //   `🔍 Usando permisos específicos del grupo: enableNotes=${enableNotes}, permisos.habilitada=${
      //     permisosGrupo.habilitada
      //   }, resultado=${enableNotes && puedeEditar}`
      // );
      return enableNotes && puedeEditar;
    }

    // Si aún estamos cargando permisos específicos, no permitir edición hasta confirmar
    if (loadingPermisos && (isDecano || isDocente)) {
      // console.log("⏳ Cargando permisos específicos del grupo...");
      return false;
    }

    // Fallback: comportamiento original solo si no hay permisos específicos disponibles
    const fallback = enableNotes && (isDecano || isDocente);
    // console.log(
    //   `⚠️ Usando fallback para edición: enableNotes=${enableNotes}, esDecano=${isDecano}, esDocente=${isDocente}, resultado=${fallback}`
    // );
    return fallback;
  }, [enableNotes, isDecano, isDocente, permisosGrupo, loadingPermisos]);

  const columnas = ["p1", "p2", "pl1", "pl2", "pl3", "np", "p3", "er", "NF"];
  const etiquetas = {
    p1: "P1",
    p2: "P2",
    pl1: "L1",
    pl2: "L2",
    pl3: "L3",
    np: "NP",
    p3: "P3",
    er: "NR",
    NF: "NF",
  };

  const PONDERACION_KEY = "portal_docente_ponderacion";
  const valoresPorDefecto = {
    p1: 30,
    p2: 30,
    pl1: 0,
    pl2: 0,
    pl3: 0,
    p3: 40,
  };

  const [ponderacion, setPonderacion] = useState(() => {
    try {
      const saved = localStorage.getItem(PONDERACION_KEY);
      return saved ? JSON.parse(saved) : valoresPorDefecto;
    } catch {
      return valoresPorDefecto;
    }
  });

  const [ponderacionOriginal, setPonderacionOriginal] = useState(null);

  const sumaEditables = ({ p1, p2, pl1, pl2, pl3 }) => {
    return Number(p1) + Number(p2) + Number(pl1) + Number(pl2) + Number(pl3);
  };

  const handlePonderacionChange = (campo) => (e) => {
    let valor = parseFloat(e.target.value);
    if (Number.isNaN(valor)) valor = 0;
    if (valor < 0) valor = 0;
    if (valor > 100) valor = 100;

    setPonderacion((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(PONDERACION_KEY, JSON.stringify(ponderacion));
  }, [ponderacion]);

  // Recalcular notas cuando cambien las ponderaciones en modo edición
  useEffect(() => {
    if (globalEdit && editingData.length > 0) {
      setEditingData((prev) => prev.map((item) => recalcNotas(item)));

      // Mostrar toast informativo cuando se recalculen las notas (solo si no viene de aplicar config)
      if (showRecalcToast) {
        toast.info("Notas recalculadas", {
          description:
            "Las notas se han actualizado automáticamente con las nuevas ponderaciones",
          icon: <FiBarChart className="text-blue-600" />,
          duration: 2000,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ponderacion.p1,
    ponderacion.p2,
    ponderacion.pl1,
    ponderacion.pl2,
    ponderacion.pl3,
    ponderacion.p3,
    globalEdit,
  ]);

  // Cargar el ciclo actual al montar el componente
  useEffect(() => {
    if (grupos.length > 0 && groupId && !cicloLoaded.current) {
      cicloLoaded.current = true;
      obtenerCicloActual(grupos, groupId);
    }
  }, [grupos, groupId]); // ✅ SOLUCIONADO: Removida la dependencia problemática

  // Actualizar ciclo actual cuando cambia el grupo actual (fallback)
  useEffect(() => {
    if (grupos.length > 0 && groupId && !cicloActual && !loadingCiclo) {
      const grupo = grupos.find(
        (g) => g.IDGrupo.toString() === groupId.toString()
      );
      if (grupo?.Ciclo) {
        setCicloActualFallback(grupo.Ciclo);
      }
    }
  }, [grupos, groupId, cicloActual, loadingCiclo, setCicloActualFallback]);

  // Toast de carga exitosa
  useEffect(() => {
    if (
      !loading &&
      !errorMsg &&
      !toastShownRef.current &&
      estudiantes.length > 0
    ) {
      toast.success("Estudiantes cargados correctamente", {
        description: `Se encontraron ${estudiantes.length} estudiantes en el grupo`,
        duration: 3000,
        icon: <FiCheckCircle className="text-green-600" />,
        style: {
          background: "linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)",
          border: "1px solid #22c55e",
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "font-medium",
      });
      toastShownRef.current = true;
    }
  }, [loading, errorMsg, estudiantes.length]);

  useEffect(() => {
    if (groupId) {
      setGrupoSeleccionado(typeof groupId === "string" ? +groupId : groupId);
    }
  }, [groupId, setGrupoSeleccionado]);

  const grupoActual = useMemo(() => {
    if (!groupId || !grupos.length) return null;
    return grupos.find((g) => g.IDGrupo.toString() === groupId.toString());
  }, [grupos, groupId]);

  // Función para consultar permisos específicos del grupo
  const consultarPermisosGrupo = useCallback(
    async (grupoId, docenteId, nombreMateria) => {
      if (!grupoId || !docenteId) return;

      try {
        setLoadingPermisos(true);
        /* console.log(
          `🔍 Consultando permisos para grupo ${grupoId}, docente ${docenteId}, materia: ${nombreMateria}`
        ); */

        const response = await fetch(
          `${CONFIGURACION_DOCENTE_URL}/${docenteId}/permisos-grupo/${grupoId}?t=${Date.now()}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.warn(
            `⚠️ No se pudieron obtener permisos específicos para el grupo ${grupoId}. Usando permisos globales.`
          );
          // Si no existe el endpoint específico, usar el comportamiento global como fallback
          setPermisosGrupo({
            habilitada: enableNotes,
            cuadrosNotasHabilitados: enableNotes,
          });
          return;
        }

        const data = await response.json();
        // console.log(`✅ Permisos actualizados para grupo ${grupoId}:`, data);

        // El backend devuelve: { habilitada: true/false, idDocente: "856", grupoId: "11042", clave: "...", tipo: "especifico" }
        // Normalizar la respuesta para que sea compatible con la lógica existente
        const permisosNormalizados = {
          habilitada: data.habilitada,
          cuadrosNotasHabilitados: data.habilitada, // Alias para compatibilidad
          ...data,
        };

        // Actualizar permisos solo si realmente hay cambios
        setPermisosGrupo((prevPermisos) => {
          // Si es la primera vez o hay cambios reales, actualizar
          const prevHabilitada = prevPermisos?.habilitada;
          const nuevaHabilitada = permisosNormalizados.habilitada;

          if (!prevPermisos || prevHabilitada !== nuevaHabilitada) {
            // console.log(
            //   `🔄 Permisos actualizados de ${prevHabilitada} a ${nuevaHabilitada}`
            // );
            return permisosNormalizados;
          }
          // Si no hay cambios, mantener el estado actual
          // console.log(
          //   `ℹ️ Sin cambios en permisos: ${prevHabilitada} = ${nuevaHabilitada}`
          // );
          return prevPermisos;
        });
      } catch (error) {
        console.error("❌ Error al consultar permisos del grupo:", error);
        // En caso de error, usar permisos globales como fallback
        setPermisosGrupo({
          habilitada: enableNotes,
          cuadrosNotasHabilitados: enableNotes,
        });
      } finally {
        setLoadingPermisos(false);
      }
    },
    [enableNotes]
  );

  // Consultar permisos específicos del grupo cuando cambie el grupo o el docente
  useEffect(() => {
    // Consultar permisos específicos si tenemos la info necesaria y el usuario puede ser docente
    if (groupId && IDDocente && grupoActual && (isDecano || isDocente)) {
      // console.log(
      //   `🔍 Grupo cambió a ${groupId}, consultando permisos específicos para IDDocente: ${IDDocente}, isDecano: ${isDecano}, isDocente: ${isDocente}...`
      // );
      consultarPermisosGrupo(
        groupId,
        IDDocente,
        grupoActual.Nombre || grupoActual.Materia
      );
    }
  }, [
    groupId,
    IDDocente,
    grupoActual,
    isDecano,
    isDocente,
    consultarPermisosGrupo,
  ]);

  // ✨ Re-consultar permisos cuando el usuario regrese a la página
  useEffect(() => {
    const handleWindowFocus = () => {
      // Solo re-consultar si tenemos los datos necesarios y es un docente o decano
      if (groupId && IDDocente && grupoActual && (isDecano || isDocente)) {
        // console.log(
        //   `🔄 Usuario regresó a la página, re-consultando permisos para grupo ${groupId}, IDDocente: ${IDDocente}...`
        // );
        consultarPermisosGrupo(
          groupId,
          IDDocente,
          grupoActual.Nombre || grupoActual.Materia
        );
      }
    };

    // Agregar listener para cuando la ventana recupere el foco
    window.addEventListener("focus", handleWindowFocus);

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [
    groupId,
    IDDocente,
    grupoActual,
    isDecano,
    isDocente,
    consultarPermisosGrupo,
  ]);

  const recalcNotas = (item) => {
    const { p1, p2, pl1, pl2, pl3, p3, er } = item;

    // Calcular NP: suma ponderada de parciales y laboratorios (excluyendo P3)
    const np =
      (p1 * ponderacion.p1 +
        p2 * ponderacion.p2 +
        pl1 * ponderacion.pl1 +
        pl2 * ponderacion.pl2 +
        pl3 * ponderacion.pl3) /
      100;

    // Calcular NF: NP + (P3 × porcentaje P3)
    // Nota: P3 es una nota sobre 10, ponderacion.p3 es el porcentaje (ej: 40)
    let nf = np + (p3 * ponderacion.p3) / 100;

    // Solo usar nota de recuperación si existe, tiene valor y es mayor que la nota de P3
    // La nota de recuperación reemplaza a P3, no se aplica automáticamente por tener NF < 6
    if (er && er > 0 && er > p3) {
      nf = np + (er * ponderacion.p3) / 100;
    }

    return {
      ...item,
      np: parseFloat(np.toFixed(2)),
      NF: parseFloat(nf.toFixed(2)),
    };
  };

  const handleGlobalEdit = () => {
    const initial = estudiantes.map((est) => {
      const base = {
        ...est, // Include all student data
        IDInscripcion: est.IDInscripcion,
      };
      ["p1", "p2", "pl1", "pl2", "pl3", "p3", "er"].forEach((c) => {
        base[c] = est[c] ?? 0;
      });
      return recalcNotas(base);
    });
    setEditingData(initial);
    setGlobalEdit(true);
    setErrorMsg("");
    setSuccessMsg("");

    toast.info("Modo edición activado", {
      description: "Ahora puedes editar las notas de los estudiantes",
      icon: <FiEdit3 className="text-blue-600" />,
      duration: 3000,
    });
  };

  const handleInputChange = (e, id, field) => {
    let val = parseFloat(e.target.value);

    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 10) val = 10;

    val = Math.round(val * 10) / 10;

    setEditingData((prev) =>
      prev.map((item) => {
        if (item.IDInscripcion === id) {
          const updated = { ...item, [field]: val };
          return recalcNotas(updated);
        }
        return item;
      })
    );
  };

  const handleGlobalSave = async () => {
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    setModoEdicion(true);

    try {
      toast.loading("Guardando notas...", {
        id: "save-toast",
      });

      const notasParaEnviar = editingData.map((nota) => ({
        IDInscripcion: nota.IDInscripcion,
        p1: nota.p1,
        p2: nota.p2,
        pl1: nota.pl1,
        pl2: nota.pl2,
        pl3: nota.pl3,
        p3: nota.p3,
        er: nota.er,
        np: nota.np,
        NF: nota.NF,
        IDGrupo: groupId,
      }));

      const putRes = await fetch(`${ESTUDIANTES_GRUPO_URL}/${groupId}/notas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(notasParaEnviar),
      });

      const putText = await putRes.text();

      if (!putRes.ok) {
        let err;
        try {
          err = JSON.parse(putText);
        } catch {
          err = { message: putText };
        }
        throw new Error(err.message || `HTTP ${putRes.status}`);
      }

      const putJson = JSON.parse(putText);

      if (Array.isArray(putJson.data)) {
        const exitosos = putJson.data.filter((res) => res.success === true);
        const fallidos = putJson.data.filter((res) => res.success === false);

        if (exitosos.length === 0) {
          toast.info("Sin cambios", {
            id: "save-toast",
            description: "No se detectaron cambios en las notas.",
            icon: <FiInfo className="text-blue-500" />,
            duration: 4000,
          });
          return;
        }

        if (fallidos.length > 0) {
          toast.warning("Cambios parciales", {
            id: "save-toast",
            description: `${exitosos.length} notas actualizadas, ${fallidos.length} no se modificaron.`,
            icon: <FiAlertTriangle className="text-yellow-500" />,
            duration: 5000,
          });
        }
      }

      const studentsRes = await fetch(
        `${ESTUDIANTES_GRUPO_URL}/${groupId}/estudiantes`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const studentsText = await studentsRes.text();

      if (!studentsRes.ok) {
        let err;
        try {
          err = JSON.parse(studentsText);
        } catch {
          err = { message: studentsText };
        }
        throw new Error(err.message || `HTTP ${studentsRes.status}`);
      }

      const studentsJson = JSON.parse(studentsText);
      const nuevosEstudiantes = studentsJson.data ?? studentsJson;

      // Recalcular las notas con las ponderaciones actuales para asegurar consistencia
      const estudiantesRecalculados = Array.isArray(nuevosEstudiantes)
        ? nuevosEstudiantes.map((est) => {
            const base = { ...est };
            ["p1", "p2", "pl1", "pl2", "pl3", "p3", "er"].forEach((c) => {
              base[c] = est[c] ?? 0;
            });
            return recalcNotas(base);
          })
        : [];

      setEstudiantes(estudiantesRecalculados);
      setSuccessMsg("Notas actualizadas correctamente!");

      toast.success("Notas guardadas exitosamente", {
        id: "save-toast",
        description: "Las calificaciones han sido actualizadas correctamente.",
        icon: <FiCheckCircle className="text-green-600" />,
        duration: 3000,
        style: {
          background: "linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)",
          border: "1px solid #22c55e",
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "font-medium",
      });

      setGlobalEdit(false);
      setEditingData([]);
    } catch (err) {
      console.error("❌ Error durante guardado/refresco:", err);
      toast.error("Error al guardar notas", {
        id: "save-toast",
        description: err.message,
        icon: <FiXCircle className="text-red-600" />,
        duration: 5000,
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
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch NMA - UseEffect para obtener el NMA de cada grupo
  useEffect(() => {
    const fetchNMA = async () => {
      const url = `${ESTUDIANTES_GRUPO_URL}/${groupId}/estudiantes`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.status}`);
        }

        const responseData = await response.json();

        // console.log("📊 Respuesta completa del endpoint:", responseData);

        // Buscar NMA en diferentes ubicaciones posibles
        let NMAData = null;

        // 1. Primero buscar en el nivel principal
        if (responseData.NMA) {
          NMAData = responseData.NMA;
        } else if (responseData.nma) {
          NMAData = responseData.nma;
        }
        // 2. Buscar en el primer estudiante del array de datos (ya que todos tendrían el mismo NMA)
        else if (
          responseData.data &&
          Array.isArray(responseData.data) &&
          responseData.data.length > 0
        ) {
          const primerEstudiante = responseData.data[0];
          NMAData = primerEstudiante.NMA || primerEstudiante.nma;
        }
        // 3. Buscar si hay un campo data.NMA en el nivel superior
        else if (responseData.data && responseData.data.NMA) {
          NMAData = responseData.data.NMA;
        }

        // console.log("🎯 NMA encontrado:", NMAData);

        if (NMAData && typeof NMAData === "object") {
          setNMA(NMAData);
          setErrorNma(null);
          // console.log("✅ NMA configurado correctamente:", NMAData);
        } else if (NMAData) {
          // Si el NMA existe pero no es objeto, crear uno con la estructura esperada
          setNMA({ nma_actual: NMAData });
          setErrorNma(null);
          /* console.log("✅ NMA configurado (convertido):", {
            nma_actual: NMAData,
          }); */
        } else {
          setNMA(null);
          setErrorNma("Formato de datos NMA inválido o no encontrado");
          console.warn("❌ No se encontró NMA válido en la respuesta");

          // Log adicional para debugging
          if (
            responseData.data &&
            Array.isArray(responseData.data) &&
            responseData.data.length > 0
          ) {
            /* console.log(
              "🔍 Estructura del primer estudiante:",
              Object.keys(responseData.data[0])
            ); */
          }
        }
      } catch (error) {
        console.error("❌ Error al obtener el NMA:", error);
        setNMA(null);
        setErrorNma(`Error al cargar datos: ${error.message}`);
      }
    };

    if (groupId) {
      fetchNMA();
    }
  }, [groupId]);

  useEffect(() => {
    if (successMsg) {
      const timeout = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg]);

  const estudiantesFiltrados = Array.isArray(estudiantes)
    ? estudiantes.filter((est) =>
        `${est.IDExpediente} ${est.NombreEstudiante}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      )
    : [];

  const getBgClass = (col) => {
    // Columnas amarillas (notas de parciales y laboratorios)
    const amarillos = ["p1", "p2", "pl1", "pl2", "pl3", "p3", "er"];
    if (amarillos.includes(col)) {
      return "bg-yellow-100";
    }
    // Columna verde (nota final)
    if (col === "NF") {
      return "bg-green-100";
    }
    // Columna naranja (nota promedio)
    if (col === "np") {
      return "bg-orange-100";
    }
    // Otras columnas con fondo gris claro
    return "bg-gray-50";
  };

  // Función para colores del encabezado con gradientes que contrasten
  const getBgClassHeader = (col) => {
    // Columnas amarillas (notas de parciales y laboratorios) - más oscuras en el header
    const amarillos = ["p1", "p2", "pl1", "pl2", "pl3", "p3", "er"];
    if (amarillos.includes(col)) {
      return "bg-blue-700";
    }
    // Columna verde (nota final) - más oscura en el header
    if (col === "NF") {
      return "bg-green-700";
    }
    // Columna naranja (nota promedio) - más oscura en el header
    if (col === "np") {
      return "bg-orange-700";
    }
    // Otras columnas con el gradiente principal
    return "bg-gradient-to-b from-indigo-600 to-blue-700";
  };

  const handleOpenConfig = () => {
    setPonderacionOriginal({ ...ponderacion });
    setOpenConfig(true);
    setPonderacionError("");
  };

  const handleCancelConfigModal = () => {
    if (ponderacionOriginal) {
      setPonderacion({ ...ponderacionOriginal });
    }
    setOpenConfig(false);
    setPonderacionError("");
  };

  const handleApplyConfigModal = () => {
    setOpenConfig(false);
    setPonderacionError("");

    // Deshabilitar temporalmente el toast de recálculo
    setShowRecalcToast(false);

    toast.success("Ponderaciones aplicadas", {
      description:
        "La configuración del cuadro de notas se ha actualizado correctamente",
      icon: <FiCheckCircle className="text-green-600" />,
      duration: 2500,
    });

    // Reactivar el toast de recálculo después de 3 segundos
    setTimeout(() => {
      setShowRecalcToast(true);
    }, 3000);

    // El recálculo de notas se maneja automáticamente por el useEffect
  };

  const handleCancelEditNotas = () => {
    setGlobalEdit(false);
    setEditingData([]);
    setModoEdicion(false);
    setErrorMsg("");
    setSuccessMsg("");

    toast.info("Edición cancelada", {
      description: "Los cambios no guardados se han descartado",
      icon: <FiX className="text-gray-600" />,
      duration: 2000,
    });
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!estudiantesFiltrados.length)
      return { total: 0, aprobados: 0, promedio: 0, porcentajeAprobacion: 0 };

    const total = estudiantesFiltrados.length;
    const aprobados = estudiantesFiltrados.filter(
      (est) => parseFloat(est.NF || 0) >= 6
    ).length;
    const sumaNotas = estudiantesFiltrados.reduce(
      (sum, est) => sum + parseFloat(est.NF || 0),
      0
    );
    const promedio = sumaNotas / total;
    const porcentajeAprobacion = (aprobados / total) * 100;

    return { total, aprobados, promedio, porcentajeAprobacion };
  }, [estudiantesFiltrados]);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="w-16 h-3 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="w-16 h-3 bg-gray-200 rounded mb-2"></div>
            <div className="w-12 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="w-12 h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Control panel skeleton */}
      <div className="bg-white rounded-2xl shadow-xl p-5 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-64 h-10 bg-gray-200 rounded-xl"></div>
          <div className="flex space-x-3">
            <div className="w-40 h-10 bg-gray-200 rounded-xl"></div>
            <div className="w-24 h-10 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-xl p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>
          {grupoActual ? `${grupoActual.Nombre} - Estudiantes` : "Estudiantes"}{" "}
          - Portal Docente
        </title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-8">
        <div className="mx-auto space-y-3 sm:space-y-4">
          {" "}
          {/*max-w-7xl*/}
          {/* Título principal */}
          {/* <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-6"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Gestión de Estudiantes
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Administra las calificaciones y el rendimiento académico de tus
              estudiantes
            </p>
          </motion.div> */}
          {/* Header información del grupo */}
          {grupoActual && (
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6"
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="p-2 sm:p-3 bg-emerald-100 rounded-xl"
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiCalendar className="text-emerald-600 text-xl sm:text-2xl" />
                    </motion.div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Ciclo Académico
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {cicloActual || grupoActual?.Ciclo || "No disponible"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Grupo
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {grupoActual.Identificador || "No disponible"}
                      </p>
                    </div>
                    <motion.div
                      className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiBookOpen className="text-white text-lg sm:text-xl" />
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg">
                        <FiBook className="text-white text-xs sm:text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                          Materia
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-800 truncate">
                          {grupoActual.Nombre || "No disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-orange-200">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                        <FiMapPin className="text-white text-xs sm:text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                          Aula
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-orange-800">
                          {grupoActual.Aula || "No disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-purple-200 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-end space-x-3">
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Jornada
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-purple-800 truncate">
                          {grupoActual.Jornada || "No disponible"}
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                        <FiClock className="text-white text-xs sm:text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Indicador de estado de permisos eliminado - movido al panel de control */}
                </div>
              </div>
            </motion.section>
          )}
          {loading ? (
            renderSkeleton()
          ) : (
            <>
              {/* Panel de control */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5"
              >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-bl from-blue-100 via-indigo-100 to-purple-100 rounded-full opacity-20 transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>

                <div className="relative z-10">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {!globalEdit && (
                        <div className="relative group">
                          <motion.button
                            whileHover={
                              enableNotes && puedeEditarNotas
                                ? { scale: 1.02, y: -2 }
                                : {}
                            }
                            whileTap={
                              enableNotes && puedeEditarNotas
                                ? { scale: 0.98 }
                                : {}
                            }
                            onClick={
                              enableNotes && puedeEditarNotas
                                ? handleOpenConfig
                                : undefined
                            }
                            disabled={!(enableNotes && puedeEditarNotas)}
                            className={`flex items-center space-x-1.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg font-medium text-xs sm:text-sm ${
                              enableNotes && puedeEditarNotas
                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl cursor-pointer"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            title={
                              !(enableNotes && puedeEditarNotas)
                                ? !enableNotes
                                  ? "Cuadros de notas globalmente deshabilitados"
                                  : !puedeEditarNotas && isDocente
                                  ? "Cuadro de notas deshabilitado para este grupo"
                                  : "No tienes permisos para editar notas"
                                : ""
                            }
                          >
                            <FiSettings size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">
                              Configurar Cuadro de Notas
                            </span>
                            <span className="sm:hidden">Configurar</span>
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Indicador de estado del cuadro de notas */}
                    {(isDecano || isDocente) && (
                      <div className="flex-shrink-0">
                        <div
                          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                            puedeEditarNotas
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {puedeEditarNotas ? (
                            <FiUnlock className="text-green-600 text-sm" />
                          ) : (
                            <FiLock className="text-red-600 text-sm" />
                          )}
                          <span className="hidden sm:inline">Estado:</span>
                          <span className="font-semibold">
                            {puedeEditarNotas
                              ? "🟢 HABILITADO"
                              : "🔴 DESHABILITADO"}
                          </span>
                          {loadingPermisos && (
                            <div className="w-3 h-3 border border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Búsqueda y Editar Notas */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <div className="relative flex-1 sm:w-48 lg:w-56">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FiSearch size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar estudiante..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-xs sm:text-sm shadow-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        {!globalEdit && (
                          <div className="relative group">
                            <motion.button
                              whileHover={
                                enableNotes && puedeEditarNotas
                                  ? { scale: 1.02, y: -2 }
                                  : {}
                              }
                              whileTap={
                                enableNotes && puedeEditarNotas
                                  ? { scale: 0.98 }
                                  : {}
                              }
                              onClick={
                                enableNotes && puedeEditarNotas
                                  ? handleGlobalEdit
                                  : undefined
                              }
                              disabled={!(enableNotes && puedeEditarNotas)}
                              className={`flex items-center space-x-1.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg font-medium text-xs sm:text-sm ${
                                enableNotes && puedeEditarNotas
                                  ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 hover:shadow-xl cursor-pointer"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                              title={
                                !(enableNotes && puedeEditarNotas)
                                  ? !enableNotes
                                    ? "Cuadros de notas globalmente deshabilitados"
                                    : !puedeEditarNotas && isDocente
                                    ? "Cuadro de notas deshabilitado para este grupo"
                                    : "No tienes permisos para editar notas"
                                  : ""
                              }
                            >
                              <FiEdit3 size={14} className="sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">
                                Editar Notas
                              </span>
                              <span className="sm:hidden">Editar</span>
                            </motion.button>
                          </div>
                        )}

                        {globalEdit && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleCancelEditNotas}
                              className="flex items-center space-x-1.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl font-medium text-xs sm:text-sm"
                            >
                              <FiX size={14} className="sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Cancelar</span>
                              <span className="sm:hidden">Cancel</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleGlobalSave}
                              disabled={isSaving}
                              className="flex items-center space-x-1.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl font-medium text-xs sm:text-sm"
                            >
                              <FiSave size={14} className="sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">
                                {isSaving ? "Guardando..." : "Guardar"}
                              </span>
                              <span className="sm:hidden">
                                {isSaving ? "..." : "OK"}
                              </span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Mensajes de estado */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg sm:rounded-xl flex items-center space-x-3"
                  >
                    <FiXCircle className="text-red-500 flex-shrink-0" />
                    <span className="text-sm">{errorMsg}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg sm:rounded-xl flex items-center space-x-3"
                  >
                    <FiCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabla de estudiantes */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                {estudiantesFiltrados.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                      No se encontraron estudiantes
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500">
                      {busqueda
                        ? `No hay estudiantes que coincidan con "${busqueda}"`
                        : "No hay estudiantes registrados en este grupo"}
                    </p>
                  </div>
                ) : (
                  <ModernStudentTable
                    estudiantes={
                      globalEdit ? editingData : estudiantesFiltrados
                    }
                    columnas={columnas}
                    etiquetas={etiquetas}
                    globalEdit={globalEdit}
                    handleInputChange={handleInputChange}
                    getBgClass={getBgClass}
                    getBgClassHeader={getBgClassHeader}
                  />
                )}
              </motion.section>
            </>
          )}
        </div>

        {/* Modal de configuración */}
        <ModernConfigModal
          openConfig={openConfig}
          setOpenConfig={setOpenConfig}
          ponderacion={ponderacion}
          handlePonderacionChange={handlePonderacionChange}
          etiquetas={etiquetas}
          sumaEditables={sumaEditables}
          ponderacionError={ponderacionError}
          handleCancelConfigModal={handleCancelConfigModal}
          handleApplyConfigModal={handleApplyConfigModal}
          nma={nma}
          errorNma={errorNma}
        />
      </div>
    </Layout>
  );
}

const EstudiantesPageWrapper = () => (
  <CicloActualProvider>
    <GruposProvider>
      <EstudiantesProvider>
        <ConfiguracionProvider>
          <UserProvider>
            <EstudiantesPage />
          </UserProvider>
        </ConfiguracionProvider>
      </EstudiantesProvider>
    </GruposProvider>
  </CicloActualProvider>
);

export default EstudiantesPageWrapper;
