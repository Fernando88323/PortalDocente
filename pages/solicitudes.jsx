import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  FaPaperclip,
  FaPencilAlt,
  FaTrashAlt,
  FaPaperPlane,
  FaSearch,
  FaTimes,
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaEye,
} from "react-icons/fa";
import { GrAttachment } from "react-icons/gr";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { FiDelete } from "react-icons/fi";
import { useUser, UserProvider } from "../context/contextUser";
import { useCicloActual } from "../context/contextCicloActual";

// Spinner inline usando TailwindCSS
const Spinner = ({ size = "md" }) => {
  const dims = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  const borderWidth = size === "sm" ? "border-2" : "border-[3px]";
  return (
    <div
      className={`${dims} ${borderWidth} border-white border-t-transparent rounded-full animate-spin`}
    />
  );
};

export default function MainPage() {
  return (
    <UserProvider>
      <SolicitudesPage />
    </UserProvider>
  );
}
function SolicitudesPage() {
  const router = useRouter();

  const { user, loading } = useUser();
  const { cicloActual } = useCicloActual();

  // URLs constants
  const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS;
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER;
  const BOLETAS_RENTA_URL = process.env.NEXT_PUBLIC_SOLICITUDES_BOLETAS_RENTA;

  const roles = user?.sistemaasignacionroles || [];
  const isDocente = roles.some((r) => r.IDRol === 10);
  const isDecano = roles.some((r) => r.IDRol === 2);

  // Estados de datos
  const [activeTab, setActiveTab] = useState("inbox");
  const [boletas, setBoletas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  // Estados para filtro por ciclo
  const [cicloFiltro, setCicloFiltro] = useState(""); // Campo de texto para el ciclo
  const [cicloValido, setCicloValido] = useState(true); // Validación del formato del ciclo
  const [cicloInicializado, setCicloInicializado] = useState(false); // Control de inicialización

  // Fetch comprobantes de retención de renta desde el backend
  useEffect(() => {
    if (activeTab !== "boletas") return;
    setBoletas([]); // Limpia antes de cargar
    (async () => {
      try {
        const res = await fetch(BOLETAS_RENTA_URL, {
          credentials: "include",
        });
        if (res.status === 401) {
          await router.push("/");
          return;
        }
        if (!res.ok) {
          // intentar leer cuerpo de error para depuración
          let text = "";
          try {
            text = await res.text();
          } catch (e) {
            console.error("Error al leer respuesta de error:", e);
          }
          throw new Error(
            text || `Error al obtener boletas (HTTP ${res.status})`
          );
        }
        const data = await res.json();
        // El backend ahora devuelve { boletas, total, message }
        setBoletas(data.boletas || []);
        /* console.log("✅ Boletas cargadas:", {
          total: data.total,
          message: data.message,
          boletas: data.boletas,
        }); */
      } catch (err) {
        console.error("Error cargando boletas:", err);
        toast.error(
          err.message || "Error cargando comprobantes de retención de renta."
        );
      }
    })();
  }, [activeTab, router]);

  const verComprobanteBoleta = async (idBoleta) => {
    try {
      const response = await fetch(
        `${BOLETAS_RENTA_URL}/${idBoleta}/comprobante`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("No se pudo obtener el comprobante");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Error al mostrar comprobante");
    }
  };

  // UX states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [facultades, setFacultades] = useState([]);
  const [facultadesLoading, setFacultadesLoading] = useState(true);

  // Estados para manejar la información de decanos y facultad del usuario
  const [decanos, setDecanos] = useState([]);
  const [facultadDelUsuario, setFacultadDelUsuario] = useState(null);
  const [decanosLoading, setDecanosLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Context/modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    idFacultad: null,
    nombreFacultad: "",
    nombreCortoFacultad: "",
    asunto: "",
    cuerpo: "",
    archivos: [], // ahora es un array
  });
  const [busqueda, setBusqueda] = useState("");
  const [busquedaBoletas, setBusquedaBoletas] = useState("");

  // Nuevo estado para mostrar el toast de confirmación de borrado
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [archivosCargando, setArchivosCargando] = useState([]); // array de progreso por archivo
  // Nuevo estado para minimizar la modal
  const [minimizada, setMinimizada] = useState(false);
  const [selected, setSelected] = useState([]); // IDs de solicitudes seleccionadas
  const [solicitudesDocente, setSolicitudesDocente] = useState([]);

  const [loadingDocente, setLoadingDocente] = useState(false);

  // Función auxiliar para detectar el campo de ciclo en las solicitudes
  const detectarCampoCiclo = (solicitud) => {
    const posiblesCampos = [
      "ciclo",
      "Ciclo",
      "cicloAcademico",
      "CicloAcademico",
      "periodo",
      "Periodo",
      "semestre",
      "Semestre",
    ];

    for (const campo of posiblesCampos) {
      if (solicitud[campo] && typeof solicitud[campo] === "string") {
        // Verificar si el valor coincide con el formato XX/XX
        if (/^\d{2}\/\d{2}$/.test(solicitud[campo])) {
          return { campo, valor: solicitud[campo] };
        }
      }
    }

    // Si no se encuentra, buscar cualquier campo que contenga un formato de ciclo
    for (const [key, value] of Object.entries(solicitud)) {
      if (typeof value === "string" && /^\d{2}\/\d{2}$/.test(value)) {
        return { campo: key, valor: value };
      }
    }

    return null;
  };

  // Función auxiliar para obtener el ciclo de una solicitud
  const obtenerCicloSolicitud = (solicitud) => {
    const deteccion = detectarCampoCiclo(solicitud);
    return deteccion ? deteccion.valor : null;
  };

  // Fetch functions
  // Fetch functions
  const fetchSolicitudes = async (ciclo = null) => {
    setIsLoading(true);
    try {
      if (!user?.IDUsuario) {
        console.error("No hay usuario autenticado");
        return;
      }

      // Por ahora, siempre obtener todas las solicitudes y filtrar en frontend
      // Esto asegura que tenemos todos los datos para filtrar correctamente
      const SOLICITUDES_URL = process.env.NEXT_PUBLIC_SOLICITUDES;
      let url = SOLICITUDES_URL;

      /* console.log(
        `📋 Obteniendo todas las solicitudes para filtrar por: ${
          ciclo || "ciclo actual"
        }`
      ); */

      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        await router.push("/");
        return;
      }

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      // Update to use the new response structure
      setSolicitudes(data.solicitudes);

      /* console.log("Solicitudes cargadas:", {
        total: data.total,
        message: data.message,
        totalSolicitudes: data.solicitudes?.length || 0,
        cicloDelContexto: cicloActual,
        ciclosEncontrados: [
          ...new Set(
            (data.solicitudes || []).map((s) => s.ciclo).filter(Boolean)
          ),
        ],
        primerasSolicitudes: data.solicitudes?.slice(0, 2).map((s) => ({
          id: s.id,
          ciclo: s.ciclo,
          cicloDetectado: obtenerCicloSolicitud(s),
          campoDetectado: detectarCampoCiclo(s),
          todasLasProps: Object.keys(s),
          objetoCompleto: s,
        })),
        ciclosDetectados: [
          ...new Set(
            (data.solicitudes || [])
              .map((s) => obtenerCicloSolicitud(s))
              .filter(Boolean)
          ),
        ],
  }); */
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      toast.error("Error cargando solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch para solicitudes con respuesta del decano
  // 🟢 CAMBIO: función fetch de solicitudes respondidas por decano
  const fetchSolicitudesDocente = async () => {
    setLoadingDocente(true);
    try {
      const SOLICITUDES_INBOX_DOCENTE_URL =
        process.env.NEXT_PUBLIC_SOLICITUDES_INBOX_DOCENTE;
      const res = await fetch(SOLICITUDES_INBOX_DOCENTE_URL, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Filtrar solo solicitudes con respuestas
      const soloRespondidas = data.filter(
        (sol) => sol.respuestas && sol.respuestas.length > 0
      );

      // console.log("🟢 solicitudesDocente filtradas:", soloRespondidas);
      setSolicitudesDocente(soloRespondidas);
    } catch (error) {
      console.error("Error al cargar solicitudes docente:", error);
      setSolicitudesDocente([]);
    } finally {
      setLoadingDocente(false);
    }
  };

  const fetchInbox = async () => {
    setIsLoading(true);
    try {
      const SOLICITUDES_INBOX_URL = process.env.NEXT_PUBLIC_SOLICITUDES_INBOX;
      const res = await fetch(SOLICITUDES_INBOX_URL, {
        credentials: "include",
      });
      if (res.status === 401) {
        await router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Error al cargar bandeja");
      const data = await res.json();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error al cargar bandeja de entrada:", error);
      toast.error("Error cargando bandeja de entrada.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener información de la facultad basada en el email del decano o idFacultad
  const getFacultadInfo = (emailDecano, idFacultad = null) => {
    // console.log("🔍 Buscando facultad para:", { emailDecano, idFacultad });

    // Primero intentar por idFacultad si se proporciona
    if (idFacultad) {
      const facultadPorId = facultades.find((f) => f.IDFacultad === idFacultad);
      if (facultadPorId) {
        // console.log("✅ Facultad encontrada por ID:", facultadPorId);
        return {
          idFacultad: facultadPorId.IDFacultad,
          nombreFacultad: facultadPorId.Facultad,
          nombreCorto: facultadPorId.Facultad.replace("Facultad de ", ""),
        };
      }
    }

    // console.log("❌ No se pudo determinar la facultad");
    return null;
  };

  // Actualizar el estado inicial cuando se carguen las facultades
  useEffect(() => {
    // console.log("🔄 useEffect: Verificando actualización de estado inicial");
    // console.log("📊 facultades.length:", facultades.length);
    // console.log("📊 facultadesLoading:", facultadesLoading);
    // console.log("� nuevaSolicitud.idFacultad actual:", nuevaSolicitud.idFacultad);

    if (
      facultades.length > 0 &&
      !nuevaSolicitud.idFacultad &&
      !facultadesLoading
    ) {
      // console.log("✅ Actualizando estado inicial con primera facultad");
      // console.log("🎯 Primera facultad:", facultades[0]);

      setNuevaSolicitud((prev) => {
        const nuevoEstado = {
          ...prev,
          idFacultad: facultades[0].IDFacultad,
          nombreFacultad: facultades[0].Facultad,
          nombreCortoFacultad:
            facultades[0].NombreCorto || facultades[0].Facultad,
        };
        // console.log("📝 Estado inicial actualizado:", nuevoEstado);
        return nuevoEstado;
      });
    } else {
      // console.log("⏭️ No se actualiza estado inicial (ya tiene valor, está cargando o no hay facultades)");
    }
  }, [facultades, facultadesLoading]);

  // Fetch de decanos
  const fetchDecanos = async () => {
    try {
      // console.log("🔄 Fetching decanos...");
      const DECANOS_URL = process.env.NEXT_PUBLIC_DECANOS;
      const res = await fetch(DECANOS_URL, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Error al cargar decanos: ${res.status}`);
      }

      const data = await res.json();
      // console.log("✅ Decanos cargados:", data);

      const decanosArray = data.decanos || [];
      setDecanos(decanosArray);

      // Si el usuario es docente, buscar su facultad
      if (user && isDocente && !isDecano) {
        const decanoDelUsuario = decanosArray.find(
          (d) => d.IDEmpleado === user.IDReferencia
        );
        if (decanoDelUsuario) {
          /* console.log(
            "🏫 Facultad del usuario encontrada:",
            decanoDelUsuario.IDFacultad
          ); */
          setFacultadDelUsuario(decanoDelUsuario.IDFacultad);
        } else {
          /* console.log(
            "❌ No se encontró facultad para el usuario IDReferencia:",
            user.IDReferencia
          ); */
        }
      }
    } catch (error) {
      console.error("❌ Error cargando decanos:", error);
      toast.error("Error cargando información de decanos.");
    } finally {
      setDecanosLoading(false);
    }
  };

  // Fetch de facultades
  const fetchFacultades = async () => {
    try {
      // console.log("🔄 Fetching facultades...");
      const FACULTADES_URL = process.env.NEXT_PUBLIC_FACULTADES;
      const res = await fetch(FACULTADES_URL, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Error al cargar facultades: ${res.status}`);
      }

      const data = await res.json();
      // console.log("✅ Facultades cargadas:", data);

      // Normalizar la respuesta
      let facultadesArray = [];
      if (Array.isArray(data)) {
        facultadesArray = data;
      } else if (data && Array.isArray(data.facultades)) {
        facultadesArray = data.facultades;
      }

      // console.log("📋 Array de facultades normalizado:", facultadesArray);

      setFacultades(facultadesArray);
    } catch (error) {
      console.error("❌ Error cargando facultades:", error);
      toast.error("Error cargando facultades.");
    } finally {
      setFacultadesLoading(false);
    }
  };

  // Ejecutar useEffect principal
  useEffect(() => {
    if (!user) return; // Esperar a que cargue el usuario

    // Si es decano y está en la pestaña de solicitudes, redirigir a inbox
    if (isDecano && activeTab === "solicitudes") {
      setActiveTab("inbox");
      return;
    }

    if (activeTab === "inbox") {
      if (isDocente && !isDecano) {
        fetchSolicitudesDocente();
      } else {
        fetchInbox();
      }
    } else if (activeTab === "solicitudes") {
      // Solo permitir esta pestaña si no es decano y el ciclo ya está inicializado
      if (!isDecano && cicloInicializado && cicloFiltro && cicloValido) {
        // console.log("📋 Cargando solicitudes en useEffect principal con ciclo:", cicloFiltro);
        fetchSolicitudes(cicloFiltro);
      }
    }
  }, [activeTab, user, cicloInicializado, cicloFiltro, cicloValido]);

  // UseEffect para recargar solicitudes cuando cambie el ciclo seleccionado
  useEffect(() => {
    if (
      activeTab === "solicitudes" &&
      cicloFiltro &&
      cicloValido &&
      !isDecano &&
      cicloInicializado // Solo recargar si el ciclo ya está inicializado (evita carga duplicada)
    ) {
      // console.log("🔄 Recargando solicitudes por cambio de ciclo:", cicloFiltro);
      fetchSolicitudes(cicloFiltro);
    }
  }, [cicloFiltro, activeTab, isDecano, cicloValido, cicloInicializado]);

  // Cargar facultades y decanos al montar el componente
  useEffect(() => {
    fetchFacultades();
    fetchDecanos();
    // No cargar solicitudes aquí - se hará después de que el ciclo esté inicializado
    // console.log("🚀 Componente montado, facultades y decanos cargados");
  }, []);

  // Verificar la facultad del usuario cuando cambien los datos
  useEffect(() => {
    if (user && decanos.length > 0 && isDocente && !isDecano) {
      const decanoDelUsuario = decanos.find(
        (d) => d.IDEmpleado === user.IDReferencia
      );
      if (
        decanoDelUsuario &&
        decanoDelUsuario.IDFacultad !== facultadDelUsuario
      ) {
        // console.log("🔄 Actualizando facultad del usuario:", decanoDelUsuario.IDFacultad);
        setFacultadDelUsuario(decanoDelUsuario.IDFacultad);
      }
    }
  }, [user, decanos, isDocente, isDecano]);

  // Determinar si debe restringir por facultad y qué facultades mostrar
  const facultadesFiltradas = useMemo(() => {
    if (isDocente && !isDecano && facultadDelUsuario) {
      // Si es docente y tiene facultad asignada, solo mostrar esa facultad
      return facultades.filter((f) => f.IDFacultad === facultadDelUsuario);
    }
    // Para decanos u otros usuarios, mostrar todas las facultades
    return facultades;
  }, [facultades, isDocente, isDecano, facultadDelUsuario]);

  // Función para formatear el nombre del decano
  const formatearNombreDecano = (facultad) => {
    const decano = decanos.find((d) => d.IDFacultad === facultad.IDFacultad);
    if (decano) {
      const nombreFacultad = facultad.Facultad.replace(/FACULTAD DE /i, "");
      return `Decano de ${nombreFacultad}`;
    }
    return `Decano de ${facultad.Facultad}`;
  };

  // Función para obtener el nombre del decano que respondió basado en su ID
  const obtenerNombreDecano = (remitenteId, remitenteNombre) => {
    // Si ya viene el nombre, usarlo
    if (
      remitenteNombre &&
      remitenteNombre !== remitenteId &&
      typeof remitenteNombre === "string" &&
      !remitenteNombre.match(/^\d+$/)
    ) {
      return remitenteNombre;
    }

    // Si no, buscar en la lista de decanos por ID
    if (remitenteId && decanos.length > 0) {
      const decano = decanos.find(
        (d) =>
          d.IDEmpleado === parseInt(remitenteId) ||
          d.IDEmpleado === remitenteId ||
          d.IDDecano === parseInt(remitenteId) ||
          d.IDDecano === remitenteId
      );

      if (decano) {
        // Usar el campo correcto NombreEmpleado
        return decano.NombreEmpleado || "Decano";
      }
    }

    return "Decano";
  };

  const solicitudesFiltradas = useMemo(() => {
    /* console.log("🔄 Ejecutando filtro de solicitudes - Estado actual:", {
      activeTab,
      cicloFiltro,
      cicloValido,
      cicloActualDelContexto: cicloActual,
      totalSolicitudes: solicitudes?.length || 0,
      totalSolicitudesDocente: solicitudesDocente?.length || 0,
  }); */

    let fuente = [];

    if (activeTab === "inbox") {
      if (isDocente && !isDecano) {
        fuente = Array.isArray(solicitudesDocente) ? solicitudesDocente : [];
      } else {
        fuente = Array.isArray(solicitudes) ? solicitudes : [];
      }
    } else if (activeTab === "solicitudes") {
      fuente = Array.isArray(solicitudes) ? solicitudes : [];

      // Determinar comportamiento según el estado del filtro de ciclo
      if (!cicloFiltro) {
        // Campo vacío: no mostrar solicitudes hasta que se ingrese un ciclo
        // console.log("📝 Campo vacío - esperando que se ingrese un ciclo para filtrar");
        fuente = [];
      } else if (cicloFiltro && cicloValido) {
        // Ciclo válido ingresado: filtrar por ese ciclo
        const cicloParaFiltrar = cicloFiltro;
        // console.log("🔍 Aplicando filtro de ciclo específico:", cicloParaFiltrar);

        fuente = fuente.filter((sol) => {
          const cicloSolicitud = obtenerCicloSolicitud(sol);
          const coincide = cicloSolicitud === cicloParaFiltrar;

          if (cicloSolicitud) {
            /* console.log(
              `📄 Solicitud ${sol.IDSolicitud}: ciclo ${cicloSolicitud} ${
                coincide ? "✅" : "❌"
              }`
            ); */
          }

          return coincide;
        });

        // console.log(`✅ Filtro aplicado: ${fuente.length} solicitudes del ciclo ${cicloParaFiltrar}`);
      } else {
        // Ciclo incompleto o inválido: no mostrar solicitudes
        // console.log("⚠️ Ciclo incompleto o inválido - no mostrar solicitudes");
        fuente = [];
      }
    }

    return fuente.filter((sol) =>
      [sol.para || "", sol.asunto || "", sol.cuerpo || ""]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [
    activeTab,
    solicitudes,
    solicitudesDocente,
    busqueda,
    isDocente,
    isDecano,
    cicloFiltro,
    cicloValido,
  ]);

  const boletasFiltradas = useMemo(
    () =>
      boletas.filter((b) => {
        // Filtra por fecha y estado de revisión
        const fecha = b.UploadDate
          ? new Date(b.UploadDate).toLocaleDateString()
          : "";
        const estado = b.Reviewed ? "Revisada" : "Pendiente";
        return [fecha, estado]
          .join(" ")
          .toLowerCase()
          .includes(busquedaBoletas.toLowerCase());
      }),
    [boletas, busquedaBoletas]
  );

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "facultad") {
      // console.log("🔄 Cambio en selección de facultad:", { name, value });

      // Encontrar la facultad seleccionada para obtener información completa
      const facultadSeleccionada = facultadesFiltradas.find(
        (f) => f.IDFacultad.toString() === value
      );
      // console.log("🎯 Facultad seleccionada encontrada:", facultadSeleccionada);

      setNuevaSolicitud((prev) => {
        const nuevoEstado = {
          ...prev,
          idFacultad: facultadSeleccionada?.IDFacultad || null,
          nombreFacultad: facultadSeleccionada?.Facultad || "",
          nombreCortoFacultad:
            facultadSeleccionada?.NombreCorto ||
            facultadSeleccionada?.Facultad?.replace(/FACULTAD DE /i, "") ||
            "",
        };
        // console.log("📝 Nuevo estado de solicitud:", nuevoEstado);
        return nuevoEstado;
      });
    } else {
      setNuevaSolicitud((prev) => ({ ...prev, [name]: value }));
    }
  };
  // Handler para múltiples archivos con barra de carga (corregido para limpiar la barra al terminar)
  const handleArchivo = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Inicializa progreso en 0 para cada archivo nuevo
      setArchivosCargando((prev) => [...prev, ...files.map(() => 0)]);
      files.forEach((file, idx) => {
        let progress = 0;
        const globalIdx = archivosCargando.length + idx; // posición real en el array
        const interval = setInterval(() => {
          progress += 20 + Math.random() * 30;
          setArchivosCargando((prev) => {
            const copy = [...prev];
            copy[globalIdx] = Math.min(progress, 100);
            return copy;
          });
          if (progress >= 100) {
            clearInterval(interval);
            setNuevaSolicitud((prev) => ({
              ...prev,
              archivos: [...prev.archivos, file],
            }));
            // Elimina la barra de carga de este archivo después de un pequeño delay
            setTimeout(() => {
              setArchivosCargando((prev) => {
                const copy = [...prev];
                copy.splice(globalIdx, 1);
                return copy;
              });
            }, 400);
          }
        }, 200);
      });
    }
  };
  const abrirModal = () => {
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setTimeout(
      () =>
        setNuevaSolicitud({
          idFacultad: null,
          nombreFacultad: "",
          nombreCortoFacultad: "",
          asunto: "",
          cuerpo: "",
          archivos: [],
        }),
      300
    );
    setArchivosCargando([]);
  };

  // Guardar borrador en localStorage cada vez que cambia nuevaSolicitud (archivos como base64)
  useEffect(() => {
    if (modalOpen) {
      // Convertir archivos a base64 para guardar en localStorage
      const saveDraft = async () => {
        const archivos = await Promise.all(
          (nuevaSolicitud.archivos || []).map(async (file) => {
            if (file.base64) return file; // Ya convertido
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  base64: e.target.result,
                });
              };
              reader.readAsDataURL(file);
            });
          })
        );
        localStorage.setItem(
          "solicitudDraft",
          JSON.stringify({
            ...nuevaSolicitud,
            archivos,
          })
        );
      };
      saveDraft();
    }
  }, [nuevaSolicitud, modalOpen]);

  // Cargar borrador de localStorage al abrir el modal (archivos desde base64)
  useEffect(() => {
    if (modalOpen) {
      const draft = localStorage.getItem("solicitudDraft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          // console.log("📂 Borrador cargado desde localStorage:", parsed);
          // console.log("🆔 idFacultad del borrador:", parsed.idFacultad);
          // Reconstruir archivos desde base64
          const archivos = (parsed.archivos || []).map((f) => {
            if (f.base64) {
              // Reconstruir File desde base64 (solo para subir, no para descargar)
              const arr = f.base64.split(",");
              const mime = arr[0].match(/:(.*?);/)[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              try {
                return new File([u8arr], f.name, { type: mime });
              } catch (error) {
                console.error(
                  "Error al crear File, usando Blob como fallback:",
                  error
                );
                // fallback para navegadores antiguos
                const blob = new Blob([u8arr], { type: mime });
                blob.name = f.name;
                return blob;
              }
            }
            return f;
          });
          setNuevaSolicitud({
            para: parsed.para || "",
            idFacultad: parsed.idFacultad || null,
            asunto: parsed.asunto || "",
            cuerpo: parsed.cuerpo || "",
            archivos,
          });
          /* console.log("✅ Estado actualizado con borrador:", {
            para: parsed.para || "",
            idFacultad: parsed.idFacultad || null,
            asunto: parsed.asunto || "",
            cuerpo: parsed.cuerpo || "",
            archivosCount: archivos.length,
          }); */
        } catch (error) {
          console.error("Error al cargar borrador desde localStorage:", error);
        }
      }
    }
    // Limpia archivos en carga al abrir
    if (modalOpen) setArchivosCargando([]);
  }, [modalOpen]);

  // UseEffect para manejar la tecla Escape y cerrar la modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && modalOpen) {
        cerrarModal();
      }
    };

    // Agregar event listener cuando la modal esté abierta
    if (modalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    // Cleanup function para remover el event listener
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [modalOpen]);

  // UseEffect para establecer el ciclo actual como filtro por defecto
  useEffect(() => {
    // Establecer el ciclo del contexto como filtro por defecto cuando esté disponible
    if (cicloActual && !cicloInicializado) {
      // console.log("🔄 Estableciendo ciclo del contexto como filtro:", cicloActual);
      setCicloFiltro(cicloActual);
      setCicloValido(/^(01|02)\/\d{2}$/.test(cicloActual));
      setCicloInicializado(true);

      // Cargar solicitudes inmediatamente si estamos en la pestaña correcta
      if (
        activeTab === "solicitudes" &&
        !isDecano &&
        /^(01|02)\/\d{2}$/.test(cicloActual)
      ) {
        // console.log("📋 Cargando solicitudes tras inicializar ciclo:", cicloActual);
        fetchSolicitudes(cicloActual);
      }
    }
  }, [cicloActual, cicloInicializado, activeTab, isDecano]);

  // UseEffect para manejar la tecla Escape y cerrar la modal de detalle
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && detalleModalOpen) {
        cerrarDetalleModal();
      }
    };

    // Agregar event listener cuando la modal de detalle esté abierta
    if (detalleModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    // Cleanup function para remover el event listener
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [detalleModalOpen]);

  const handleEnviar = async () => {
    if (!nuevaSolicitud.asunto || !nuevaSolicitud.cuerpo) {
      toast.error("Completa asunto y cuerpo.");
      return;
    }

    // Validaciones según el nuevo controlador del backend
    if (!nuevaSolicitud.idFacultad) {
      toast.error("Selecciona una facultad.");
      return;
    }

    if (!nuevaSolicitud.nombreFacultad) {
      toast.error("Error: No se pudo determinar el nombre de la facultad.");
      return;
    }

    setIsSubmitting(true);

    try {
      /* console.log("📤 Enviando solicitud con datos:", {
        idFacultad: nuevaSolicitud.idFacultad,
        nombreFacultad: nuevaSolicitud.nombreFacultad,
        nombreCortoFacultad: nuevaSolicitud.nombreCortoFacultad,
        asunto: nuevaSolicitud.asunto,
        cuerpo: nuevaSolicitud.cuerpo,
        archivosCount: nuevaSolicitud.archivos?.length || 0,
  }); */

      const formData = new FormData();
      formData.append("idFacultad", nuevaSolicitud.idFacultad.toString());
      formData.append("nombreFacultad", nuevaSolicitud.nombreFacultad);
      formData.append(
        "nombreCortoFacultad",
        nuevaSolicitud.nombreCortoFacultad
      );
      formData.append("asunto", nuevaSolicitud.asunto);
      formData.append("cuerpo", nuevaSolicitud.cuerpo);

      // Agregar el ciclo actual del contexto
      if (cicloActual) {
        formData.append("ciclo", cicloActual);
        // console.log("📅 Agregando ciclo actual al FormData:", cicloActual);
      } else {
        console.warn("⚠️ No hay ciclo actual disponible en el contexto");
      }

      /* console.log("📋 FormData preparado con información completa:", {
        idFacultad: nuevaSolicitud.idFacultad,
        nombreFacultad: nuevaSolicitud.nombreFacultad,
        nombreCortoFacultad: nuevaSolicitud.nombreCortoFacultad,
        ciclo: cicloActual,
        asunto: nuevaSolicitud.asunto,
  }); */

      // Adjunta cada archivo individualmente
      if (nuevaSolicitud.archivos && nuevaSolicitud.archivos.length > 0) {
        nuevaSolicitud.archivos.forEach((file, index) => {
          /* console.log(
            `📎 Adjuntando archivo ${index + 1}:`,
            file.name,
            file.size,
            file.type
          ); */
          formData.append("archivos", file);
        });
      }

      // console.log("🌐 Enviando petición a backend...");
      const SOLICITUDES_URL = process.env.NEXT_PUBLIC_SOLICITUDES;
      const res = await fetch(SOLICITUDES_URL, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      /* console.log("📡 Respuesta del servidor:", {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
  }); */

      if (res.status === 401) {
        // console.log("🔐 Usuario no autenticado, redirigiendo...");
        await router.push("/");
        return;
      }

      let data;
      try {
        data = await res.json();
        // console.log("📄 Datos de respuesta:", data);
      } catch (parseError) {
        console.error("❌ Error al parsear respuesta JSON:", parseError);
        throw new Error(
          `Error del servidor (${res.status}): Respuesta no válida`
        );
      }

      if (!res.ok) {
        console.error("❌ Error del servidor:", data);
        throw new Error(data.message || `Error del servidor (${res.status})`);
      }

      // console.log("✅ Solicitud enviada exitosamente");
      await fetchSolicitudes(cicloFiltro);
      localStorage.removeItem("solicitudDraft");
      cerrarModal();

      // Mensaje de éxito con información de la facultad
      const mensajeExito = `Solicitud enviada exitosamente al decano de ${nuevaSolicitud.nombreCortoFacultad}`;
      toast.success(mensajeExito);
    } catch (err) {
      console.error("💥 Error completo al enviar solicitud:", err);
      console.error("Stack trace:", err.stack);

      // Mostrar mensaje más específico según el tipo de error
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        toast.error(
          "Error de conexión. Verifica que el servidor esté ejecutándose."
        );
      } else if (err.message.includes("413")) {
        toast.error(
          "Los archivos son demasiado grandes. Reduce el tamaño de los archivos."
        );
      } else if (err.message.includes("415")) {
        toast.error("Tipo de archivo no soportado.");
      } else {
        toast.error(err.message || "Error desconocido al enviar la solicitud");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verDetalles = (sol) => {
    if (isDecano) {
      // Para decanos: redirigir a la página de notificación donde pueden responder
      router.push(`/notificacion/${sol.IDSolicitud}`);
    } else {
      // Para docentes: abrir modal de detalles
      setSolicitudSeleccionada(sol);
      setDetalleModalOpen(true);
    }
  };
  const cerrarDetalleModal = () => {
    setDetalleModalOpen(false);
    setTimeout(() => setSolicitudSeleccionada(null), 300);
  };

  const eliminarSolicitud = async () => {
    if (!solicitudSeleccionada) return;
    setIsDeleting(true);
    try {
      const SOLICITUDES_URL = process.env.NEXT_PUBLIC_SOLICITUDES;
      const res = await fetch(
        `${SOLICITUDES_URL}/${solicitudSeleccionada.IDSolicitud}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.status === 401) {
        await router.push("/");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSolicitudes((prev) =>
        prev.filter((s) => s.IDSolicitud !== solicitudSeleccionada.IDSolicitud)
      );
      cerrarDetalleModal();
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const onRefresh = () => {
    if (activeTab === "inbox") {
      if (isDocente && !isDecano) fetchSolicitudesDocente();
      else fetchInbox();
    } else if (activeTab === "solicitudes") {
      fetchSolicitudes(cicloFiltro);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Solicitudes</title>
      </Head>
      <main className="min-h-screen bg-white text-gray-900">
        {/* Header Section */}
        <div className="bg-white text-black py-8 px-6 md:px-8">
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Solicitudes y Comprobantes de Retención de Renta
            </h1>
            <p className="text-gray-500 text-lg">
              Gestiona tus solicitudes y documentos de manera eficiente
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8">
          <div className="w-full">
            <nav className="flex space-x-1">
              {[
                { key: "inbox", label: "Bandeja de Entrada", icon: "📬" },
                ...(isDecano
                  ? []
                  : [
                      {
                        key: "solicitudes",
                        label: "Mis Solicitudes",
                        icon: "📝",
                      },
                    ]),
                {
                  key: "boletas",
                  label: "Comprobante de Retención de Renta",
                  icon: "💰",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm md:text-base transition-all duration-200 border-b-2 ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-6 md:px-8 py-8">
          <div className="bg-gray-50 rounded-xl p-6 min-h-[600px]">
            {/* Bandeja de Entrada */}
            {activeTab === "inbox" && (
              <div className="space-y-6">
                {/* Header con título y búsqueda */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Bandeja de Entrada
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {isDecano
                        ? "Revisa y responde las solicitudes recibidas"
                        : "Revisa tus solicitudes y respuestas"}
                    </p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Buscar solicitud..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Lista de mensajes */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : solicitudesFiltradas.length > 0 ? (
                    <>
                      {/* Contador de mensajes dentro del contenedor */}
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="text-sm text-end text-gray-600 font-medium">
                          {solicitudesFiltradas.length} mensajes
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {solicitudesFiltradas.map((sol) => {
                          const isSelected = selected.includes(sol.IDSolicitud);
                          const tieneRespuesta =
                            sol.respuestas && sol.respuestas.length > 0;
                          const respuesta = tieneRespuesta
                            ? sol.respuestas[0]
                            : null;

                          return (
                            <div
                              key={sol.IDSolicitud}
                              className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 border-l-4 border-blue-500"
                                  : ""
                              }`}
                            >
                              {tieneRespuesta ? (
                                // Vista para solicitudes respondidas
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div
                                      className={`p-2 rounded-full flex-shrink-0 ${
                                        respuesta.cuerpo === "APROBADO"
                                          ? "bg-green-100"
                                          : respuesta.cuerpo === "RECHAZADO"
                                          ? "bg-red-100"
                                          : "bg-blue-100"
                                      }`}
                                    >
                                      <FaCheckCircle
                                        className={`text-lg ${
                                          respuesta.cuerpo === "APROBADO"
                                            ? "text-green-600"
                                            : respuesta.cuerpo === "RECHAZADO"
                                            ? "text-red-600"
                                            : "text-blue-600"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                        Tu solicitud "{sol.asunto}" ha sido{" "}
                                        <span
                                          className={`${
                                            respuesta.cuerpo === "APROBADO"
                                              ? "text-green-600"
                                              : respuesta.cuerpo === "RECHAZADO"
                                              ? "text-red-600"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          {respuesta.cuerpo === "APROBADO"
                                            ? "APROBADA"
                                            : respuesta.cuerpo === "RECHAZADO"
                                            ? "RECHAZADA"
                                            : "respondida"}
                                        </span>
                                      </h3>
                                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">
                                            Respondida por:
                                          </span>
                                          <span className="font-semibold text-gray-800">
                                            {obtenerNombreDecano(
                                              respuesta.remitente_id,
                                              respuesta.NombreCompleto
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">
                                            Fecha:
                                          </span>
                                          <span>
                                            {new Date(
                                              respuesta.fecha
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          respuesta.cuerpo === "APROBADO"
                                            ? "bg-green-100 text-green-800"
                                            : respuesta.cuerpo === "RECHAZADO"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {respuesta.cuerpo === "APROBADO"
                                          ? "✅ APROBADA"
                                          : respuesta.cuerpo === "RECHAZADO"
                                          ? "❌ RECHAZADA"
                                          : "📩 Respondida"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4">
                                    <button
                                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const NOTIFICACIONES_URL =
                                            process.env
                                              .NEXT_PUBLIC_NOTIFICACIONES;
                                          await fetch(
                                            `${NOTIFICACIONES_URL}/${sol.IDSolicitud}/leida`,
                                            {
                                              method: "PUT",
                                              credentials: "include",
                                            }
                                          );
                                          router.push(
                                            `/notificacion/${sol.IDSolicitud}`
                                          );
                                        } catch (error) {
                                          console.error("Error:", error);
                                          toast.error(
                                            "Error al procesar la notificación"
                                          );
                                        }
                                      }}
                                    >
                                      <span>Ver respuesta</span>
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
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Vista para solicitudes sin respuesta
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleSelect(sol.IDSolicitud)
                                      }
                                      className="mt-1 form-checkbox h-4 w-4 text-blue-600 rounded flex-shrink-0"
                                    />
                                    <div
                                      className={`p-2 rounded-full flex-shrink-0 ${
                                        !sol.leida
                                          ? "bg-blue-100"
                                          : "bg-gray-100"
                                      }`}
                                    >
                                      <FaPaperPlane
                                        className={`text-lg ${
                                          !sol.leida
                                            ? "text-blue-600"
                                            : "text-gray-400"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                                          {sol.asunto}
                                        </h3>
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            !sol.leida
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {!sol.leida
                                            ? isDecano
                                              ? "Pendiente"
                                              : "No leída"
                                            : isDecano
                                            ? "Revisada"
                                            : "Leída"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                                        {isDecano ? (
                                          <div className="flex items-center gap-1">
                                            <span className="font-medium">
                                              De:
                                            </span>
                                            <span>
                                              {sol.nombre_remitente ||
                                                sol.remitente_email ||
                                                "Docente"}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span className="font-medium">
                                              Para:
                                            </span>
                                            <span>
                                              {sol.nombre_corto_facultad
                                                ? `Decano de ${sol.nombre_corto_facultad}`
                                                : sol.nombre_facultad
                                                ? `Decano de ${sol.nombre_facultad}`
                                                : "Decano"}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">
                                            {isDecano
                                              ? "Recibido:"
                                              : "Enviado:"}
                                          </span>
                                          <span>
                                            {new Date(
                                              sol.fecha_creacion
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-gray-700 text-sm line-clamp-2">
                                        {sol.cuerpo}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4">
                                    <button
                                      onClick={() => verDetalles(sol)}
                                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                                    >
                                      <span>
                                        {isDecano
                                          ? "Responder"
                                          : "Ver detalles"}
                                      </span>
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
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay mensajes
                      </h3>
                      <p className="text-gray-600">
                        {busqueda
                          ? "No se encontraron resultados para tu búsqueda."
                          : isDecano
                          ? "No hay solicitudes pendientes de revisar."
                          : "Tu bandeja de entrada está vacía."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "solicitudes" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Mis Solicitudes
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Gestiona tus solicitudes enviadas
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                      <input
                        type="text"
                        placeholder="Buscar solicitudes"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      onClick={abrirModal}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                    >
                      <FaPencilAlt /> Nueva Solicitud
                    </button>
                  </div>
                </div>

                {/* Lista de solicitudes */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Filtro de ciclo y contador - SIEMPRE VISIBLE */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-gray-600 flex-1">
                        {!cicloFiltro
                          ? "Ingrese un ciclo para filtrar solicitudes"
                          : cicloFiltro && cicloValido
                          ? cicloFiltro === cicloActual
                            ? `Mostrando todas las solicitudes del ciclo actual (${cicloFiltro})`
                            : `Mostrando solicitudes del ciclo específico ${cicloFiltro}`
                          : "Formato de ciclo inválido"}
                        {cicloFiltro === cicloActual && (
                          <span className="ml-1 text-blue-600 font-medium">
                            (Ciclo actual)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            Filtrar por ciclo:
                          </span>
                          <input
                            type="text"
                            value={cicloFiltro}
                            onChange={(e) => {
                              // Formatear automáticamente: aceptar solo dígitos y
                              // colocar '/' después de los dos primeros dígitos.
                              // Permitir eliminar la '/' si el usuario la borra.
                              const rawDisplay = String(e.target.value || "");
                              const prevDisplay = String(cicloFiltro || "");
                              const isDeleting =
                                rawDisplay.length < prevDisplay.length;
                              const digits = rawDisplay
                                .replace(/\D/g, "")
                                .slice(0, 4);
                              let formatted = "";

                              if (digits.length === 0) {
                                formatted = "";
                                setCicloValido(true); // Permitir campo vacío sin error
                              } else if (digits.length === 1) {
                                formatted = digits;
                                setCicloValido(false); // Formato incompleto
                              } else if (digits.length === 2) {
                                // If user is deleting, don't re-insert the slash so it can be removed.
                                formatted = isDeleting ? digits : `${digits}/`;
                                setCicloValido(false); // Formato incompleto
                              } else {
                                formatted = `${digits.slice(
                                  0,
                                  2
                                )}/${digits.slice(2)}`;
                                setCicloValido(
                                  /^(01|02)\/\d{2}$/.test(formatted)
                                );
                              }

                              setCicloFiltro(formatted);
                            }}
                            onBlur={() => {
                              if (!cicloFiltro) {
                                setCicloValido(true); // Campo vacío es válido
                                return;
                              }
                              // Sólo actualizar el estado de validez
                              setCicloValido(
                                /^(01|02)\/\d{2}$/.test(
                                  String(cicloFiltro).trim()
                                )
                              );
                            }}
                            placeholder="02/24"
                            className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white min-w-[100px] ${
                              cicloValido
                                ? "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                                : "border-red-400 focus:ring-red-500 focus:border-red-500"
                            }`}
                          />
                        </div>
                        <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
                          {solicitudesFiltradas.length} solicitudes
                        </div>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : solicitudesFiltradas.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {solicitudesFiltradas.map((sol) => {
                        const respondida =
                          sol.respuestas &&
                          Array.isArray(sol.respuestas) &&
                          sol.respuestas.length > 0;

                        return (
                          <div
                            key={sol.IDSolicitud}
                            className="p-6 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {respondida ? (
                                    <FaCheckCircle
                                      className="text-green-600 text-lg flex-shrink-0"
                                      title="Respondida"
                                    />
                                  ) : (
                                    <FaClock
                                      className="text-yellow-500 text-lg flex-shrink-0"
                                      title="Pendiente"
                                    />
                                  )}
                                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                                    {sol.asunto}
                                  </h3>
                                  <span
                                    className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                      respondida
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {respondida ? "Respondida" : "Pendiente"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Para:</span>
                                    <span>
                                      {sol.nombre_corto_facultad
                                        ? `Decano de ${sol.nombre_corto_facultad}`
                                        : sol.nombre_facultad
                                        ? `Decano de ${sol.nombre_facultad}`
                                        : "Decano"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">
                                      Enviado:
                                    </span>
                                    <span>
                                      {new Date(
                                        sol.fecha_creacion
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                                  {sol.cuerpo}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <button
                                  onClick={() => verDetalles(sol)}
                                  className="text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <span>Ver detalles</span>
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
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay solicitudes
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {busqueda
                          ? "No se encontraron resultados."
                          : !cicloFiltro
                          ? "Ingrese un ciclo para ver sus solicitudes."
                          : !cicloValido
                          ? "Formato de ciclo inválido. Use formato XX/XX (ej. 02/24)."
                          : cicloFiltro === cicloActual
                          ? `No hay solicitudes enviadas en el ciclo actual (${cicloActual}).`
                          : `No hay solicitudes para el ciclo ${cicloFiltro}.`}
                      </p>
                      {!busqueda &&
                        cicloFiltro &&
                        cicloValido &&
                        cicloFiltro === cicloActual && (
                          <button
                            onClick={abrirModal}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 font-medium transition-colors"
                          >
                            Crear primera solicitud
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boletas */}
            {activeTab === "boletas" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Comprobante de Retención de Renta
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Revisa tus comprobantes de renta
                    </p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Buscar boletas..."
                      value={busquedaBoletas}
                      onChange={(e) => setBusquedaBoletas(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Lista de boletas */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {boletasFiltradas.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💰</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay boletas
                      </h3>
                      <p className="text-gray-600">
                        {busquedaBoletas
                          ? "No se encontraron resultados."
                          : "No tienes boletas disponibles."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {boletasFiltradas.map((b) => (
                        <div
                          key={b.IDBoleta}
                          className="p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                                <span className="text-2xl">💰</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                  Comprobante de Retención de Renta
                                </h3>
                                <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Fecha:</span>
                                    <span>
                                      {b.UploadDate
                                        ? new Date(
                                            b.UploadDate
                                          ).toLocaleDateString()
                                        : "Sin fecha"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Estado:</span>
                                    <span
                                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        b.Reviewed
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {b.Reviewed ? "Revisada" : "Pendiente"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Comprobante de pago - Retención de renta
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              {b.FilePath ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    verComprobanteBoleta(b.IDBoleta)
                                  }
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                                >
                                  <span>Ver Comprobante</span>
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                              ) : (
                                <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                                  <span>Sin archivo</span>
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para Redactar Solicitud estilo Outlook */}
        {modalOpen && !minimizada && (
          <>
            {/* Modal principal */}
            <div className="fixed inset-0 z-50 pointer-events-auto">
              {/* Toast de confirmación para eliminar borrador */}
              {showDeleteToast && (
                <div className="fixed bottom-8 right-8 z-[60] flex items-end justify-end pointer-events-aut">
                  <div className="bg-white rounded-lg shadow-xl px-8 py-6 border border-gray-200 flex flex-col items-center animate-fade-in">
                    <span className="text-lg font-semibold mb-4 text-gray-800">
                      ¿Desea descartar este borrador?
                    </span>
                    <div className="flex gap-4">
                      <button
                        className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
                        onClick={() => {
                          setShowDeleteToast(false);
                          localStorage.removeItem("solicitudDraft");
                          cerrarModal();
                        }}
                      >
                        Sí, descartar
                      </button>
                      <button
                        className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md font-semibold hover:bg-gray-300 transition"
                        onClick={() => setShowDeleteToast(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="
    fixed bottom-4 right-4 z-50
    w-full max-w-[480px] md:max-w-xl
    min-h-[420px] max-h-[90vh]
    bg-white rounded-lg shadow-2xl border border-gray-200
    flex flex-col pointer-events-auto animate-slide-in-right
  "
              >
                {/* Barra superior */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaPencilAlt className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Nueva Solicitud
                      </h3>
                      <p className="text-sm text-gray-600">
                        Redacta tu mensaje
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botón minimizar */}
                    <button
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setMinimizada(true)}
                      title="Minimizar"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <rect
                          x="4"
                          y="14"
                          width="12"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={cerrarModal}
                      title="Cerrar"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                </div>
                {/* Campos de destinatarios */}
                <div className="px-4 py-2 bg-white border-b border-gray-200">
                  {/* Facultad */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 text-sm font-medium">
                      Para
                    </span>
                    <select
                      id="facultad"
                      name="facultad"
                      value={nuevaSolicitud.idFacultad || ""}
                      onChange={handleChange}
                      className="flex-1 border-0 border-b-2 border-blue-600 bg-transparent px-2 py-1 text-gray-700 focus:ring-0 focus:outline-none text-sm transition-colors duration-150 hover:border-blue-700 focus:border-blue-700"
                      style={{ minWidth: 0 }}
                    >
                      <option value="">Seleccione una facultad</option>
                      {facultadesFiltradas.map((f) => (
                        <option key={f.IDFacultad} value={f.IDFacultad}>
                          {formatearNombreDecano(f)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Asunto */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      id="asunto"
                      name="asunto"
                      value={nuevaSolicitud.asunto}
                      onChange={handleChange}
                      className="flex-1 border-0 border-b border-gray-300 bg-transparent px-2 py-1 text-gray-700 focus:ring-0 focus:outline-none text-sm transition-colors duration-150 hover:border-blue-600 focus:border-blue-600"
                      placeholder="Agregar un asunto"
                      style={{ minWidth: 0 }}
                    />
                  </div>
                </div>
                {/* Área de mensaje */}
                <div className="flex-1 overflow-y-auto px-4 py-3 bg-white flex flex-col">
                  <textarea
                    id="cuerpo"
                    name="cuerpo"
                    value={nuevaSolicitud.cuerpo}
                    onChange={handleChange}
                    rows={10}
                    className="w-full border-none bg-transparent px-0 py-2 text-gray-800 focus:ring-0 focus:outline-none resize-none text-sm flex-1"
                    placeholder="Escriba / para insertar archivos y más"
                  />
                  {/* Sección de archivos adjuntos estilo Outlook */}
                  {(archivosCargando.length > 0 ||
                    (nuevaSolicitud.archivos &&
                      nuevaSolicitud.archivos.length > 0)) && (
                    <div className="mt-3 flex flex-col gap-2">
                      {/* Barras de carga solo para archivos en carga */}
                      {archivosCargando.map((progreso, idx) => (
                        <div
                          key={"cargando-" + idx}
                          className="flex items-center gap-2 text-xs text-gray-600 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <FaPaperclip className="text-blue-500" />
                          <span className="truncate flex-1">
                            {nuevaSolicitud.archivos &&
                            nuevaSolicitud.archivos.length > idx
                              ? nuevaSolicitud.archivos[idx].name
                              : `Subiendo archivo...`}
                          </span>
                          <div className="flex-1 mx-2 min-w-[80px] max-w-[160px]">
                            <div className="w-full h-2 bg-gray-300 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded transition-all duration-200"
                                style={{ width: `${progreso}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-10 text-right">
                            {Math.round(progreso)}%
                          </span>
                        </div>
                      ))}
                      {/* Archivos ya cargados */}
                      {nuevaSolicitud.archivos &&
                        nuevaSolicitud.archivos.map((file, idx) => (
                          <div
                            key={file.name + idx}
                            className="flex items-center gap-2 text-xs text-gray-600 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md"
                          >
                            <FaPaperclip className="text-blue-500" />
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setNuevaSolicitud((prev) => ({
                                  ...prev,
                                  archivos: prev.archivos.filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="Quitar archivo"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {/* Botón de basura SOLO aquí, al final de la modal */}
                <div className="flex justify-between items-center px-6 pb-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  {/* Botón Enviar + Adjuntar archivos */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleEnviar}
                      disabled={isSubmitting}
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="mr-2" size={16} />
                      {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>
                    <label
                      htmlFor="fileInput"
                      className="cursor-pointer p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Adjuntar archivo"
                    >
                      <FaPaperclip size={18} />
                    </label>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleArchivo}
                      className="hidden"
                    />
                  </div>
                  {/* Botón de basura a la derecha */}
                  <button
                    className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setShowDeleteToast(true)}
                    title="Eliminar borrador"
                  >
                    <FaTrashAlt size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Minimizada */}
        {modalOpen && minimizada && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setMinimizada(false)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-3 font-medium"
            >
              <FaPencilAlt size={16} />
              <span>Continuar solicitud</span>
            </button>
          </div>
        )}

        {/* Modal para Detalle de Solicitud (sin cambios en su estructura interna, solo en cómo se muestra el adjunto) */}
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out
          ${
            detalleModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cerrarDetalleModal}
          />
          {solicitudSeleccionada && (
            <div
              className={`bg-white w-full max-w-lg rounded-lg shadow-xl p-6 relative text-gray-700 transform transition-all duration-300 ease-in-out flex flex-col
              ${
                detalleModalOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0"
              } max-h-[80vh]`}
            >
              {/* HEADER FIJO */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <button
                  onClick={cerrarDetalleModal}
                  aria-label="Cerrar modal"
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                  <FaTimes size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaEye className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Detalle de Solicitud
                    </h2>
                    <p className="text-sm text-gray-600">
                      Enviado el{" "}
                      {new Date(
                        solicitudSeleccionada.fecha_creacion
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* CUERPO DEL CONTENIDO CON SCROLL */}
              <div className="space-y-4 text-sm flex-grow overflow-y-auto px-6 py-4 text-justify">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Para:</span>
                    <span className="text-gray-900">
                      {solicitudSeleccionada.nombre_corto_facultad
                        ? `Decano de ${solicitudSeleccionada.nombre_corto_facultad}`
                        : solicitudSeleccionada.nombre_facultad
                        ? `Decano de ${solicitudSeleccionada.nombre_facultad}`
                        : "Decano"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Asunto:</span>
                    <span className="text-gray-900">
                      {solicitudSeleccionada.asunto}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-600">Mensaje:</span>
                  <div className="mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap">
                    {solicitudSeleccionada.cuerpo}
                  </div>
                </div>

                {solicitudSeleccionada.archivo_path && (
                  <div>
                    <span className="font-medium text-gray-600">Adjunto:</span>
                    <div className="mt-2">
                      <a
                        href={`${UPLOADS_URL}/${solicitudSeleccionada.archivo_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <GrAttachment size={16} />
                        {solicitudSeleccionada.archivo_nombre ||
                          "Ver archivo adjunto"}
                      </a>
                    </div>
                  </div>
                )}

                {solicitudSeleccionada.archivos &&
                  solicitudSeleccionada.archivos.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">
                        Adjuntos:
                      </span>
                      <div className="mt-2 space-y-2">
                        {solicitudSeleccionada.archivos.map((archivo) => (
                          <a
                            key={archivo.IDArchivo}
                            href={`${SERVER_URL}${archivo.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <GrAttachment size={16} />
                            {archivo.nombre_original}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* FOOTER FIJO */}
              <div className="flex justify-end space-x-3 mt-6 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
                <button
                  onClick={cerrarDetalleModal}
                  className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
                <button
                  onClick={eliminarSolicitud}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {isDeleting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <FiDelete className="mr-2 h-4 w-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
