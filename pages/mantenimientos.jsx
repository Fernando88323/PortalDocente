import React, { useState, useEffect } from "react";
import Layout from "@/components/DashboardLayout/DashboardLayout";
import { useUser, UserProvider } from "../context/contextUser";
import {
  useConfiguracion,
  ConfiguracionProvider,
} from "../context/contextConfiguracion";

// Componente Modal de Confirmación Profesional
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Manejar tecla Escape
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Manejar animaciones de apertura y cierre
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Pequeño delay para permitir que el modal aparezca antes de la animación
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación antes de ocultar
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 200);
  };

  if (!isVisible) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ),
          bgColor: "bg-green-100",
          buttonColor: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
        };
      case "error":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ),
          bgColor: "bg-red-100",
          buttonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "info":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bgColor: "bg-blue-100",
          buttonColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
      default: // warning
        return {
          icon: (
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          bgColor: "bg-amber-100",
          buttonColor: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        };
    }
  };

  const { icon, bgColor, buttonColor } = getIconAndColors();

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-200 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-gray-500 transition-opacity duration-200 ${
            isAnimating ? "bg-opacity-75" : "bg-opacity-0"
          }`}
          onClick={handleClose}
        ></div>

        {/* Spacer for centering */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal */}
        <div
          className={`relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all duration-200 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 ${
            isAnimating
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-4 opacity-0 scale-95 sm:translate-y-0 sm:scale-95"
          }`}
        >
          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${bgColor} sm:mx-0 sm:h-10 sm:w-10`}
            >
              {icon}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${buttonColor}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={handleClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Modal de Notificación (solo información)
const NotificationModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  actionText = "Entendido",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Manejar tecla Escape
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Manejar animaciones de apertura y cierre
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Pequeño delay para permitir que el modal aparezca antes de la animación
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación antes de ocultar
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 200);
  };

  if (!isVisible) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bgColor: "bg-green-100",
          buttonColor: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
        };
      case "error":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bgColor: "bg-red-100",
          buttonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          bgColor: "bg-amber-100",
          buttonColor: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        };
      default: // info
        return {
          icon: (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bgColor: "bg-blue-100",
          buttonColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
    }
  };

  const { icon, bgColor, buttonColor } = getIconAndColors();

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-200 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-gray-500 transition-opacity duration-200 ${
            isAnimating ? "bg-opacity-75" : "bg-opacity-0"
          }`}
          onClick={handleClose}
        ></div>

        {/* Spacer for centering */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal */}
        <div
          className={`relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all duration-200 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 ${
            isAnimating
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-4 opacity-0 scale-95 sm:translate-y-0 sm:scale-95"
          }`}
        >
          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${bgColor} sm:mx-0 sm:h-10 sm:w-10`}
            >
              {icon}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:justify-end">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${buttonColor}`}
              onClick={handleClose}
            >
              {actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente reutilizable para un interruptor de palanca (toggle switch)
const ToggleSwitch = ({ label, isEnabled, onToggle, disabled = false }) => {
  return (
    <div className="flex items-center justify-between py-3 px-2 sm:px-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 ease-in-out">
      <label
        htmlFor={label.replace(/\s/g, "-").toLowerCase()}
        className={`text-base sm:text-lg font-medium text-slate-700 cursor-pointer select-none ${
          disabled ? "opacity-60" : ""
        }`}
      >
        {label}
      </label>
      <div className="relative inline-block w-14 h-7 transition duration-200 ease-in-out select-none">
        <input
          type="checkbox"
          id={label.replace(/\s/g, "-").toLowerCase()}
          className="absolute block w-7 h-7 bg-white border-4 border-slate-300 rounded-full appearance-none cursor-pointer checked:right-0 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out shadow-md"
          checked={isEnabled}
          onChange={onToggle}
          disabled={disabled}
        />
        <label
          htmlFor={label.replace(/\s/g, "-").toLowerCase()}
          className={`block h-7 rounded-full cursor-pointer ${
            isEnabled ? "bg-blue-500 shadow-inner" : "bg-slate-300 shadow-inner"
          } transition-colors duration-200 ease-in-out`}
        ></label>
      </div>
    </div>
  );
};

// Envolver App con UserProvider
export default function WrappedApp() {
  return (
    <UserProvider>
      <ConfiguracionProvider>
        <App />
      </ConfiguracionProvider>
    </UserProvider>
  );
}

function App() {
  // Estados para el nuevo diseño
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [facultadData, setFacultadData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cicloActual, setCicloActual] = useState(null); // Estado para el ciclo dinámico
  const [loadingCiclo, setLoadingCiclo] = useState(true); // Loading del ciclo
  const [errorCiclo, setErrorCiclo] = useState(null); // Error del ciclo
  const [accionesOpen, setAccionesOpen] = useState(false); // dropdown acciones
  const accionesRef = React.useRef(null);

  // Estados para modales profesionales
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  });

  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    actionText: "Entendido",
  });

  // Obtener el usuario y su estado de carga desde el contexto
  const { enableNotes, setEnableNotes } = useConfiguracion();

  const { user, loading } = useUser();

  // ─── ROLES ───
  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];
  const isDecano = roles.some((rol) => rol.IDRol === 2);
  const isDocente = roles.some((rol) => rol.IDRol === 10);
  // Solo puede habilitar si:
  // - es decano (ROL 2)
  // - o es decano y docente (tiene ambos roles 2 y 10)
  const puedeHabilitarEvaluacion = isDecano;

  // Funciones helper para modales
  const showConfirmation = (
    title,
    message,
    onConfirm,
    type = "warning",
    confirmText = "Confirmar",
    cancelText = "Cancelar"
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      type,
      confirmText,
      cancelText,
    });
  };

  const showNotification = (
    title,
    message,
    type = "info",
    actionText = "Entendido"
  ) => {
    setNotificationModal({
      isOpen: true,
      title,
      message,
      type,
      actionText,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  const closeNotificationModal = () => {
    setNotificationModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Función para calcular contadores de modo
  const calcularContadoresModo = () => {
    if (!docentes || docentes.length === 0) {
      return {
        total: 0,
        reposicion: 0,
        normal: 0,
        porcentajeReposicion: 0,
      };
    }

    const total = docentes.length;
    const reposicion = docentes.filter(
      (docente) => docente.Modo === "REPOSICION"
    ).length;
    const normal = total - reposicion;
    const porcentajeReposicion = total > 0 ? (reposicion / total) * 100 : 0;

    return {
      total,
      reposicion,
      normal,
      porcentajeReposicion,
    };
  };

  // Función auxiliar para obtener el ciclo actual dinámicamente
  const obtenerCicloActual = async () => {
    try {
      setLoadingCiclo(true);
      setErrorCiclo(null);

      const CICLO_ACTUAL_URL = process.env.NEXT_PUBLIC_CICLO_ACTUAL;
      const response = await fetch(CICLO_ACTUAL_URL, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorMsg = `Error al obtener ciclo actual: ${response.status}`;
        console.error(errorMsg);
        setErrorCiclo(errorMsg);
        return null;
      }

      const data = await response.json();
      if (data.ok && data.cicloActual) {
        setCicloActual(data.cicloActual);
        setErrorCiclo(null);
        return data.cicloActual;
      } else {
        const errorMsg = "Respuesta inválida del ciclo actual";
        console.error(errorMsg, data);
        setErrorCiclo(errorMsg);
        return null;
      }
    } catch (error) {
      const errorMsg = "Error de conexión al obtener ciclo actual";
      console.error(errorMsg, error);
      setErrorCiclo(errorMsg);
      return null;
    } finally {
      setLoadingCiclo(false);
    }
  };

  // Función para obtener la facultad del decano logueado dinámicamente
  const obtenerFacultadDecano = async () => {
    try {
      // Obtener lista de decanos
      const DECANOS_URL = process.env.NEXT_PUBLIC_DECANOS;
      const decanosResponse = await fetch(DECANOS_URL, {
        credentials: "include",
      });

      if (!decanosResponse.ok) {
        throw new Error(`Error al obtener decanos: ${decanosResponse.status}`);
      }

      const decanosData = await decanosResponse.json();
      // console.log("👥 Decanos obtenidos:", decanosData);

      // Normalizar listado de decanos según la estructura de la respuesta
      let decanosArray = [];
      if (Array.isArray(decanosData)) {
        decanosArray = decanosData;
      } else if (decanosData && Array.isArray(decanosData.decanos)) {
        decanosArray = decanosData.decanos;
      } else {
        console.warn("Respuesta inesperada de /decanos:", decanosData);
        decanosArray = [];
      }

      if (decanosArray.length === 0) {
        throw new Error("No se obtuvieron decanos del endpoint");
      }

      // Obtener el identificador del usuario que usaremos para comparar
      const usuarioIDEmpleado =
        user?.IDEmpleado || user?.idEmpleado || user?.ID || user?.IDReferencia;
      // console.log("🔍 Buscando decano con IDEmpleado:", usuarioIDEmpleado);
      // console.log("👤 Usuario completo:", user);
      /* console.log(
        "🔍 DEBUG: Propiedades disponibles:",
        Object.keys(user || {})
      ); */

      if (!usuarioIDEmpleado) {
        throw new Error(
          "No se pudo obtener el IDEmpleado/IDReferencia del usuario logueado"
        );
      }

      // Buscar decano: permitimos dos coincidencias útiles
      // 1) IDEmpleado === usuarioIDEmpleado (caso normal)
      // 2) IDCargo === usuarioIDEmpleado (si el cliente envía IDReferencia que se corresponde con un cargo)
      const decanoActual = decanosArray.find(
        (dec) =>
          dec.IDEmpleado === usuarioIDEmpleado ||
          dec.IDCargo === usuarioIDEmpleado
      );

      if (!decanoActual) {
        throw new Error(
          `No se encontró el decano con IDEmpleado: ${usuarioIDEmpleado}`
        );
      }

      // console.log("✅ Decano encontrado:", decanoActual);

      // Retornar IDFacultad y nombre de facultad directamente de la respuesta
      if (decanoActual.IDFacultad && decanoActual.Cargo) {
        const facultadInfo = {
          IDFacultad: decanoActual.IDFacultad,
          Facultad: decanoActual.Cargo, // El nombre completo de la facultad está en Cargo
        };
        // console.log("🎯 Facultad obtenida directamente:", facultadInfo);
        return facultadInfo;
      } else {
        throw new Error(
          "El decano encontrado no tiene IDFacultad o Cargo válido"
        );
      }
    } catch (error) {
      console.error("❌ Error al obtener facultad del decano:", error);
      throw error;
    }
  };

  // Cargar el estado global al montar
  useEffect(() => {
    const NOTAS_CONFIG_URL = process.env.NEXT_PUBLIC_NOTAS;
    fetch(NOTAS_CONFIG_URL, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setEnableNotes(!!data.habilitada);
      })
      .catch(() => setEnableNotes(false));
  }, []);

  // Cargar el ciclo actual al montar el componente
  useEffect(() => {
    obtenerCicloActual();
  }, []);

  // Debug: Mostrar información de roles
  useEffect(() => {
    if (user && !loading) {
      /* console.log("👤 Usuario cargado:", {
        email: user.email,
        nombre: user.nombre,
        roles: roles,
        isDecano,
        isDocente,
        puedeHabilitarEvaluacion,
  }); */
    }
  }, [user, loading, roles, isDecano, isDocente, puedeHabilitarEvaluacion]);

  // Cerrar dropdown de Acciones al hacer click fuera
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (accionesRef.current && !accionesRef.current.contains(event.target)) {
        setAccionesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accionesRef]);

  // Totales mostrados en UI (se actualizan según búsqueda local)
  const getUniqueDocentesCount = (list) => {
    const setIds = new Set();
    (list || []).forEach((it) => {
      const id = it.IDDocente ?? it.ID ?? it.IDGrupo ?? it.Docente ?? it.Nombre;
      if (id !== undefined && id !== null) setIds.add(String(id));
    });
    return setIds.size;
  };

  const displayTotalRegistros = (() => {
    // Si hay término de búsqueda, mostrar el número de filas actualmente filtradas
    if (searchTerm && searchTerm.trim()) {
      return docentes ? docentes.length : 0;
    }
    // Si backend provee totalRegistros, preferirlo
    if (facultadData && typeof facultadData.totalRegistros === "number")
      return facultadData.totalRegistros;
    // Fallback: longitud del array cargado
    return docentes ? docentes.length : 0;
  })();

  const displayTotalDocentes = (() => {
    if (searchTerm && searchTerm.trim()) {
      return getUniqueDocentesCount(docentes || []);
    }
    if (facultadData && typeof facultadData.totalDocentes === "number")
      return facultadData.totalDocentes;
    // Fallback: calcular únicos en el conjunto actual de docentes
    return getUniqueDocentesCount(docentes || []);
  })();

  // Cargar automáticamente los docentes de la facultad del decano
  useEffect(() => {
    const cargarDocentesFacultad = async () => {
      // Esperar a que el ciclo esté cargado
      if (loadingCiclo || !cicloActual) {
        // console.log("⏳ Esperando a que se cargue el ciclo actual...");
        return;
      }

      // Esperar a que el usuario esté completamente cargado
      if (loading) {
        // console.log("⏳ Esperando a que termine la carga del usuario...");
        return;
      }

      if (!user || !isDecano) {
        /* console.log("🔍 cargarDocentesFacultad: Condiciones no cumplidas", {
          user: !!user,
          isDecano,
          loading,
          userRoles: user?.sistemaasignacionroles,
        }); */
        return;
      }

      /* console.log(
        "🚀 Iniciando carga de docentes para decano:",
        user.email || user.nombre
      ); */
      setIsSearching(true);

      try {
        // Verificar que tenemos las cookies de sesión
        // console.log("🍪 Verificando cookies disponibles:", document.cookie);

        // Primero verificar que el usuario tenga acceso válido
        // console.log("🔐 Verificando acceso del usuario...");
        const DASHBOARD_ME_URL = process.env.NEXT_PUBLIC_DASHBOARD_PROTECTED_ME;
        const testResponse = await fetch(DASHBOARD_ME_URL, {
          credentials: "include",
        });

        if (!testResponse.ok) {
          console.error(
            "❌ Usuario no tiene acceso válido:",
            testResponse.status
          );
          if (testResponse.status === 401) {
            setErrorMessage(
              "Sesión expirada. Por favor, inicia sesión nuevamente."
            );
            return;
          }
        } else {
          // console.log("✅ Usuario tiene acceso válido");
        }

        // Obtener las facultades disponibles
        // console.log("📋 Obteniendo lista de facultades...");
        const FACULTADES_URL = process.env.NEXT_PUBLIC_FACULTADES;
        const facultadesResponse = await fetch(FACULTADES_URL, {
          credentials: "include",
        });

        /* console.log(
          "📡 Respuesta facultades - Status:",
          facultadesResponse.status,
          "OK:",
          facultadesResponse.ok
        ); */

        if (!facultadesResponse.ok) {
          console.error(
            "❌ Error en respuesta de facultades:",
            facultadesResponse.status
          );
          const errorText = await facultadesResponse.text();
          console.error("❌ Texto del error:", errorText);

          // Manejar específicamente el error 403 (sin permisos)
          if (facultadesResponse.status === 403) {
            throw new Error(
              "Sin permisos para acceder a facultades. Solo decanos pueden usar esta funcionalidad."
            );
          }
          throw new Error(
            `Error al obtener facultades: ${facultadesResponse.status} - ${errorText}`
          );
        }

        // NUEVA LÓGICA DINÁMICA: Obtener facultad del decano logueado
        // console.log("🎯 MODO DINÁMICO: Obteniendo facultad del decano logueado");
        const facultadDelDecano = await obtenerFacultadDecano();

        let docentesData = null;
        let facultadEncontrada = null;

        // Consultar la facultad del decano logueado
        try {
          /* console.log(
            `🎯 CONSULTANDO FACULTAD DEL DECANO: ID ${facultadDelDecano.IDFacultad} - ${facultadDelDecano.Facultad}`
          ); */

          // Nuevo endpoint: POST a /gestionarCuadro/dataGestionCuadroNota con { ciclo, IDFacultad }
          const GESTION_CUADRO_URL =
            process.env.NEXT_PUBLIC_GESTION_CUADRO_NOTA;
          const docentesResponse = await fetch(
            `${GESTION_CUADRO_URL}/dataGestionCuadroNota`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ciclo: cicloActual,
                IDFacultad: facultadDelDecano.IDFacultad,
              }),
            }
          );

          // console.log("ENDPOINT PENDIENTE (nuevo): ", docentesResponse);

          if (docentesResponse.ok) {
            const responseData = await docentesResponse.json();
            /* console.log(
              `📝 Datos recibidos desde dataGestionCuadroNota:`,
              responseData
            ); */

            // La nueva API devuelve { ok, message, data: [...] }
            if (responseData && Array.isArray(responseData.data)) {
              // Mapear a la estructura esperada por el resto del componente
              // Calcular totales: total de registros (filas) y total de docentes únicos
              const filas = responseData.data || [];
              const uniqueDocentes = new Set();
              filas.forEach((it) => {
                const id =
                  it.IDDocente ||
                  it.ID ||
                  it.IDGrupo ||
                  it.Docente ||
                  it.Nombre;
                if (id !== undefined && id !== null)
                  uniqueDocentes.add(String(id));
              });
              const totalDocentesCount =
                typeof responseData.totalDocentes === "number"
                  ? responseData.totalDocentes
                  : uniqueDocentes.size;
              const totalRegistrosCount =
                typeof responseData.totalRegistros === "number"
                  ? responseData.totalRegistros
                  : filas.length;

              docentesData = {
                IDFacultad: facultadDelDecano.IDFacultad,
                ciclo: cicloActual,
                message: responseData.message || "Datos obtenidos",
                docentes: filas,
                Facultad: facultadDelDecano.Facultad,
                totalDocentes: totalDocentesCount,
                totalRegistros: totalRegistrosCount,
              };
              facultadEncontrada = facultadDelDecano;
              // console.log(`✅ Datos convertidos y listos: registros=${totalRegistrosCount}, docentes=${totalDocentesCount}`);
            } else {
              console.error(
                "Respuesta inesperada de dataGestionCuadroNota:",
                responseData
              );
              throw new Error(
                "Estructura de respuesta inválida de dataGestionCuadroNota"
              );
            }
          } else {
            const errorText = await docentesResponse
              .text()
              .catch(() => "No se pudo leer el error");
            console.error(
              `❌ Error al obtener datos desde dataGestionCuadroNota: ${docentesResponse.status}`,
              {
                status: docentesResponse.status,
                statusText: docentesResponse.statusText,
                errorBody: errorText,
              }
            );
            throw new Error(
              `Error ${docentesResponse.status} al obtener datos desde dataGestionCuadroNota`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error al procesar Facultad ${facultadDelDecano.Facultad}:`,
            error
          );
          throw error;
        }

        // Validación final
        if (!docentesData || !facultadEncontrada) {
          console.error(
            `❌ No se pudieron cargar los datos de la Facultad ${facultadDelDecano.Facultad}`
          );
          throw new Error(
            `No se pudo cargar la información de docentes de ${facultadDelDecano.Facultad}`
          );
        }

        // Log final para confirmar qué facultad se está usando
        /* console.log(
          `🎯 FACULTAD FINAL: ID ${docentesData.IDFacultad} - ${facultadEncontrada.Facultad}`,
          {
            usuario: user?.email || user?.Usuario,
            ciclo: docentesData.ciclo,
            totalDocentes:
              typeof docentesData.totalDocentes === "number"
                ? docentesData.totalDocentes
                : docentesData.docentes
                ? docentesData.docentes.length
                : 0,
            totalRegistros:
              typeof docentesData.totalRegistros === "number"
                ? docentesData.totalRegistros
                : docentesData.docentes
                ? docentesData.docentes.length
                : 0,
            mensaje: docentesData.message,
          }
        ); */

        // Resumen para el usuario
        /* console.log(`📋 RESUMEN FINAL:`, {
          decano: user?.email || user?.Usuario,
          facultadAsignada: `${facultadEncontrada.Facultad} (ID: ${docentesData.IDFacultad})`,
          docentesEncontrados:
            typeof docentesData.totalDocentes === "number"
              ? docentesData.totalDocentes
              : docentesData.docentes
              ? docentesData.docentes.length
              : 0,
          cicloConsultado: docentesData.ciclo || cicloActual,
        }); */

        setFacultadData(docentesData);

        // Sincronizar permisos reales desde la base de datos
        const docentesConPermisosReales = await sincronizarPermisosReales(
          docentesData.docentes || []
        );

        setTodosLosDocentes(docentesConPermisosReales); // Almacenar todos los docentes con permisos reales
        setDocentes(docentesConPermisosReales);

        // Actualizar contador inicial
        actualizarContadorCuadros(docentesConPermisosReales);

        // Mostrar mensaje informativo si no hay docentes
        if (!docentesData.docentes || docentesData.docentes.length === 0) {
          const cicloInfo =
            docentesData.ciclo || cicloActual || "no especificado";
          setErrorMessage(
            `No hay docentes registrados para ${
              facultadEncontrada.Facultad
            } en el ciclo ${cicloInfo}. ${
              docentesData.message ||
              "Verifique con el administrador del sistema."
            }`
          );
        } else {
          setErrorMessage("");
        }
      } catch (error) {
        console.error("Error al cargar docentes de la facultad:", error);
        setErrorMessage("Error al cargar los docentes de la facultad");
      } finally {
        setIsSearching(false);
      }
    };

    cargarDocentesFacultad();
  }, [user, isDecano, loading, cicloActual, loadingCiclo]); // Agregamos dependencias del ciclo

  // Estado para almacenar todos los docentes de la facultad (sin filtrar)
  const [todosLosDocentes, setTodosLosDocentes] = useState([]);

  // Estado para trackear cambios realizados en cuadros de notas por grupo específico
  const [cambiosRealizados, setCambiosRealizados] = useState(new Map());

  // Estado para contador de cuadros habilitados
  const [contadorCuadros, setContadorCuadros] = useState({
    habilitados: 0,
    deshabilitados: 0,
    total: 0,
  });

  // Función para actualizar contador de cuadros
  const actualizarContadorCuadros = (docentes) => {
    if (!docentes || docentes.length === 0) {
      setContadorCuadros({ habilitados: 0, deshabilitados: 0, total: 0 });
      return;
    }

    const habilitados = docentes.filter(
      (d) => d.cuadrosNotasHabilitados === true
    ).length;
    const total = docentes.length;
    const deshabilitados = total - habilitados;

    setContadorCuadros({
      habilitados,
      deshabilitados,
      total,
    });

    // console.log(`📊 Contador actualizado: ${habilitados}/${total} cuadros habilitados`);
  };

  // ✨ Efecto para sincronizar permisos cuando el usuario regrese a la página
  useEffect(() => {
    const sincronizarAlRegresar = async () => {
      // Solo sincronizar si ya tenemos docentes cargados
      if (
        todosLosDocentes &&
        todosLosDocentes.length > 0 &&
        !loading &&
        !loadingCiclo
      ) {
        // console.log("🔄 Usuario regresó a la página, sincronizando permisos...");
        try {
          const docentesSincronizados = await sincronizarPermisosReales(
            todosLosDocentes
          );
          setTodosLosDocentes(docentesSincronizados);
          setDocentes(docentesSincronizados);
          // console.log("✅ Permisos sincronizados al regresar a la página");
        } catch (error) {
          console.error("❌ Error sincronizando permisos al regresar:", error);
        }
      }
    };

    // Ejecutar sincronización después de un pequeño delay para asegurar que todo esté cargado
    const timer = setTimeout(sincronizarAlRegresar, 1000);

    return () => clearTimeout(timer);
  }, []); // Sin dependencias para que se ejecute solo al montar el componente

  // Efecto para filtrado local cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los docentes
      setDocentes(todosLosDocentes);
      setFilteredResults(todosLosDocentes);
      setErrorMessage(""); // Limpiar mensaje de error cuando se limpia la búsqueda

      // Actualizar contador con todos los docentes
      actualizarContadorCuadros(todosLosDocentes);

      // NO modificar facultadData aquí para evitar loop infinito
      // La información se actualizará cuando se carguen los datos iniciales
    } else {
      // Filtrar localmente los docentes ya cargados (soporta nuevo formato)
      const term = searchTerm.trim().toLowerCase();
      const docentesFiltrados = todosLosDocentes.filter((docente) => {
        // Normalizar campos posibles
        const nombre = (
          docente.Docente ||
          docente.NombreCompleto ||
          docente.Nombre ||
          ""
        )
          .toString()
          .toLowerCase();
        const idStr = (docente.IDDocente || docente.IDGrupo || docente.ID || "")
          .toString()
          .toLowerCase();

        return nombre.includes(term) || idStr.includes(term);
      });

      // Aplicar cambios realizados a los docentes filtrados (solo si hay cambios pendientes)
      const docentesConCambios = docentesFiltrados.map((docente) => {
        const grupoKey = docente.IDGrupo
          ? `${docente.IDDocente}-${docente.IDGrupo}-${
              docente.Nombre || "sin-materia"
            }`
          : `${docente.IDDocente}-general`;

        // Solo aplicar cambios del Map si realmente hay cambios pendientes
        // Los datos en todosLosDocentes ya deberían reflejar el estado real de la BD
        if (cambiosRealizados.has(grupoKey)) {
          return {
            ...docente,
            cuadrosNotasHabilitados: cambiosRealizados.get(grupoKey),
          };
        }
        return docente; // Usar datos reales de la BD
      });

      setDocentes(docentesConCambios);
      setFilteredResults(docentesConCambios);

      // Actualizar contador con los docentes filtrados
      actualizarContadorCuadros(docentesConCambios);

      // Mostrar mensaje si no se encontraron resultados
      if (docentesFiltrados.length === 0 && todosLosDocentes.length > 0) {
        setErrorMessage(`No se encontraron resultados para "${searchTerm}".`);
      } else {
        setErrorMessage("");
      }
    }
  }, [searchTerm, todosLosDocentes]); // Remover facultadData para evitar loop infinito

  // Búsqueda automática gestionada por el useEffect que observa `searchTerm` y `todosLosDocentes`.

  // Función para limpiar cache de cambios realizados
  const limpiarCacheCompleto = () => {
    setCambiosRealizados(new Map());
    // console.log("🧹 Cache de cambios completamente limpiado");
  };

  // Función para sincronizar permisos reales desde la base de datos
  const sincronizarPermisosReales = async (docentes) => {
    if (!docentes || docentes.length === 0) return docentes;

    // console.log("🔄 Sincronizando permisos reales desde la base de datos...");
    // console.log(`📊 Total de docentes a sincronizar: ${docentes.length}`);

    try {
      // Crear una lista de promesas para consultar el estado de cada grupo
      const promesasPermisos = docentes.map(async (docente, index) => {
        try {
          const grupoKey = docente.IDGrupo
            ? `${docente.IDDocente}-${docente.IDGrupo}-${
                docente.Nombre || "sin-materia"
              }`
            : `${docente.IDDocente}-general`;

          /* console.log(
            `🔍 [${index + 1}/${
              docentes.length
            }] Consultando estado para ${grupoKey}`
          ); */

          // Consultar el estado real desde el backend usando el endpoint correcto
          const CONFIGURACION_DOCENTE_URL =
            process.env.NEXT_PUBLIC_CONFIGURACION_DOCENTE;
          const url = `${CONFIGURACION_DOCENTE_URL}/${
            docente.IDDocente
          }/permisos-grupo/${docente.IDGrupo || "general"}`;

          // console.log(`📡 URL de consulta: ${url}`);

          const response = await fetch(url, {
            credentials: "include",
          });

          /* console.log(
            `📊 Respuesta para ${grupoKey}: status=${response.status}, ok=${response.ok}`
          ); */

          if (response.ok) {
            const data = await response.json();
            const estadoReal = data.habilitada || false;
            // console.log(`✅ Estado real para ${grupoKey}: ${estadoReal}`);

            return {
              ...docente,
              cuadrosNotasHabilitados: estadoReal,
            };
          } else {
            // Si el endpoint devuelve error, asumimos que está deshabilitado
            console.warn(
              `⚠️ Error ${response.status} para ${grupoKey}, asumiendo estado: false`
            );
            return {
              ...docente,
              cuadrosNotasHabilitados: false,
            };
          }
        } catch (error) {
          console.error(
            `❌ Error consultando estado para docente ${docente.IDDocente}:`,
            error
          );
          // En caso de error, asumimos que está deshabilitado
          return {
            ...docente,
            cuadrosNotasHabilitados: false,
          };
        }
      });

      // Esperar a que todas las consultas terminen
      const docentesConEstadoReal = await Promise.all(promesasPermisos);

      // Contar cuántos están habilitados vs deshabilitados
      const habilitados = docentesConEstadoReal.filter(
        (d) => d.cuadrosNotasHabilitados
      ).length;
      const deshabilitados = docentesConEstadoReal.length - habilitados;

      // console.log(`✅ Sincronización completada: ${habilitados} habilitados, ${deshabilitados} deshabilitados`);

      // Limpiar cache después de sincronización exitosa
      limpiarCacheCompleto();

      // Actualizar contador de cuadros
      actualizarContadorCuadros(docentesConEstadoReal);

      return docentesConEstadoReal;
    } catch (error) {
      console.error("❌ Error en sincronización de permisos:", error);
      return docentes; // Devolver los docentes originales en caso de error
    }
  };

  // Función para manejar habilitación individual por docente y grupo específico
  const toggleDocentePermission = (
    idDocente,
    tipoPermiso,
    estadoActual,
    idGrupo = null,
    nombreMateria = null
  ) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "HABILITAR" : "DESHABILITAR";
    const estadoTexto = nuevoEstado ? "🟢 HABILITADO" : "🔴 DESHABILITADO";
    const grupoTexto = idGrupo ? `grupo ${idGrupo}` : "docente";

    showConfirmation(
      "Cambiar estado de cuadros de notas",
      `📋 ¿Está seguro de ${accion} los cuadros de notas para el ${grupoTexto}?\n\n${
        nombreMateria ? `📚 Materia: ${nombreMateria}\n` : ""
      }👨‍🏫 Docente ID: ${idDocente}\n${
        idGrupo ? `🎯 Grupo: ${idGrupo}\n` : ""
      }\nEstado actual: ${
        estadoActual ? "🟢 HABILITADO" : "🔴 DESHABILITADO"
      }\nNuevo estado: ${estadoTexto}\n\n⚠️ Esta acción afectará la capacidad de edición de notas para este ${grupoTexto} específico.`,
      () =>
        ejecutarCambioPermisoCuadros(
          idDocente,
          tipoPermiso,
          estadoActual,
          idGrupo,
          nombreMateria
        ),
      "warning",
      `${accion} cuadros`,
      "Cancelar"
    );
  };

  // Función auxiliar para ejecutar el cambio de permisos de cuadros
  const ejecutarCambioPermisoCuadros = async (
    idDocente,
    tipoPermiso,
    estadoActual,
    idGrupo = null,
    nombreMateria = null
  ) => {
    try {
      // Generar clave única para el grupo específico (misma lógica que en useEffect)
      const grupoKey = idGrupo
        ? `${idDocente}-${idGrupo}-${nombreMateria || "sin-materia"}`
        : `${idDocente}-general`;

      /* console.log(`🎯 toggleDocentePermission llamado con:`, {
        idDocente,
        tipoPermiso,
        estadoActual,
        idGrupo,
        nombreMateria,
        grupoKey,
      }); */

      /* console.log(
        `🔄 Enviando POST a: ${process.env.NEXT_PUBLIC_CONFIGURACION_DOCENTE}/${idDocente}/cuadrosNotasHabilitados`
      );
      console.log(`� Body:`, { habilitada: !estadoActual }); */

      const CONFIGURACION_DOCENTE_URL =
        process.env.NEXT_PUBLIC_CONFIGURACION_DOCENTE;
      const response = await fetch(
        `${CONFIGURACION_DOCENTE_URL}/${idDocente}/cuadrosNotasHabilitados`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            habilitada: !estadoActual,
            idGrupo: idGrupo,
            nombreMateria: nombreMateria,
          }),
        }
      );

      // console.log(`📡 Respuesta del servidor:`, response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error(`❌ Error del servidor:`, data);
        alert(data.message || "No autorizado para cambiar esta configuración.");
        return;
      }

      const responseData = await response.json();
      // console.log(`✅ Respuesta exitosa:`, responseData);

      // 🔍 Verificar que el cambio se guardó correctamente consultando el estado real
      // console.log("🔍 Verificando que el cambio se guardó correctamente...");
      try {
        const CONFIGURACION_DOCENTE_URL =
          process.env.NEXT_PUBLIC_CONFIGURACION_DOCENTE;
        const verificacionUrl = `${CONFIGURACION_DOCENTE_URL}/${idDocente}/permisos-grupo/${
          idGrupo || "general"
        }`;
        const verificacionResponse = await fetch(verificacionUrl, {
          credentials: "include",
        });

        if (verificacionResponse.ok) {
          const verificacionData = await verificacionResponse.json();
          const estadoGuardado = verificacionData.habilitada || false;
          const estadoEsperado = !estadoActual;

          // console.log(`🔍 Estado esperado: ${estadoEsperado}, Estado guardado: ${estadoGuardado}`);

          if (estadoGuardado !== estadoEsperado) {
            console.warn(
              `⚠️ ADVERTENCIA: El estado guardado (${estadoGuardado}) no coincide con el esperado (${estadoEsperado})`
            );
          } else {
            // console.log("✅ Cambio verificado correctamente en la base de datos");
          }
        }
      } catch (verificacionError) {
        console.warn("⚠️ No se pudo verificar el cambio:", verificacionError);
      }

      // Actualizar el estado de cambios realizados
      setCambiosRealizados((prev) => {
        const newMap = new Map(prev);
        newMap.set(grupoKey, !estadoActual);
        return newMap;
      });

      // Actualizar el estado local de docentes
      const updateDocente = (docente) => {
        if (idGrupo && nombreMateria) {
          // Para casos con grupo específico, solo actualizar si coincide exactamente
          const matches =
            docente.IDGrupo === idGrupo &&
            docente.Nombre === nombreMateria &&
            docente.IDDocente === idDocente;
          /* console.log(`🔍 Comparando docente:`, {
            docenteID: docente.IDDocente,
            docenteGrupo: docente.IDGrupo,
            docenteNombre: docente.Nombre,
            targetID: idDocente,
            targetGrupo: idGrupo,
            targetNombre: nombreMateria,
            matches,
          }); */
          if (matches) {
            /* console.log(
              `✅ Actualizando docente específico:`,
              docente.IDDocente,
              docente.IDGrupo,
              docente.Nombre
            ); */
            return { ...docente, [tipoPermiso]: !estadoActual };
          }
        } else {
          // Para casos generales, actualizar por IDDocente solamente si no hay idGrupo específico
          if (
            docente.IDDocente === idDocente &&
            !docente.IDGrupo &&
            !docente.Nombre
          ) {
            // console.log(`✅ Actualizando docente general:`, docente.IDDocente);
            return { ...docente, [tipoPermiso]: !estadoActual };
          }
        }
        return docente;
      };

      setDocentes((prev) => prev.map(updateDocente));
      setTodosLosDocentes((prev) => prev.map(updateDocente));

      // Actualizar contador después del cambio local
      const docentesActualizados = todosLosDocentes.map(updateDocente);
      actualizarContadorCuadros(docentesActualizados);

      /* console.log(
        `🔄 Estado local actualizado para docente ${idDocente}, grupo: ${idGrupo}, materia: ${nombreMateria}`
      ); */

      // Limpiar el cache del cambio después de un tiempo
      setTimeout(() => {
        setCambiosRealizados((prev) => {
          const nuevo = new Map(prev);
          nuevo.delete(grupoKey);
          // console.log(`🧹 Cache limpiado para ${grupoKey}`);
          return nuevo;
        });
      }, 5000); // Limpiar después de 5 segundos

      // Mostrar notificación de éxito
      const grupoTexto = idGrupo ? `grupo ${idGrupo}` : "docente";
      const estadoFinal = !estadoActual ? "🟢 HABILITADO" : "🔴 DESHABILITADO";

      showNotification(
        "Configuración actualizada",
        `✅ Los cuadros de notas han sido ${
          !estadoActual ? "HABILITADOS" : "DESHABILITADOS"
        } exitosamente para el ${grupoTexto}.\n\n${
          nombreMateria ? `📚 Materia: ${nombreMateria}\n` : ""
        }👨‍🏫 Docente ID: ${idDocente}\n${
          idGrupo ? `🎯 Grupo: ${idGrupo}\n` : ""
        }Estado: ${estadoFinal}`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      const grupoTexto = idGrupo ? `grupo ${idGrupo}` : "docente";
      showNotification(
        "Error de conexión",
        `❌ No se pudo actualizar la configuración de cuadros de notas para el ${grupoTexto}.\n\nVerifique su conexión a internet e intente nuevamente.\n\nDetalle del error: ${error.message}`,
        "error"
      );
    }
  };

  // Función para cambiar el modo de un grupo específico
  const cambiarModoGrupo = (idGrupo, modoActual, nombreMateria = null) => {
    if (!cicloActual) {
      showNotification(
        "Error de configuración",
        "No se pudo obtener el ciclo actual. Intente nuevamente.",
        "error"
      );
      return;
    }

    const nuevoModo = modoActual === "REPOSICION" ? "NORMAL" : "REPOSICION";
    const modoColor = nuevoModo === "REPOSICION" ? "🟡" : "🔵";

    showConfirmation(
      "Cambiar modo del grupo",
      `${modoColor} ¿Está seguro de cambiar el modo a ${nuevoModo} para el grupo ${idGrupo}?${
        nombreMateria ? `\n\n📚 Materia: ${nombreMateria}` : ""
      }\n\n⚠️ Esta acción afectará las opciones de edición disponibles para este grupo.`,
      () => ejecutarCambioModo(idGrupo, nuevoModo),
      "warning",
      `Cambiar a ${nuevoModo}`,
      "Cancelar"
    );
  };

  // Función auxiliar para ejecutar el cambio de modo
  const ejecutarCambioModo = async (idGrupo, nuevoModo) => {
    try {
      // console.log(`🎯 Cambiando modo del grupo ${idGrupo} a ${nuevoModo}`);

      const GESTION_CUADRO_URL = process.env.NEXT_PUBLIC_GESTION_CUADRO_NOTA;
      const response = await fetch(
        `${GESTION_CUADRO_URL}/updateGestionCuadroNota`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            IDGrupo: idGrupo,
            Ciclo: cicloActual,
            Modo: nuevoModo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const responseData = await response.json();
      // console.log(`✅ Grupo ${idGrupo} actualizado:`, responseData);

      // Actualizar el estado local
      const updateDocente = (docente) => {
        if (docente.IDGrupo === idGrupo) {
          return {
            ...docente,
            Modo: nuevoModo,
          };
        }
        return docente;
      };

      setDocentes((prev) => prev.map(updateDocente));
      setTodosLosDocentes((prev) => prev.map(updateDocente));

      // console.log(`🔄 Estado local actualizado para grupo ${idGrupo}, nuevo modo: ${nuevoModo}`);

      // Mostrar notificación de éxito
      showNotification(
        "Cambio realizado exitosamente",
        `✅ El grupo ${idGrupo} ha sido configurado en modo ${nuevoModo}.`,
        "success"
      );
    } catch (error) {
      console.error(`❌ Error cambiando modo del grupo ${idGrupo}:`, error);
      showNotification(
        "Error al cambiar el modo",
        `❌ No se pudo cambiar el modo del grupo ${idGrupo}. Por favor, intente nuevamente.\n\nDetalle del error: ${error.message}`,
        "error"
      );
    }
  };

  // NOTE: Ya no hacemos early-return cuando `loading` es true.
  // El spinner se mostrará debajo del panel de control para que este no desaparezca.

  // Componente skeleton moderno para la carga de docentes
  const DocentesSkeleton = () => {
    const tableRows = Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="w-full h-12 rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 mb-3"
      />
    ));

    const cardRows = Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="p-4 bg-white rounded-lg shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
        </div>
      </div>
    ));

    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-1/3 mx-auto" />

          {/* Desktop table-like skeleton */}
          <div className="hidden lg:block bg-white rounded-xl shadow border border-slate-200 p-4">
            <div className="h-8 bg-slate-100 rounded mb-4 w-1/4" />
            <div className="space-y-2">{tableRows}</div>
          </div>

          {/* Mobile card skeletons */}
          <div className="lg:hidden space-y-4">{cardRows}</div>
        </div>
      </div>
    );
  };

  // DEBUG: Mostrar información del usuario en consola (solo para desarrollo)
  // console.log("DEBUG: Estado del usuario completo:", {
  //   user,
  //   loading,
  //   isDecano,
  //   isDocente,
  //   roles,
  //   puedeHabilitarEvaluacion,
  // });

  const handleToggleNotes = () => {
    const nuevoEstado = !enableNotes;
    const accion = nuevoEstado ? "ABRIR" : "CERRAR";
    const estado = nuevoEstado ? "🟢 ABIERTO" : "🔴 CERRADO";

    showConfirmation(
      "Cambiar estado de cuadros de notas",
      `📋 ¿Está seguro de ${accion} los cuadros de notas?\n\nEstado actual: ${
        enableNotes ? "🟢 ABIERTO" : "🔴 CERRADO"
      }\nNuevo estado: ${estado}\n\n⚠️ Esta acción afectará a todos los docentes de la facultad.`,
      () => ejecutarCambioNotasGlobal(nuevoEstado),
      "warning",
      `${accion} cuadros`,
      "Cancelar"
    );
  };

  const ejecutarCambioNotasGlobal = async (nuevoEstado) => {
    try {
      const NOTAS_CONFIG_URL = process.env.NEXT_PUBLIC_NOTAS;
      const response = await fetch(NOTAS_CONFIG_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habilitada: nuevoEstado }),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification(
          "Error de autorización",
          `❌ ${
            data.message || "No autorizado para cambiar esta configuración."
          }\n\nContacte al administrador del sistema si considera que esto es un error.`,
          "error"
        );
        return;
      }

      // Actualizar el estado local tras el POST exitoso
      setEnableNotes(nuevoEstado);

      // Mostrar notificación de éxito
      showNotification(
        "Configuración actualizada",
        `✅ Los cuadros de notas han sido ${
          nuevoEstado ? "ABIERTOS" : "CERRADOS"
        } exitosamente.\n\n${
          nuevoEstado
            ? "🟢 Los docentes pueden editar las notas."
            : "🔴 Los cuadros están cerrados para edición."
        }`,
        "success"
      );
    } catch (error) {
      showNotification(
        "Error de conexión",
        `❌ No se pudo actualizar la configuración de cuadros de notas.\n\nVerifique su conexión a internet e intente nuevamente.\n\nDetalle del error: ${error.message}`,
        "error"
      );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
        {/* Panel Horizontal de Configuración */}
        <div className="sticky top-16 sm:top-20 z-10 bg-white rounded-xl shadow-lg border border-slate-200 mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
              Gestión Global de Cuadros
            </h1>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Opciones de configuración: título + botón desplegable */}
              <div className="flex items-center gap-4">
                <div className="text-sm sm:text-base font-semibold text-slate-800">
                  Docentes de la Facultad
                </div>
                <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                  Ciclo: {facultadData?.ciclo || cicloActual || "Cargando..."}
                </div>
                <div className="relative" ref={accionesRef}>
                  <button
                    onClick={() => setAccionesOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200"
                    aria-haspopup="true"
                    aria-expanded={accionesOpen}
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Acciones
                    </span>
                    <svg
                      className="w-3 h-3 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {accionesOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-40">
                      <ul className="divide-y divide-slate-100">
                        <li>
                          <button
                            onClick={handleToggleNotes}
                            disabled={!puedeHabilitarEvaluacion}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <span className="text-sm font-medium text-green-600">
                              Publicar y Cerrar Cuadros
                            </span>
                            <span className="ml-auto text-xs text-gray-500">
                              {enableNotes ? "ABIERTO" : "CERRADO"}
                            </span>
                          </button>
                        </li>
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              showNotification(
                                "Cambio de modo individual",
                                "💡 Ahora puede cambiar el modo individualmente haciendo click en la columna MODO de cada grupo en la tabla.\n\n🎯 Busque la columna 'MODO' y haga click en el estado actual para alternar entre NORMAL y REPOSICIÓN.\n\n✨ Esto le da control granular sobre cada grupo específico.",
                                "info",
                                "Entendido"
                              );
                            }}
                            disabled={!puedeHabilitarEvaluacion}
                          >
                            <span className="text-sm font-medium text-amber-600">
                              Habilitar solo Edición de Reposición
                            </span>
                            <span className="ml-auto text-xs text-gray-500">
                              Ver tabla
                            </span>
                          </button>
                        </li>
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3"
                            onClick={() => {
                              /* UI-only: placeholder ver estudiantes */
                            }}
                          >
                            <span className="text-sm font-medium text-slate-700">
                              Ver Estudiantes Inscritos
                            </span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Input de búsqueda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar docente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full lg:w-72"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        // No limpiar los docentes aquí, el useEffect se encargará de recargarlos
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Botón de búsqueda (solo escritorio) */}
                {/* botón Buscar eliminado: la búsqueda es automática */}
              </div>
            </div>

            {/* Resumen compacto de la facultad en el panel superior (UI-only) */}
            {facultadData && (
              <div className="mt-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-blue-800 truncate">
                      {facultadData.Facultad}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
                      Total Docentes: {displayTotalDocentes}
                    </span>

                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                      Total Registros: {displayTotalRegistros}
                    </span>

                    {/* Contador de Cuadros Habilitados */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        ✅ Habilitados: {contadorCuadros.habilitados}
                      </span>
                      <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                        ❌ Deshabilitados: {contadorCuadros.deshabilitados}
                      </span>
                    </div>

                    {/* Search filter badge removed (UI-only) */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Área de resultados */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Resultados de la Gestión
              </h2>

              {/* Contador de modo en reposición - Responsive */}
              {isDecano &&
                docentes.length > 0 &&
                (() => {
                  const contadores = calcularContadoresModo();
                  return (
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-4">
                      <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                        <span className="text-xs sm:text-sm text-slate-600">
                          Total:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          {contadores.total}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 bg-amber-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-200">
                        <span className="text-xs sm:text-sm text-amber-700">
                          <span className="hidden sm:inline">
                            🟡 Reposición:
                          </span>
                          <span className="sm:hidden">🟡:</span>
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-amber-800">
                          {contadores.reposicion}
                        </span>
                        <span className="text-xs text-amber-600">
                          ({contadores.porcentajeReposicion.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-blue-200">
                        <span className="text-xs sm:text-sm text-blue-700">
                          <span className="hidden sm:inline">🔵 Normal:</span>
                          <span className="sm:hidden">🔵:</span>
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-blue-800">
                          {contadores.normal}
                        </span>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Mensaje de error del ciclo */}
            {errorCiclo && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
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
                  </div>
                  <button
                    onClick={obtenerCicloActual}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {errorMessage && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm sm:text-base">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Nota: Mensaje de acceso restringido eliminado; se mostrará el spinner en su lugar para usuarios sin rol de Decano. */}

            {/* Contenido - mostrar resultados dinámicos (solo para decanos) */}
            {isDecano && isSearching ? (
              // Mostrar skeleton moderno mientras se cargan los docentes
              <DocentesSkeleton />
            ) : isDecano && docentes.length > 0 ? (
              <>
                {/* Vista de tabla responsiva sin scroll horizontal */}
                <div className="hidden md:block overflow-hidden rounded-lg shadow-lg border border-gray-200">
                  <table className="w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 ">
                      <tr>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[6%] bg-blue-700 border-r border-blue-500 rounded-tl-lg">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">ID</span>
                            <span className="lg:hidden">#</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[20%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">MATERIA</span>
                            <span className="lg:hidden">MAT</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[6%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">GRUPO</span>
                            <span className="lg:hidden">GRP</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[30%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">DOCENTE</span>
                            <span className="lg:hidden">DOC</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[8%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">AULA</span>
                            <span className="lg:hidden">AU</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[13%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">ESTADO</span>
                            <span className="lg:hidden">EST</span>
                          </div>
                        </th>
                        <th className="hidden lg:table-cell text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[9%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span>CAPACIDAD</span>
                          </div>
                        </th>
                        <th className="hidden lg:table-cell text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[7%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span>CICLO</span>
                          </div>
                        </th>
                        <th className="hidden xl:table-cell text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[7%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span>PERIODO</span>
                          </div>
                        </th>
                        <th className="hidden xl:table-cell text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[10%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span>JORNADA</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[13%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span>MODO</span>
                          </div>
                        </th>
                        <th className="hidden lg:table-cell text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[8%] bg-blue-700 border-r border-blue-500">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden xl:inline">INSCRITOS</span>
                            <span className="xl:hidden">INS</span>
                          </div>
                        </th>
                        <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-white text-xs w-[18%] bg-blue-700 rounded-tr-lg">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="hidden lg:inline">
                              CUADROS DE NOTAS
                            </span>
                            <span className="lg:hidden">CUADROS</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {docentes.map((docente) => {
                        // Nuevo formato: cada elemento ya representa una fila (IDGrupo)
                        if (docente && (docente.IDGrupo || docente.Nombre)) {
                          // Render single row using the new API fields
                          return (
                            <tr
                              key={
                                docente.IDGrupo ||
                                `${docente.IDDocente}-${docente.Grupo}`
                              }
                              className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100"
                            >
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs font-semibold text-gray-900 bg-white border-r border-gray-200">
                                <div className="flex items-center space-x-1 md:space-x-2">
                                  <span className="text-xs">
                                    {docente.IDGrupo ??
                                      docente.IDDocente ??
                                      "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs font-medium text-gray-800 bg-white border-r border-gray-200">
                                <div className="truncate">
                                  {docente.Nombre || "-"}
                                </div>
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Grupo || "-"}
                              </td>
                              <td
                                className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs font-medium text-gray-800 bg-white border-r border-gray-200"
                                title={
                                  docente.Docente ||
                                  docente.NombreCompleto ||
                                  "-"
                                }
                              >
                                <div className="break-words leading-relaxed truncate">
                                  {docente.Docente ||
                                    docente.NombreCompleto ||
                                    "-"}
                                </div>
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Aula || "-"}
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs bg-white border-r border-gray-200">
                                <span
                                  className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    docente.Estado &&
                                    docente.Estado.toLowerCase().includes(
                                      "autor"
                                    )
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  <span className="hidden lg:inline">
                                    {docente.Estado || "-"}
                                  </span>
                                  <span className="lg:hidden">
                                    {docente.Estado
                                      ? docente.Estado.toLowerCase().includes(
                                          "autor"
                                        )
                                        ? "✓"
                                        : "✗"
                                      : "-"}
                                  </span>
                                </span>
                              </td>
                              <td className="hidden lg:table-cell py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Capacidad ?? "-"}
                              </td>
                              <td className="hidden lg:table-cell py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Ciclo ||
                                  facultadData?.ciclo ||
                                  cicloActual ||
                                  "-"}
                              </td>
                              <td className="hidden xl:table-cell py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Periodo ?? "-"}
                              </td>
                              <td className="hidden xl:table-cell py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                {docente.Jornada || "-"}
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs bg-white border-r border-gray-200">
                                <button
                                  onClick={() =>
                                    cambiarModoGrupo(
                                      docente.IDGrupo,
                                      docente.Modo || "NORMAL",
                                      docente.Nombre
                                    )
                                  }
                                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:scale-105 transition-all duration-200 ${
                                    docente.Modo === "REPOSICION"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
                                  }`}
                                  disabled={!puedeHabilitarEvaluacion}
                                  title={`Click para cambiar a ${
                                    docente.Modo === "REPOSICION"
                                      ? "NORMAL"
                                      : "REPOSICION"
                                  }`}
                                >
                                  <span className="hidden sm:inline">
                                    {docente.Modo || "NORMAL"}
                                  </span>
                                  <span className="sm:hidden">
                                    {docente.Modo === "REPOSICION"
                                      ? "🟡"
                                      : "🔵"}
                                  </span>
                                </button>
                              </td>
                              <td className="hidden lg:table-cell py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs text-gray-600 bg-white border-r border-gray-200">
                                <span className="font-semibold text-indigo-700">
                                  {docente.Inscritos ?? "0"}
                                </span>
                              </td>
                              <td className="py-2 md:py-3 px-2 md:px-3 whitespace-nowrap text-xs bg-white">
                                <button
                                  onClick={() =>
                                    toggleDocentePermission(
                                      docente.IDDocente,
                                      "cuadrosNotasHabilitados",
                                      docente.cuadrosNotasHabilitados,
                                      docente.IDGrupo,
                                      docente.Nombre
                                    )
                                  }
                                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:scale-105 transition-all duration-200 ${
                                    docente.cuadrosNotasHabilitados
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-red-100 text-red-800 border border-red-300"
                                  }`}
                                >
                                  <span className="hidden lg:inline">
                                    {docente.cuadrosNotasHabilitados
                                      ? "✅ Habilitado"
                                      : "❌ Deshabilitado"}
                                  </span>
                                  <span className="lg:hidden">
                                    {docente.cuadrosNotasHabilitados
                                      ? "✅"
                                      : "❌"}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        // Fallback: conservar comportamiento anterior (docente con Materias/Grupos)
                        const rows = [];
                        const materias = docente.Materias || [];
                        const grupos = docente.Grupos || [];

                        if (materias.length === 0 && grupos.length === 0) {
                          rows.push(
                            <tr
                              key={`${docente.IDDocente}-0`}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="text-gray-800 py-3 px-3 text-xs font-medium">
                                {docente.IDDocente || "-"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                -
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                -
                              </td>
                              <td
                                className="text-gray-800 py-3 px-3 text-xs font-medium"
                                title={docente.NombreCompleto || "-"}
                              >
                                <div className="break-words leading-relaxed">
                                  {docente.NombreCompleto || "-"}
                                </div>
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                {docente.Aula || "-"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                <span
                                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                    docente.evaluacionHabilitada
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {docente.evaluacionHabilitada
                                    ? "Activo"
                                    : "Inactivo"}
                                </span>
                              </td>
                              <td className="text-white-500 py-3 px-3 text-xs">
                                {docente.Capacidad || "-"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                {facultadData?.ciclo ||
                                  cicloActual ||
                                  "Cargando..."}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                {docente.Periodo || "-"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                {docente.Jornada || "-"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                <button
                                  onClick={() =>
                                    cambiarModoGrupo(
                                      docente.IDGrupo || docente.IDDocente,
                                      docente.Modo || "NORMAL",
                                      docente.Nombre || docente.NombreCompleto
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                                    docente.Modo === "REPOSICION"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  }`}
                                  disabled={!puedeHabilitarEvaluacion}
                                  title={`Click para cambiar a ${
                                    docente.Modo === "REPOSICION"
                                      ? "NORMAL"
                                      : "REPOSICION"
                                  }`}
                                >
                                  {docente.Modo || "NORMAL"}
                                </button>
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                {docente.Inscritos || "0"}
                              </td>
                              <td className="text-gray-500 py-3 px-3 text-xs">
                                <button
                                  onClick={() =>
                                    toggleDocentePermission(
                                      docente.IDDocente,
                                      "cuadrosNotasHabilitados",
                                      docente.cuadrosNotasHabilitados,
                                      docente.IDGrupo || null,
                                      docente.Nombre || null
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                                    docente.cuadrosNotasHabilitados
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {docente.cuadrosNotasHabilitados
                                    ? "Habilitado"
                                    : "Deshabilitado"}
                                </button>
                              </td>
                            </tr>
                          );
                        } else {
                          materias.forEach((materia, materiaIndex) => {
                            grupos.forEach((grupo, grupoIndex) => {
                              rows.push(
                                <tr
                                  key={`${docente.IDDocente}-${materiaIndex}-${grupoIndex}`}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="text-gray-800 py-3 px-3 text-xs font-medium">
                                    {docente.IDDocente || "-"}
                                  </td>
                                  <td
                                    className="text-gray-500 py-3 px-3 text-xs"
                                    title={materia}
                                  >
                                    <div className="break-words leading-relaxed">
                                      {materia}
                                    </div>
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {grupo}
                                  </td>
                                  <td
                                    className="text-gray-800 py-3 px-3 text-xs font-medium"
                                    title={docente.NombreCompleto || "-"}
                                  >
                                    <div className="break-words leading-relaxed">
                                      {docente.NombreCompleto || "-"}
                                    </div>
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {docente.Aula || "-"}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    <span
                                      className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                        docente.evaluacionHabilitada
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {docente.evaluacionHabilitada
                                        ? "Activo"
                                        : "Inactivo"}
                                    </span>
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {docente.Capacidad || "-"}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {facultadData?.ciclo ||
                                      cicloActual ||
                                      "Cargando..."}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {docente.Periodo || "-"}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {docente.Jornada || "-"}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    <button
                                      onClick={() =>
                                        cambiarModoGrupo(
                                          docente.IDGrupo ||
                                            `${docente.IDDocente}-${materiaIndex}`,
                                          docente.Modo || "NORMAL",
                                          materia
                                        )
                                      }
                                      className={`px-2 py-1 rounded text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                                        docente.Modo === "REPOSICION"
                                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      }`}
                                      disabled={!puedeHabilitarEvaluacion}
                                      title={`Click para cambiar a ${
                                        docente.Modo === "REPOSICION"
                                          ? "NORMAL"
                                          : "REPOSICION"
                                      }`}
                                    >
                                      {docente.Modo || "NORMAL"}
                                    </button>
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    {docente.Inscritos || "0"}
                                  </td>
                                  <td className="text-gray-500 py-3 px-3 text-xs">
                                    <button
                                      onClick={() =>
                                        toggleDocentePermission(
                                          docente.IDDocente,
                                          "cuadrosNotasHabilitados",
                                          docente.cuadrosNotasHabilitados,
                                          grupo,
                                          materia
                                        )
                                      }
                                      className={`px-2 py-1 rounded text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                                        docente.cuadrosNotasHabilitados
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {docente.cuadrosNotasHabilitados
                                        ? "Habilitado"
                                        : "Deshabilitado"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          });
                        }

                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista de tarjetas responsive para móviles y tablets */}
                <div className="md:hidden space-y-3">
                  {docentes.map((docente) => {
                    // Renderizar para el nuevo formato (IDGrupo)
                    if (docente && (docente.IDGrupo || docente.Nombre)) {
                      return (
                        <div
                          key={
                            docente.IDGrupo ||
                            `${docente.IDDocente}-${docente.Grupo}`
                          }
                          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Header de la tarjeta */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {docente.IDGrupo?.toString().slice(-1) || "G"}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {docente.Nombre || "Sin materia"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Grupo {docente.Grupo || "-"} • ID:{" "}
                                  {docente.IDGrupo || "-"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Información del docente */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              DOCENTE:
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {docente.Docente || docente.NombreCompleto || "-"}
                            </p>
                          </div>

                          {/* Grid de información */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                AULA:
                              </p>
                              <p className="text-sm text-gray-900">
                                {docente.Aula || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                ESTADO:
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  docente.Estado &&
                                  docente.Estado.toLowerCase().includes("autor")
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {docente.Estado
                                  ? docente.Estado.toLowerCase().includes(
                                      "autor"
                                    )
                                    ? "✓ Activo"
                                    : "✗ Inactivo"
                                  : "-"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                INSCRITOS:
                              </p>
                              <p className="text-sm font-semibold text-indigo-700">
                                {docente.Inscritos ?? "0"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                CICLO:
                              </p>
                              <p className="text-sm text-gray-900">
                                {docente.Ciclo ||
                                  facultadData?.ciclo ||
                                  cicloActual ||
                                  "-"}
                              </p>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                cambiarModoGrupo(
                                  docente.IDGrupo,
                                  docente.Modo || "NORMAL",
                                  docente.Nombre
                                )
                              }
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                docente.Modo === "REPOSICION"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                              }`}
                              disabled={!puedeHabilitarEvaluacion}
                            >
                              {docente.Modo === "REPOSICION"
                                ? "🟡 Reposición"
                                : "🔵 Normal"}
                            </button>

                            <button
                              onClick={() =>
                                toggleDocentePermission(
                                  docente.IDDocente,
                                  "cuadrosNotasHabilitados",
                                  docente.cuadrosNotasHabilitados,
                                  docente.IDGrupo,
                                  docente.Nombre
                                )
                              }
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                docente.cuadrosNotasHabilitados
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }`}
                            >
                              {docente.cuadrosNotasHabilitados
                                ? "✅ Habilitado"
                                : "❌ Deshabilitado"}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Fallback para formato anterior
                    const maxItems = Math.max(
                      docente.Materias?.length || 0,
                      docente.Grupos?.length || 0,
                      1
                    );

                    return (
                      <div
                        key={docente.IDDocente}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        {/* Header con ID y Docente */}
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {docente.NombreCompleto || "-"}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              ID: {docente.IDDocente || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Grid de información */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              MATERIAS:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {docente.Materias?.map((materia, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {materia}
                                </span>
                              )) || (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              GRUPOS:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {docente.Grupos?.map((grupo, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {grupo}
                                </span>
                              )) || (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              AULA:
                            </p>
                            <p className="text-xs text-gray-800">
                              {docente.Aula || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              ESTADO:
                            </p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                docente.evaluacionHabilitada
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {docente.evaluacionHabilitada
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              CAPACIDAD:
                            </p>
                            <p className="text-xs text-gray-800">
                              {docente.Capacidad || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              CICLO:
                            </p>
                            <p className="text-xs text-gray-800">
                              {facultadData?.ciclo ||
                                cicloActual ||
                                "Cargando..."}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              PERIODO:
                            </p>
                            <p className="text-xs text-gray-800">
                              {docente.Periodo || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              JORNADA:
                            </p>
                            <p className="text-xs text-gray-800">
                              {docente.Jornada || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              MODO:
                            </p>
                            <button
                              onClick={() =>
                                cambiarModoGrupo(
                                  docente.IDGrupo || docente.IDDocente,
                                  docente.Modo || "NORMAL",
                                  docente.NombreCompleto
                                )
                              }
                              className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                docente.Modo === "REPOSICION"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              }`}
                              disabled={!puedeHabilitarEvaluacion}
                              title={`Click para cambiar a ${
                                docente.Modo === "REPOSICION"
                                  ? "NORMAL"
                                  : "REPOSICION"
                              }`}
                            >
                              {docente.Modo || "NORMAL"}
                            </button>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              INSCRITOS:
                            </p>
                            <p className="text-xs text-gray-800">
                              {docente.Inscritos || "0"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : isDecano && searchTerm && !isSearching ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {errorMessage ||
                    "No se encontraron docentes para la búsqueda realizada."}
                </p>
              </div>
            ) : isDecano ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {facultadData
                    ? "Sin Docentes Registrados"
                    : "Gestión de Cuadros de su Facultad"}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {facultadData
                    ? `No hay docentes registrados para ${facultadData.Facultad} en el ciclo actual. Contacte al administrador del sistema para verificar la información.`
                    : "Los docentes de su facultad se cargan automáticamente. Utilice la búsqueda para filtrar por nombre de docente específico."}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mensajes informativos para docentes (mantener funcionalidad original) */}
      </div>
      {/* Scroll to top floating button */}
      <ScrollToTop />

      {/* Modales profesionales */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
      />

      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={closeNotificationModal}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        actionText={notificationModal.actionText}
      />
    </Layout>
  );
}

// Componente para mostrar un botón flotante que aparece al hacer scroll
function ScrollToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="Ir arriba"
      className="fixed right-6 bottom-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-opacity"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}
