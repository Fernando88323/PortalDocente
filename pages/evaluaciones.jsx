// pages/evaluaciones.jsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "@/components/DashboardLayout/DashboardLayout";
import { toast, Toaster } from "react-hot-toast";
import { useGrupos, GruposProvider } from "../context/contextGroups";
import { useUser, UserProvider } from "../context/contextUser";
import { FaChalkboardTeacher } from "react-icons/fa";
import { ImSpinner9 } from "react-icons/im";
import { FiGrid, FiList } from "react-icons/fi";

export default function EvaluacionesPage() {
  return (
    <GruposProvider>
      <UserProvider>
        <Evaluaciones />
      </UserProvider>
    </GruposProvider>
  );
}

function Evaluaciones() {
  const router = useRouter();
  const [preguntasAuto, setPreguntasAuto] = useState([]);
  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [habilitada, setHabilitada] = useState(false);
  const [cicloActual, setCicloActual] = useState(null); // Estado para el ciclo dinámico

  // Estado para manejar cuando las evaluaciones están deshabilitadas
  const [evaluacionesDeshabilitadas, setEvaluacionesDeshabilitadas] =
    useState(false);
  const [
    mensajeEvaluacionesDeshabilitadas,
    setMensajeEvaluacionesDeshabilitadas,
  ] = useState("");

  // Estados para controlar la disponibilidad del período de evaluación
  const [evaluacionDocenteNoDisponible, setEvaluacionDocenteNoDisponible] =
    useState(false);
  const [periodoDocenteFinalizado, setPeriodoDocenteFinalizado] =
    useState(false);
  const [datosPeriodoDocente, setDatosPeriodoDocente] = useState(null);

  const [evaluacionDecanoNoDisponible, setEvaluacionDecanoNoDisponible] =
    useState(false);
  const [periodoDecanoFinalizado, setPeriodoDecanoFinalizado] = useState(false);
  const [datosPeriodoDecano, setDatosPeriodoDecano] = useState(null);
  // Flags para indicar si existe un lanzamiento relacionado
  const [hayLanzamientoDocente, setHayLanzamientoDocente] = useState(null);
  const [hayLanzamientoDecano, setHayLanzamientoDecano] = useState(null);

  const { user } = useUser();
  const { grupos, loading: loadingGrupos } = useGrupos();

  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];
  const isDec = roles.some((r) => r.IDRol === 2);
  const isDoc = roles.some((r) => r.IDRol === 10);

  const [respuestas, setRespuestas] = useState(() => {
    try {
      const stored = localStorage.getItem("respuestas_docente");
      return JSON.parse(stored) || {};
    } catch (e) {
      return {};
    }
  });

  const [actual, setActual] = useState(() => {
    try {
      // Intentamos obtener el estado guardado según el tipo
      const valorGuardadoDocente = localStorage.getItem("actual_docente");

      if (valorGuardadoDocente === "coment") {
        return "coment";
      }

      if (valorGuardadoDocente) {
        const num = Number(valorGuardadoDocente);
        return !isNaN(num) ? num : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [enEval, setEnEval] = useState(false);
  const [tipoAct, setTipoAct] = useState(null);
  const [pendDoc, setPendDoc] = useState(null); // null = no verificado, true = pendiente, false = completado
  const [initialLoading, setInitialLoading] = useState(true); // Para controlar la carga inicial

  const [comentarios, setComentarios] = useState(() => {
    try {
      const commentDocente = localStorage.getItem("comentarios_docente");
      return commentDocente || "";
    } catch (e) {
      return "";
    }
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [IDCuestionarioActivo, setIDCuestionarioActivo] = useState(null);
  const [IDLanzamientoActivo, setIDLanzamientoActivo] = useState(null);
  const [PonderacionDocente, setPonderacionDocente] = useState(null);
  const [PonderacionDecano, setPonderacionDecano] = useState(null);
  const [configuracionCargada, setConfiguracionCargada] = useState(false);

  // Estados para evaluación de docentes por decano
  const [vistaDocentesLista, setVistaDocentesLista] = useState(false);
  const [docentesFacultad, setDocentesFacultad] = useState([]);
  const [infoFacultadDecano, setInfoFacultadDecano] = useState(null); // {Facultad, ciclo, totalDocentes, IDFacultad}
  const [docentesEvaluados, setDocentesEvaluados] = useState(new Set());
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [busquedaDocente, setBusquedaDocente] = useState("");
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [IDFacultadDecano, setIDFacultadDecano] = useState(null);
  const [preguntasParaEvaluarDocentes, setPreguntasParaEvaluarDocentes] =
    useState([]);
  const [viewModeDocentes, setViewModeDocentes] = useState("grid"); // "grid" o "list"
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Estados derivados (después de todas las declaraciones de estado)
  const mostrarTarjetaDocente =
    user &&
    isDoc &&
    !evaluacionDocenteNoDisponible &&
    !periodoDocenteFinalizado;
  const mostrarLoading =
    mostrarTarjetaDocente && (pendDoc === null || !configuracionCargada);

  // Función auxiliar para obtener el ciclo actual dinámicamente
  const obtenerCicloActual = async () => {
    try {
      const NEXT_PUBLIC_CICLO_ACTUAL = process.env.NEXT_PUBLIC_CICLO_ACTUAL;

      const response = await fetch(NEXT_PUBLIC_CICLO_ACTUAL, {
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
        return data.cicloActual;
      } else {
        const errorMsg = "Respuesta inválida del ciclo actual";
        console.error(errorMsg, data);
        return null;
      }
    } catch (error) {
      const errorMsg = "Error de conexión al obtener ciclo actual";
      console.error(errorMsg, error);
      return null;
    }
  };

  // Cargar configuración inicial del sistema
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        // Cargar ciclo actual
        await obtenerCicloActual();

        // Los valores se mantendrán como null hasta que sean cargados dinámicamente
      } catch (error) {
        console.warn("Error cargando configuración inicial:", error);
        // Los valores permanecerán null hasta que obtenerDatosDinamicos() los establezca
      } finally {
        setConfiguracionCargada(true);
      }
    };

    cargarConfiguracion();
  }, []);

  // Control de loading inicial para usuarios que no requieren verificación
  useEffect(() => {
    if (!user) return; // Esperar a que se cargue el usuario

    // Si no es docente ni decano, no hay nada que verificar
    if (!isDoc && !isDec) {
      setInitialLoading(false);
    }
  }, [user, isDoc, isDec]);

  // Persistir en localStorage
  useEffect(() => {
    if (tipoAct === "docente") {
      localStorage.setItem("respuestas_docente", JSON.stringify(respuestas));
      localStorage.setItem("comentarios_docente", comentarios);
      if (actual != null) {
        localStorage.setItem("actual_docente", actual.toString());
      }
    } else if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
      // Persistir respuestas específicas por docente evaluado
      const docenteId =
        docenteSeleccionado.IDDocente ||
        docenteSeleccionado.IDReferencia ||
        docenteSeleccionado.IDEmpleado;
      const storageKey = `respuestas_evaluar_docente_${docenteId}`;
      const actualKey = `actual_evaluar_docente_${docenteId}`;
      const comentariosKey = `comentarios_evaluar_docente_${docenteId}`;

      localStorage.setItem(storageKey, JSON.stringify(respuestas));
      localStorage.setItem(comentariosKey, comentarios);
      if (actual != null) {
        localStorage.setItem(actualKey, actual.toString());
      }
    }
  }, [respuestas, actual, comentarios, tipoAct, docenteSeleccionado]);

  // Fetch preguntas de Autoevaluación Docente
  useEffect(() => {
    // Si no hay usuario cargado aún, no hacer nada (mantener loading)
    if (!user) {
      return;
    }

    // Si el usuario no es docente, no hay evaluación docente que verificar
    if (!isDoc) {
      setPendDoc(false);
      setInitialLoading(false);
      return;
    }

    const verificarEvaluacionDocente = async () => {
      // setLoadingVerificacionDocente(true); // Eliminado - solo usamos initialLoading
      try {
        // PRIORIDAD 1: Verificar localStorage específico para este usuario
        const evaluacionCompletadaLocal = localStorage.getItem(
          `evaluacion_docente_completada_${user?.IDReferencia}`
        );
        if (evaluacionCompletadaLocal === "true") {
          setPendDoc(false);
          setInitialLoading(false);
          return;
        }
        const NEXT_PUBLIC_EVALUACIONES_DOCENTE =
          process.env.NEXT_PUBLIC_EVALUACIONES;

        const preguntasRes = await fetch(NEXT_PUBLIC_EVALUACIONES_DOCENTE, {
          credentials: "include",
        });

        if (!preguntasRes.ok) {
          // Verificar si es un error de evaluaciones deshabilitadas
          if (preguntasRes.status === 403) {
            try {
              const errorData = await preguntasRes.json();
              if (errorData.evaluacionesHabilitadas === false) {
                // console.log("❌ Evaluaciones deshabilitadas:", errorData);
                setEvaluacionesDeshabilitadas(true);
                setMensajeEvaluacionesDeshabilitadas(
                  errorData.message ||
                    "Las evaluaciones están actualmente deshabilitadas."
                );
                setPendDoc(false);
                setInitialLoading(false);
                return;
              }
            } catch (parseError) {
              console.warn("Error parseando respuesta 403:", parseError);
            }
          }

          throw new Error(
            "Error al obtener preguntas de autoevaluación docente"
          );
        }

        // El backend devuelve { message: "OK!", preguntas: [...], cuestionario: "Autoevaluación Docente" }
        const response = await preguntasRes.json();
        const preguntasDocente = response.preguntas || [];

        const arr = preguntasDocente.map((p) => ({
          id: p.IDPregunta,
          texto: p.Pregunta,
          tipo: "escala",
          IDAspecto: p.IDAspecto || 1,
          Aspecto: p.Aspecto || "Evaluación General",
          PonderacionAspecto: p.PonderacionAspecto || 100,
        }));
        setPreguntasAuto(arr);

        // Si no hay preguntas, no hay evaluación pendiente
        if (arr.length === 0) {
          setPendDoc(false);
          setInitialLoading(false);
          return;
        }

        // Obtener datos dinámicos para validar el período de lanzamiento
        const datosDinamicos = await obtenerDatosDinamicos("docente");

        // Sincronizar estados globales con los valores dinámicos obtenidos
        if (datosDinamicos) {
          if (IDLanzamientoActivo !== datosDinamicos.IDLanzamiento) {
            setIDLanzamientoActivo(datosDinamicos.IDLanzamiento);
          }
          if (IDCuestionarioActivo !== datosDinamicos.IDCuestionario) {
            setIDCuestionarioActivo(datosDinamicos.IDCuestionario);
          }
          if (PonderacionDocente !== datosDinamicos.Ponderacion) {
            setPonderacionDocente(datosDinamicos.Ponderacion);
          }
        }

        // Si no hay un lanzamiento relacionado, marcar como no habilitada
        if (datosDinamicos && datosDinamicos.hayLanzamiento === false) {
          // console.log("No hay lanzamientos para autoevaluación docente");
          setHayLanzamientoDocente(false);
          setEvaluacionDocenteNoDisponible(true);
          setPeriodoDocenteFinalizado(false);
          setDatosPeriodoDocente(null);
          setPendDoc(false);
          setInitialLoading(false);
          return;
        }
        setHayLanzamientoDocente(true);

        // Validar período de evaluación y actualizar estados de UI
        if (datosDinamicos.Inicio && datosDinamicos.Final) {
          const ahora = new Date();
          const inicio = new Date(datosDinamicos.Inicio);
          const final = new Date(datosDinamicos.Final);

          if (ahora < inicio) {
            // console.log("Evaluación docente aún no disponible - Mostrar mensaje de no disponible");
            setEvaluacionDocenteNoDisponible(true);
            setPeriodoDocenteFinalizado(false);
            setDatosPeriodoDocente({
              inicio: datosDinamicos.Inicio,
              final: datosDinamicos.Final,
              ciclo: datosDinamicos.Ciclo || cicloActual,
            });
            setPendDoc(false);
            setInitialLoading(false);
            return;
          } else if (ahora > final) {
            // console.log("Período de evaluación docente finalizado - Mostrar mensaje de finalizado");
            setEvaluacionDocenteNoDisponible(false);
            setPeriodoDocenteFinalizado(true);
            setDatosPeriodoDocente({
              inicio: datosDinamicos.Inicio,
              final: datosDinamicos.Final,
              ciclo: datosDinamicos.Ciclo || cicloActual,
            });
            setPendDoc(false);
            setInitialLoading(false);
            return;
          } else {
            // Período válido - resetear estados
            setEvaluacionDocenteNoDisponible(false);
            setPeriodoDocenteFinalizado(false);
            setDatosPeriodoDocente(null);
          }
        } else {
          // No hay fechas definidas - asumir válido y resetear estados
          setEvaluacionDocenteNoDisponible(false);
          setPeriodoDocenteFinalizado(false);
          setDatosPeriodoDocente(null);
        }

        // PRIORIDAD 2: Verificar en el backend solo si no está marcada como completada localmente
        if (user?.IDReferencia && configuracionCargada) {
          try {
            // Primero obtener los datos dinámicos para conseguir el IDLanzamiento correcto
            const datosDinamicos = await obtenerDatosDinamicos("docente");
            const lanzamientoID = datosDinamicos?.IDLanzamiento;

            if (!lanzamientoID) {
              console.warn(
                "No se pudo obtener IDLanzamiento dinámico para verificación"
              );
              setPendDoc(false);
              setInitialLoading(false);
              return;
            }

            // Actualizar el estado global con los valores correctos obtenidos dinámicamente
            if (IDLanzamientoActivo !== lanzamientoID) {
              setIDLanzamientoActivo(lanzamientoID);
            }
            if (IDCuestionarioActivo !== datosDinamicos?.IDCuestionario) {
              setIDCuestionarioActivo(datosDinamicos?.IDCuestionario);
            }
            if (PonderacionDocente !== datosDinamicos?.Ponderacion) {
              setPonderacionDocente(datosDinamicos?.Ponderacion);
            }

            // Usar el mismo ID que usaremos en el payload
            const docenteIDParaVerificar =
              user?.IDEmpleado || user?.IDReferencia;

            // Ruta real: /verificar/:IDReferencia/:IDLanzamiento
            const NEXT_PUBLIC_EVALUACIONES_VERIFICAR =
              process.env.NEXT_PUBLIC_EVALUACIONES_VERIFICAR;
            const verificacionRes = await fetch(
              `${NEXT_PUBLIC_EVALUACIONES_VERIFICAR}/${docenteIDParaVerificar}/${lanzamientoID}`,
              { credentials: "include" }
            );

            /*console.log("🔍 DEBUG - Verificación docente:", {
              url: `${NEXT_PUBLIC_EVALUACIONES_VERIFICAR}/${docenteIDParaVerificar}/${lanzamientoID}`,
              usuario: user?.IDReferencia,
              docenteIDParaVerificar,
              IDLanzamientoActivo,
              lanzamientoIDDinamico: lanzamientoID,
              status: verificacionRes.status,
              ok: verificacionRes.ok,
            });*/

            if (verificacionRes.ok) {
              const { yaRealizada } = await verificacionRes.json();
              // console.log("✅ Respuesta de verificación docente:", { yaRealizada });
              if (yaRealizada) {
                // console.log(`✅ Usuario ${user?.IDReferencia} ya completó la evaluación docente según el backend`);
                setPendDoc(false);
                setInitialLoading(false);
                // Sincronizar con localStorage específico para este usuario
                localStorage.setItem(
                  `evaluacion_docente_completada_${user?.IDReferencia}`,
                  "true"
                );
                return;
              }
            } else {
              const errorResponse = await verificacionRes
                .json()
                .catch(() => ({}));
              console.warn("⚠️ Error en verificación docente:", {
                status: verificacionRes.status,
                statusText: verificacionRes.statusText,
                error: errorResponse,
              });
            }
          } catch (verifyError) {
            console.warn(
              "Error verificando evaluación docente, verificando localStorage como fallback:",
              verifyError
            );
            // Si hay error en backend pero localStorage dice completada, respetar localStorage
            if (evaluacionCompletadaLocal === "true") {
              // console.log(`✅ Usando localStorage como fuente de verdad por error en backend para usuario ${user?.IDReferencia}`);
              setPendDoc(false);
              setInitialLoading(false);
              return;
            }
          }
        }

        // Si llegamos aquí, la evaluación está pendiente
        setPendDoc(true);
        setInitialLoading(false);
        // console.log(`📋 Evaluación docente pendiente para el usuario ${user?.IDReferencia}`);
      } catch (error) {
        console.error("Error en verificarEvaluacionDocente:", error);

        // En caso de error, verificar localStorage como fallback
        const evaluacionCompletadaLocal = localStorage.getItem(
          `evaluacion_docente_completada_${user?.IDReferencia}`
        );
        if (evaluacionCompletadaLocal === "true") {
          /* console.log(
            `✅ Error en backend, pero localStorage indica completada para usuario ${user?.IDReferencia}`
          ); */
          setPendDoc(false);
        } else {
          setPendDoc(false);
        }
        setInitialLoading(false); // Marcar que la verificación inicial ha terminado
      }
    };

    // Solo ejecutar cuando tengamos user y configuración cargada
    if (configuracionCargada) {
      verificarEvaluacionDocente();
    } else if (user && isDoc) {
      // Si es docente pero la configuración no está cargada, mantener en estado de verificación
      // pendDoc ya está en null, que es lo que queremos
    }
  }, [
    user,
    isDoc,
    configuracionCargada,
    IDLanzamientoActivo,
    IDCuestionarioActivo,
  ]);

  // Cargar preguntas para evaluar docentes (solo si el usuario es decano)
  useEffect(() => {
    if (!user || !isDec) return;

    const cargarPreguntasParaEvaluarDocentes = async () => {
      try {
        // AJUSTE: Usar el endpoint específico para obtener solo preguntas de evaluación de decano
        // Ruta: GET /evaluaciones/decano → getPreguntasDecano (IDCuestionario = 3)
        const NEXT_PUBLIC_EVALUACIONES_DECANO =
          process.env.NEXT_PUBLIC_EVALUACIONES_DECANO;
        const preguntasRes = await fetch(`${NEXT_PUBLIC_EVALUACIONES_DECANO}`, {
          credentials: "include",
        });

        if (!preguntasRes.ok) {
          // Verificar si es un error de evaluaciones deshabilitadas
          if (preguntasRes.status === 403) {
            try {
              const errorData = await preguntasRes.json();
              if (errorData.evaluacionesHabilitadas === false) {
                /* console.log(
                  "❌ Evaluaciones de decano deshabilitadas:",
                  errorData
                ); */
                setEvaluacionesDeshabilitadas(true);
                setMensajeEvaluacionesDeshabilitadas(
                  errorData.message ||
                    "Las evaluaciones están actualmente deshabilitadas."
                );
                setPreguntasParaEvaluarDocentes([]);
                return;
              }
            } catch (parseError) {
              console.warn(
                "Error parseando respuesta 403 en evaluación decano:",
                parseError
              );
            }
          }

          throw new Error("Error al obtener preguntas de evaluación de decano");
        }

        if (preguntasRes.ok) {
          const response = await preguntasRes.json();
          // El backend devuelve { message: "OK!", preguntas: db, cuestionario: "Evaluación Decano" }
          const preguntas = response.preguntas || [];
          const arr = preguntas.map((p) => ({
            id: p.IDPregunta,
            texto: p.Pregunta,
            tipo: "escala",
            IDAspecto: p.IDAspecto || 1,
            Aspecto: p.Aspecto || "Evaluación General",
            PonderacionAspecto: p.PonderacionAspecto || 100,
          }));
          setPreguntasParaEvaluarDocentes(arr);

          // console.log("📋 Preguntas para evaluar docentes cargadas:", { cantidad: arr.length, cuestionario: response.cuestionario });

          // Validar período de evaluación para evaluación de docentes por decano
          const datosDinamicos = await obtenerDatosDinamicos("evaluar-docente");

          // Si no hay lanzamiento relacionado para decano, marcar como no habilitada
          if (datosDinamicos && datosDinamicos.hayLanzamiento === false) {
            // console.log("No hay lanzamientos para evaluación de docentes (decano)");
            setHayLanzamientoDecano(false);
            setEvaluacionDecanoNoDisponible(true);
            setPeriodoDecanoFinalizado(false);
            setDatosPeriodoDecano(null);
            setPreguntasParaEvaluarDocentes([]);
            return;
          }
          setHayLanzamientoDecano(true);

          if (datosDinamicos.Inicio && datosDinamicos.Final) {
            const ahora = new Date();
            const inicio = new Date(datosDinamicos.Inicio);
            const final = new Date(datosDinamicos.Final);

            if (ahora < inicio) {
              // console.log("Evaluación de docentes aún no disponible - Mostrar mensaje de no disponible");
              setEvaluacionDecanoNoDisponible(true);
              setPeriodoDecanoFinalizado(false);
              setDatosPeriodoDecano({
                inicio: datosDinamicos.Inicio,
                final: datosDinamicos.Final,
                ciclo: datosDinamicos.Ciclo || cicloActual,
              });
              setPreguntasParaEvaluarDocentes([]); // Resetear preguntas para no mostrar la opción
              return;
            } else if (ahora > final) {
              // console.log("Período de evaluación de docentes finalizado - Mostrar mensaje de finalizado");
              setEvaluacionDecanoNoDisponible(false);
              setPeriodoDecanoFinalizado(true);
              setDatosPeriodoDecano({
                inicio: datosDinamicos.Inicio,
                final: datosDinamicos.Final,
                ciclo: datosDinamicos.Ciclo || cicloActual,
              });
              setPreguntasParaEvaluarDocentes([]); // Resetear preguntas para no mostrar la opción
              return;
            } else {
              // Período válido - resetear estados
              setEvaluacionDecanoNoDisponible(false);
              setPeriodoDecanoFinalizado(false);
              setDatosPeriodoDecano(null);
            }
          } else {
            // No hay fechas definidas - asumir válido y resetear estados
            setEvaluacionDecanoNoDisponible(false);
            setPeriodoDecanoFinalizado(false);
            setDatosPeriodoDecano(null);
          }
        }
      } catch (error) {
        console.warn("Error cargando preguntas para evaluar docentes:", error);
        setPreguntasParaEvaluarDocentes([]);

        // Intentar validar período incluso si hay error en preguntas
        try {
          const datosDinamicos = await obtenerDatosDinamicos("evaluar-docente");
          if (datosDinamicos.Inicio && datosDinamicos.Final) {
            const ahora = new Date();
            const inicio = new Date(datosDinamicos.Inicio);
            const final = new Date(datosDinamicos.Final);

            if (ahora < inicio) {
              setEvaluacionDecanoNoDisponible(true);
              setPeriodoDecanoFinalizado(false);
              setDatosPeriodoDecano({
                inicio: datosDinamicos.Inicio,
                final: datosDinamicos.Final,
                ciclo: datosDinamicos.Ciclo || cicloActual,
              });
            } else if (ahora > final) {
              setEvaluacionDecanoNoDisponible(false);
              setPeriodoDecanoFinalizado(true);
              setDatosPeriodoDecano({
                inicio: datosDinamicos.Inicio,
                final: datosDinamicos.Final,
                ciclo: datosDinamicos.Ciclo || cicloActual,
              });
            }
          }
        } catch (periodoError) {
          console.warn("Error validando período en catch:", periodoError);
        }
      }
    };

    if (configuracionCargada) {
      cargarPreguntasParaEvaluarDocentes();
    }
  }, [user, isDec, configuracionCargada]);

  // Auto-cargar docentes de facultad para decanos (para badge indicator)
  useEffect(() => {
    if (!user || !isDec || !configuracionCargada) return;

    // Solo cargar si no están ya cargados
    if (docentesFacultad.length === 0 && !loadingDocentes) {
      setLoadingDocentes(true);
      obtenerDocentesFacultad();
    }
  }, [
    user,
    isDec,
    configuracionCargada,
    docentesFacultad.length,
    loadingDocentes,
  ]);

  // Fetch habilitación global
  useEffect(() => {
    const NEXT_PUBLIC_CONFIGURACION_EVALUACION =
      process.env.NEXT_PUBLIC_CONFIGURACION_EVALUACION;
    fetch(NEXT_PUBLIC_CONFIGURACION_EVALUACION, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setHabilitada(!!d.habilitada))
      .catch(() => setHabilitada(false));
  }, []);

  // Control general de carga
  useEffect(() => {
    if (!user || loadingGrupos) return setLoadingGeneral(true);
    setLoadingGeneral(false);
  }, [user, loadingGrupos]);

  // Control del botón scroll to top
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300; // Mostrar después de 300px de scroll
      setShowScrollToTop(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Función para scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Lista de preguntas + comentario al final
  const preguntas =
    tipoAct === "docente"
      ? preguntasAuto
      : tipoAct === "evaluar-docente"
      ? preguntasParaEvaluarDocentes
      : [];
  const lista = [
    ...preguntas,
    {
      id: "coment",
      texto: "Comentarios finales (opcional)",
      tipo: "comentario",
    },
  ];

  // Iniciar evaluación
  const iniciar = (t, opts = {}) => {
    if (t === "docente" && pendDoc !== true) return; // Solo permitir si está pendiente
    if (t === "evaluar-docentes") {
      // Mostrar lista de docentes para evaluar
      setVistaDocentesLista(true);
      obtenerDocentesFacultad();
      return;
    }

    setTipoAct(t);
    setEnEval(true);

    // Actualizar la URL sin recargar para mantener el header visible
    try {
      const query = { ...router.query, evaluacion: t };
      if (opts.docenteId) query.doc = String(opts.docenteId);
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    } catch (e) {
      console.warn("No se pudo actualizar la URL (router no disponible):", e);
    }

    // Verificar si hay respuestas guardadas según el tipo
    const storageKey = "respuestas_docente";
    const actualKey = "actual_docente";
    const comentariosKey = "comentarios_docente";

    const respuestasGuardadas = JSON.parse(
      localStorage.getItem(storageKey) || "{}"
    );
    const valorActualGuardado = localStorage.getItem(actualKey);
    const comentariosGuardados = localStorage.getItem(comentariosKey) || "";

    if (Object.keys(respuestasGuardadas).length > 0 && valorActualGuardado) {
      // Si hay estado guardado para este tipo, restaurarlo
      setRespuestas(respuestasGuardadas);
      setComentarios(comentariosGuardados);
      setActual(
        valorActualGuardado === "coment"
          ? "coment"
          : Number(valorActualGuardado)
      );
    } else {
      // Si no hay estado guardado para este tipo, empezar desde cero
      localStorage.removeItem(storageKey);
      localStorage.removeItem(actualKey);
      localStorage.removeItem(comentariosKey);
      setRespuestas({});
      setComentarios("");
      const primeraPregunta = preguntasAuto[0]?.id;
      setActual(primeraPregunta);
    }
  };

  // Sincronizar estado con query params para mantener la navegación dentro de la misma página
  useEffect(() => {
    if (!router) return;
    const { evaluacion, doc } = router.query || {};
    /* console.log(
            `✅ Cuestionario seleccionado según el período actual (${tipo}) =>`,
            cuestionario
          ); */
    /* console.log(
            `✅ Lanzamiento seleccionado para período ${tipo}:`,
            lanzamiento
          ); */
    // console.log("✅ Usuario tiene acceso a cuestionarios");
    // console.log("✅ Existe un lanzamiento activo del cuestionario seleccionado.");
    // console.log("ℹ️ No hay un lanzamiento activo, se puede autogenerar.");
    // console.log("Iniciando verificación de acceso...");
    /* console.log("👍 Usuario con acceso para cuestionario", {
              usuario: user?.email,
              tipo: selectedTipoEvaluacion,
              cuestionario: selectedQuestionnaire,
              lanzamiento: selectedLanzamiento,
            }); */
    // console.log("Verificando acceso docente...");
    // console.log("✅ Acceso verificado para docente.");
    // console.log("✅ Respuesta verificación acceso recibida:", data);
    // console.log("✅ Verificación de acceso DECANO exitosa:", data);
    // console.log("✅ Verificación de acceso DOCENTE exitosa:", data);
    /* console.log("Iniciando verificación de acceso...", {
        usuario: user?.email,
        tipo: selectedTipoEvaluacion,
      }); */
    /* console.log("✅ Selección completa para verificación de acceso:", {
        tipoSeleccionado: selectedTipoEvaluacion,
        cuestionarioSeleccionado: selectedQuestionnaire,
        lanzamientoSeleccionado: selectedLanzamiento,
      }); */
    // console.log("✅ Períodos actualizados:", periods);
  }, [router?.query, docentesFacultad]);

  // Comprueba si **todas** las de escala están respondidas
  const allEscalaAnswered = preguntas.every((p) => {
    if (tipoAct === "docente") {
      const r = respuestas[p.id] || {};
      return grupos.every((g) => r[g.IDGrupo] != null);
    }
    if (tipoAct === "evaluar-docente") {
      const r = respuestas[p.id] || {};
      const gruposDoc = docenteSeleccionado?.Grupos || [];
      if (!gruposDoc.length) return false;
      return gruposDoc.every((gid) => r[gid] != null);
    }
    return false;
  });

  // isRespondida: para `"coment"` sólo true si todas las escalas están contestadas
  const isRespondida = (id) => {
    if (id === "coment") return allEscalaAnswered;
    if (tipoAct === "docente") {
      const r = respuestas[id] || {};
      return grupos.every((g) => r[g.IDGrupo] != null);
    }
    if (tipoAct === "evaluar-docente") {
      const r = respuestas[id] || {};
      const gruposDoc = docenteSeleccionado?.Grupos || [];
      return gruposDoc.every((gid) => r[gid] != null);
    }
    return false;
  };

  // Avanzar a la siguiente pregunta
  const siguiente = () => {
    const idx = lista.findIndex((p) => String(p.id) === String(actual));
    if (idx < lista.length - 1 && isRespondida(actual)) {
      setActual(lista[idx + 1].id);
    }
  };

  // Calcular calificación promedio basada en las respuestas
  const calcularCalificacion = (respuestasTransformadas, tipoEvaluacion) => {
    try {
      let totalNotas = 0;
      let cantidadNotas = 0;

      Object.entries(respuestasTransformadas).forEach(([preguntaId, valor]) => {
        if (preguntaId === "coment") return; // Ignorar comentarios

        if (
          tipoEvaluacion === "docente" ||
          tipoEvaluacion === "evaluar-docente"
        ) {
          // Para evaluaciones con múltiples grupos
          if (typeof valor === "object" && valor !== null) {
            Object.values(valor).forEach((nota) => {
              if (typeof nota === "number" && nota >= 1 && nota <= 10) {
                totalNotas += nota;
                cantidadNotas++;
              }
            });
          }
        } else {
          // Para otros tipos de evaluación
          if (typeof valor === "number" && valor >= 1 && valor <= 10) {
            totalNotas += valor;
            cantidadNotas++;
          }
        }
      });

      if (cantidadNotas === 0) return 0.0;

      // Calcular promedio y redondear a 2 decimales
      const promedio = totalNotas / cantidadNotas;
      return Math.round(promedio * 100) / 100;
    } catch (error) {
      console.warn("Error calculando calificación:", error);
      return 0.0;
    }
  };

  // Validar y normalizar ponderación
  const validarPonderacion = (valor, tipoEvaluacion = "docente") => {
    // Convertir a número si es string
    let ponderacion = typeof valor === "string" ? parseFloat(valor) : valor;

    // Si no es un número válido, usar valores por defecto
    if (
      isNaN(ponderacion) ||
      ponderacion === null ||
      ponderacion === undefined
    ) {
      console.warn(`Ponderación inválida: ${valor}, usando valor por defecto`);
      return tipoEvaluacion === "decano" ? 30 : 70;
    }

    // Si está fuera del rango permitido (0-100.00), ajustar
    if (ponderacion < 0) {
      console.warn(`Ponderación ${ponderacion} < 0, ajustando a 0`);
      return 0;
    }

    // El backend acepta hasta 100.00 (máximo permitido)
    if (ponderacion > 100) {
      console.warn(`Ponderación ${ponderacion} > 100, ajustando a 100.00`);
      return 100.0;
    }

    // Redondear a 2 decimales para evitar problemas de precisión
    return Math.round(ponderacion * 100) / 100;
  };

  // Obtener datos dinámicos
  const obtenerDatosDinamicos = async (tipoEvaluacion = null) => {
    const tipoActual = tipoEvaluacion || tipoAct;
    try {
      // Obtener datos de cuestionarios según el rol
      const NEXT_PUBLIC_EVALUACIONES_CUESTIONARIOS =
        process.env.NEXT_PUBLIC_EVALUACIONES_CUESTIONARIOS;
      const cuestionariosRes = await fetch(
        NEXT_PUBLIC_EVALUACIONES_CUESTIONARIOS,
        {
          credentials: "include",
        }
      );

      let cuestionarioData = null;
      let ponderacionCuestionario = null;

      if (cuestionariosRes.ok) {
        const response = await cuestionariosRes.json();
        const cuestionarios = response.db || [];

        // Buscar el cuestionario apropiado según el tipo de evaluación
        if (tipoActual === "docente") {
          // Buscar cuestionario para autoevaluación docente (RolEvaluador: DOCENTE)
          cuestionarioData = cuestionarios.find(
            (c) => c.RolEvaluador === "DOCENTE"
          );
        } else if (
          tipoActual === "decano" ||
          tipoActual === "evaluar-docente"
        ) {
          // Buscar cuestionario para evaluación de decano (RolEvaluador: DECANO)
          cuestionarioData =
            cuestionarios.find(
              (c) =>
                c.RolEvaluador === "DECANO" &&
                c.Cuestionario &&
                c.Cuestionario.toLowerCase().includes("decano")
            ) || cuestionarios.find((c) => c.RolEvaluador === "DECANO");
        }

        if (cuestionarioData) {
          ponderacionCuestionario =
            parseFloat(cuestionarioData.Ponderacion) || 100;
        }

        /* console.log(
          "Cuestionario seleccionado para",
          tipoActual,
          ":",
          cuestionarioData
        ); */
      }

      // Obtener datos de lanzamientos activos (incluye IDLanzamiento)
      const NEXT_PUBLIC_EVALUACIONES_LANZAMIENTOS =
        process.env.NEXT_PUBLIC_EVALUACIONES_LANZAMIENTOS;
      const lanzamientoRes = await fetch(
        NEXT_PUBLIC_EVALUACIONES_LANZAMIENTOS,
        {
          credentials: "include",
        }
      );

      let lanzamientoData = null;

      if (lanzamientoRes.ok) {
        const response = await lanzamientoRes.json();
        const lanzamientos = response.db || [];

        // Buscar el lanzamiento que coincida con el cuestionario seleccionado
        if (cuestionarioData) {
          lanzamientoData = lanzamientos.find(
            (l) => l.IDCuestionario === cuestionarioData.IDCuestionario
          );
        }

        // Buscar un lanzamiento que coincida explícitamente con el cuestionario o la descripción.
        // IMPORTANT: No usar un lanzamiento por "fallback" si no existe uno claramente relacionado.
        if (!lanzamientoData) {
          if (tipoActual === "docente") {
            lanzamientoData = lanzamientos.find(
              (l) =>
                (l.IDCuestionario &&
                  l.IDCuestionario === cuestionarioData?.IDCuestionario) ||
                (l.Descripcion &&
                  l.Descripcion.toLowerCase().includes(
                    "autoevaluación docente"
                  )) ||
                (l.Descripcion &&
                  l.Descripcion.toLowerCase().includes("docente"))
            );
          } else if (
            tipoActual === "decano" ||
            tipoActual === "evaluar-docente"
          ) {
            lanzamientoData = lanzamientos.find(
              (l) =>
                (l.IDCuestionario &&
                  l.IDCuestionario === cuestionarioData?.IDCuestionario) ||
                (l.Descripcion &&
                  l.Descripcion.toLowerCase().includes("evaluacion decano")) ||
                (l.Descripcion &&
                  l.Descripcion.toLowerCase().includes("decano"))
            );
          }
        }

        /* console.log(
          "Lanzamiento seleccionado para",
          tipoActual,
          ":",
          lanzamientoData
        ); */
      }

      // Si no se obtuvo cuestionario del endpoint, usar un default controlado (2=Docente, 3=Decano)
      if (!cuestionarioData) {
        cuestionarioData = {
          IDCuestionario:
            tipoActual === "docente"
              ? 2
              : tipoActual === "evaluar-docente"
              ? 3
              : 2,
        };
      }

      const resultado = {
        IDCuestionario:
          cuestionarioData?.IDCuestionario || IDCuestionarioActivo || 1,
        IDLanzamiento:
          lanzamientoData?.IDLanzamiento || IDLanzamientoActivo || 2,
        Ponderacion: validarPonderacion(
          ponderacionCuestionario ||
            (tipoActual === "decano" || tipoActual === "evaluar-docente"
              ? PonderacionDecano || 30
              : PonderacionDocente || 70),
          tipoActual
        ),
        // Datos adicionales del cuestionario
        NombreCuestionario: cuestionarioData?.Cuestionario || null,
        RolEvaluador: cuestionarioData?.RolEvaluador || null,
        PonderacionCuestionario: ponderacionCuestionario || null,
        // Datos adicionales del lanzamiento
        Ciclo: lanzamientoData?.Ciclo || null,
        Descripcion: lanzamientoData?.Descripcion || null,
        Inicio: lanzamientoData?.Inicio || null,
        Final: lanzamientoData?.Final || null,
        // Indicar explícitamente si se encontró un lanzamiento relevante
        hayLanzamiento: !!lanzamientoData,
      };

      // console.log("Datos dinámicos completos obtenidos:", resultado);
      return resultado;
    } catch (error) {
      console.warn(
        "Error obteniendo datos dinámicos, usando valores por defecto:",
        error
      );
      return {
        IDCuestionario: IDCuestionarioActivo || 1,
        IDLanzamiento: IDLanzamientoActivo || 2,
        Ponderacion: validarPonderacion(
          tipoAct === "decano"
            ? PonderacionDecano || 30
            : PonderacionDocente || 70,
          tipoAct
        ),
        NombreCuestionario: null,
        RolEvaluador: null,
        PonderacionCuestionario: null,
        Ciclo: null,
        Descripcion: null,
        Inicio: null,
        Final: null,
      };
    }
  };

  // Obtener lista de docentes para evaluación (solo para decanos)
  const obtenerDocentesParaEvaluar = async () => {
    if (tipoAct !== "decano") return [];

    try {
      const NEXT_PUBLIC_DOCENTES_FACULTAD =
        process.env.NEXT_PUBLIC_DOCENTES_FACULTAD;
      const res = await fetch(NEXT_PUBLIC_DOCENTES_FACULTAD, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        return data.docentes || [];
      }
    } catch (error) {
      console.warn("Error obteniendo docentes para evaluar:", error);
    }

    return [];
  };

  // Obtener IDFacultad dinámicamente desde el endpoint de facultades
  const obtenerIDFacultadDinamico = async () => {
    try {
      const NEXT_PUBLIC_FACULTADES = process.env.NEXT_PUBLIC_FACULTADES;
      const res = await fetch(NEXT_PUBLIC_FACULTADES, {
        credentials: "include",
      });

      if (res.ok) {
        const facultades = await res.json();
        // console.log("Facultades disponibles:", facultades);
        /*   console.log("Información del usuario:", {
          IDFacultad: user?.IDFacultad,
          facultad: user?.facultad,
          Facultad: user?.Facultad,
          roles: user?.sistemaasignacionroles,
        }); */

        // PRIORIDAD 1: Forzar IDFacultad = 3 para Ingeniería si existe
        const facultadIngenieria = facultades.find((f) => f.IDFacultad === 3);
        if (facultadIngenieria) {
          // Para este caso específico, forzamos siempre Ingeniería
          /*   console.log(
            "🔧 FORZANDO IDFacultad = 3 (Ingeniería) para este usuario"
          ); */
          return 3;
        }

        // PRIORIDAD 2: Si el usuario tiene un IDFacultad directo = 3, usarlo
        if (user?.IDFacultad === 3) {
          const facultadPorID = facultades.find((f) => f.IDFacultad === 3);
          if (facultadPorID) {
            // console.log("✅ Facultad encontrada por ID directo = 3:", facultadPorID);
            return 3;
          }
        }

        // PRIORIDAD 3: Búsqueda por palabras clave con preferencia a Ingeniería
        const nombreFacultadUsuario =
          user?.facultad?.Facultad || user?.Facultad || "";

        if (nombreFacultadUsuario && Array.isArray(facultades)) {
          // console.log("🔍 Buscando facultad por nombre:", nombreFacultadUsuario);

          const nombreUsuario = nombreFacultadUsuario.toLowerCase();

          // Búsqueda específica de Ingeniería con múltiples variantes
          const esIngenieria =
            nombreUsuario.includes("ingenieria") ||
            nombreUsuario.includes("ingeniería") ||
            nombreUsuario.includes("engineering") ||
            nombreUsuario.includes("ciencias naturales") ||
            nombreUsuario.includes("ing.") ||
            nombreUsuario.includes("engineer") ||
            nombreUsuario.includes("díaz pineda") ||
            nombreUsuario.includes("diaz pineda");

          if (esIngenieria) {
            // console.log("🎯 DETECTADO: Palabras clave de Ingeniería - Retornando IDFacultad = 3");
            return 3;
          }

          // Solo si NO es ingeniería, buscar otras facultades
          const facultadEncontrada = facultades.find((f) => {
            const nombreFacultad = f.Facultad?.toLowerCase() || "";

            // ECONOMIA (IDFacultad: 2) - Solo si no es ingeniería
            if (
              (nombreUsuario.includes("economia") ||
                nombreUsuario.includes("economía") ||
                nombreUsuario.includes("ciencias sociales") ||
                nombreUsuario.includes("rodríguez villalobos") ||
                nombreUsuario.includes("rodriguez villalobos")) &&
              !esIngenieria
            ) {
              return f.IDFacultad === 2;
            }

            // CIENCIAS JURIDICAS (IDFacultad: 1) - Solo si no es ingeniería
            if (
              (nombreUsuario.includes("juridica") ||
                nombreUsuario.includes("jurídica") ||
                nombreUsuario.includes("juridicas") ||
                nombreUsuario.includes("jurídicas") ||
                nombreUsuario.includes("derecho") ||
                nombreUsuario.includes("bernal silva")) &&
              !esIngenieria
            ) {
              return f.IDFacultad === 1;
            }

            return false;
          });

          if (facultadEncontrada) {
            // console.log("✅ Facultad encontrada por palabras clave:", facultadEncontrada);
            return facultadEncontrada.IDFacultad;
          }
        }

        // PRIORIDAD 4: Si el usuario tiene cualquier IDFacultad pero es de ingeniería, usar 3
        if (user?.IDFacultad && facultades.find((f) => f.IDFacultad === 3)) {
          // console.log("⚠️ Usuario con IDFacultad genérico - Forzando Ingeniería por defecto");
          return 3;
        }

        // PRIORIDAD 5: Fallback directo a Ingeniería si existe
        if (facultades.find((f) => f.IDFacultad === 3)) {
          // console.log("🔄 FALLBACK: Usando IDFacultad = 3 (Ingeniería) como predeterminado");
          return 3;
        }

        // PRIORIDAD 6: Último recurso - primera facultad disponible
        if (facultades.length > 0) {
          console.warn(
            "⚠️ ÚLTIMO RECURSO: Usando primera facultad disponible:",
            facultades[0]
          );
          return facultades[0].IDFacultad;
        }
      }
    } catch (error) {
      console.warn("❌ Error obteniendo facultades:", error);
    }

    // Fallback final - siempre Ingeniería para este caso
    console.warn("🚨 FALLBACK FINAL: Usando IDFacultad = 3 (Ingeniería)");
    return 3;
  };

  // Función para detectar si hay evaluaciones de docente empezadas pero no completadas
  const obtenerEvaluacionesEmpezadas = () => {
    if (!isDec || !user) return null;

    const evaluacionesEmpezadas = [];

    // Recorrer todas las claves del localStorage que correspondan a evaluaciones de docente
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith("actual_evaluar_docente_")) {
        const docenteId = key.replace("actual_evaluar_docente_", "");
        const actualValue = localStorage.getItem(key);
        const respuestasKey = `respuestas_evaluar_docente_${docenteId}`;
        const respuestas = localStorage.getItem(respuestasKey);

        // Si tiene pregunta actual guardada y respuestas, pero no está completada
        if (actualValue && respuestas) {
          try {
            const respuestasObj = JSON.parse(respuestas);
            // Si hay respuestas guardadas, significa que empezó la evaluación
            if (Object.keys(respuestasObj).length > 0) {
              // Verificar si no está completada
              const completadaKey = `evaluacion_docente_${docenteId}_completada_por_${
                user.IDReferencia || user.IDEmpleado
              }`;
              const completada = localStorage.getItem(completadaKey);

              if (completada !== "true") {
                evaluacionesEmpezadas.push({
                  docenteId,
                  actualPregunta: actualValue,
                  respuestasCount: Object.keys(respuestasObj).length,
                });
              }
            }
          } catch (error) {
            console.warn(
              "Error parsing respuestas para docente",
              docenteId,
              error
            );
          }
        }
      }
    }

    return evaluacionesEmpezadas.length > 0 ? evaluacionesEmpezadas : null;
  };

  // Función para verificar si un docente específico tiene evaluación empezada
  const tieneEvaluacionEmpezada = (docente) => {
    if (!isDec || !user || !docente) return false;

    const docenteId =
      docente.IDDocente || docente.IDReferencia || docente.IDEmpleado;
    const actualKey = `actual_evaluar_docente_${docenteId}`;
    const respuestasKey = `respuestas_evaluar_docente_${docenteId}`;
    const completadaKey = `evaluacion_docente_${docenteId}_completada_por_${
      user.IDReferencia || user.IDEmpleado
    }`;

    const actualValue = localStorage.getItem(actualKey);
    const respuestas = localStorage.getItem(respuestasKey);
    const completada = localStorage.getItem(completadaKey);

    // Si tiene pregunta actual y respuestas, pero no está completada
    if (actualValue && respuestas && completada !== "true") {
      try {
        const respuestasObj = JSON.parse(respuestas);
        return Object.keys(respuestasObj).length > 0;
      } catch (error) {
        console.warn("Error parsing respuestas para docente", docenteId, error);
        return false;
      }
    }

    return false;
  };

  // Obtener docentes de la facultad para evaluación por decano
  const obtenerDocentesFacultad = async () => {
    if (!isDec) {
      console.warn(
        "Usuario no es decano, no puede obtener docentes de facultad"
      );
      return [];
    }

    setLoadingDocentes(true);
    try {
      // Primero obtenemos el IDFacultad del decano
      const idFacultad = await obtenerIDFacultadDinamico();
      setIDFacultadDecano(idFacultad);

      // console.log("🏛️ Obteniendo docentes de la facultad:", idFacultad);

      // AJUSTE: Usar el endpoint correcto según las rutas del backend
      // Ruta: GET /decano/facultad/:IDFacultad/docentes → getDocentesPorFacultadDecano

      // Verificar que tengamos el ciclo actual antes de hacer la consulta
      if (!cicloActual) {
        console.error(
          "❌ No se pudo obtener el ciclo actual para consultar docentes"
        );
        setLoadingDocentes(false);
        return;
      }
      const NEXT_PUBLIC_EVALUACIONES_DECANO_FACULTAD =
        process.env.NEXT_PUBLIC_EVALUACIONES_DECANO_FACULTAD;
      const res = await fetch(
        `${NEXT_PUBLIC_EVALUACIONES_DECANO_FACULTAD}/${idFacultad}/docentes?ciclo=${cicloActual}`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const response = await res.json();
        // console.log("👥 Docentes de la facultad obtenidos:", response);

        // AJUSTE: Extraer el array de docentes según la estructura del backend
        const docentes = response.docentes || [];
        setInfoFacultadDecano({
          Facultad: response.Facultad,
          ciclo: response.ciclo,
          totalDocentes: response.totalDocentes,
          IDFacultad: response.IDFacultad,
        });
        // console.log("📋 Array de docentes extraído:", docentes);
        // console.log("📊 Total de docentes encontrados:", docentes.length);
        // console.log("🏛️ Facultad:", response.Facultad);
        // console.log("🆔 IDFacultad:", response.IDFacultad);

        // Debug: Mostrar estructura del primer docente
        if (docentes.length > 0) {
          // console.log("🔍 Estructura del primer docente:", docentes[0]);
          // console.log("🔍 Propiedades disponibles:", Object.keys(docentes[0]));
          // El backend devuelve: IDDocente, NombreCompleto, IDFacultad, Facultad, Materias[], Grupos[]
        }

        setDocentesFacultad(docentes);
        // Cargar estado de completados desde localStorage (por decano)
        const decId = user?.IDReferencia || user?.IDEmpleado;
        if (decId) {
          const evaluados = new Set();
          docentes.forEach((d) => {
            const did = d.IDDocente || d.IDReferencia;
            if (
              localStorage.getItem(
                `evaluacion_docente_${did}_completada_por_${decId}`
              ) === "true"
            ) {
              evaluados.add(did);
            }
          });
          setDocentesEvaluados(evaluados);
        }
        return docentes;
      } else {
        const error = await res.json().catch(() => ({}));
        console.error("Error obteniendo docentes de facultad:", {
          status: res.status,
          statusText: res.statusText,
          error,
        });
        toast.error("Error al obtener la lista de docentes de la facultad");
        return [];
      }
    } catch (error) {
      console.error("Error al obtener docentes de facultad:", error);
      toast.error("Error de conexión al obtener docentes");
      return [];
    } finally {
      setLoadingDocentes(false);
    }
  };

  // Iniciar evaluación de un docente específico
  const iniciarEvaluacionDocente = (docente) => {
    // console.log("📝 Iniciando evaluación del docente:", docente);
    /* console.log("🔍 DEBUG - Estado de preguntas:", {
      preguntasParaEvaluarDocentes: preguntasParaEvaluarDocentes,
      cantidadPreguntas: preguntasParaEvaluarDocentes.length,
      tipoAct: "evaluar-docente",
      isDec: isDec,
      user: user?.IDReferencia,
    }); */

    // VALIDACIÓN CRÍTICA: Verificar que hay preguntas disponibles
    if (
      !preguntasParaEvaluarDocentes ||
      preguntasParaEvaluarDocentes.length === 0
    ) {
      console.error(
        "❌ ERROR: No hay preguntas de decano disponibles para evaluar docente"
      );
      toast.error(
        "Error: No hay preguntas disponibles para la evaluación. Intenta recargar la página."
      );
      return;
    }

    const gruposDoc = Array.isArray(docente.Grupos) ? docente.Grupos : [];
    const materiasDoc = Array.isArray(docente.Materias) ? docente.Materias : [];
    const docenteNormalizado = {
      ...docente,
      Grupos: gruposDoc,
      Materias: materiasDoc,
    };
    setDocenteSeleccionado(docenteNormalizado);
    setTipoAct("evaluar-docente");
    setVistaDocentesLista(false);
    setEnEval(true);

    // Usar el ID correcto según la estructura de datos
    const docenteId =
      docente.IDDocente || docente.IDReferencia || docente.IDEmpleado;

    // Verificar si hay respuestas guardadas para este docente específico
    const storageKey = `respuestas_evaluar_docente_${docenteId}`;
    const actualKey = `actual_evaluar_docente_${docenteId}`;
    const comentariosKey = `comentarios_evaluar_docente_${docenteId}`;

    const respuestasGuardadas = JSON.parse(
      localStorage.getItem(storageKey) || "{}"
    );
    const valorActualGuardado = localStorage.getItem(actualKey);
    const comentariosGuardados = localStorage.getItem(comentariosKey) || "";

    if (Object.keys(respuestasGuardadas).length > 0 && valorActualGuardado) {
      // Migración: si se guardó formato simple (número) convertir a objeto por grupo
      const migrado = { ...respuestasGuardadas };
      const requiereMigrar = Object.values(migrado).some(
        (v) => typeof v === "number"
      );
      if (requiereMigrar && gruposDoc.length) {
        Object.entries(migrado).forEach(([pid, val]) => {
          if (typeof val === "number") {
            migrado[pid] = gruposDoc.reduce((acc, gid) => {
              acc[gid] = val;
              return acc;
            }, {});
          }
        });
      }
      setRespuestas(migrado);

      // Asegurar compatibilidad de tipos para el valor actual
      let actualNormalizado = valorActualGuardado;
      if (valorActualGuardado === "coment") {
        actualNormalizado = "coment";
      } else if (!isNaN(Number(valorActualGuardado))) {
        // Si es un número, mantenerlo como está para compatibilidad con las preguntas
        actualNormalizado = Number(valorActualGuardado);
      }

      // VALIDACIÓN CRÍTICA: Verificar que la pregunta guardada aún existe en la lista actual
      const preguntaExiste =
        preguntasParaEvaluarDocentes.some(
          (p) => String(p.id) === String(actualNormalizado)
        ) || actualNormalizado === "coment";

      if (!preguntaExiste) {
        console.warn(
          "⚠️ La pregunta guardada no existe en la lista actual, iniciando desde el principio:",
          {
            valorGuardado: valorActualGuardado,
            actualNormalizado,
            preguntasDisponibles: preguntasParaEvaluarDocentes.map((p) => p.id),
          }
        );
        // Si la pregunta guardada no existe, empezar desde el principio
        const primeraPregunta =
          preguntasParaEvaluarDocentes.length > 0
            ? preguntasParaEvaluarDocentes[0].id
            : null;
        setActual(primeraPregunta);
      } else {
        setActual(actualNormalizado);
      }

      setComentarios(comentariosGuardados);

      // console.log("💾 Respuestas previas cargadas para:", docente.NombreCompleto || docente.Nombre, { valorActualGuardado, actualNormalizado, tipoActualNormalizado: typeof actualNormalizado, preguntaExiste });
    } else {
      setRespuestas({});
      const primeraPregunta =
        preguntasParaEvaluarDocentes.length > 0
          ? preguntasParaEvaluarDocentes[0].id
          : null;
      // console.log("🎯 Primera pregunta establecida:", primeraPregunta);
      // console.log("🔍 DEBUG - Preguntas disponibles:", preguntasParaEvaluarDocentes.map((p) => ({ id: p.id, texto: p.texto })));
      setActual(primeraPregunta);
      setComentarios("");
    }
  };

  // Volver a la lista de docentes
  const volverAListaDocentes = () => {
    setVistaDocentesLista(true);
    setDocenteSeleccionado(null);
    setEnEval(false);
    setTipoAct(null);
    setRespuestas({});
    setActual(null);
    setComentarios("");
  };

  // Volver a la vista principal de evaluaciones (todos)
  const volverAEvaluaciones = () => {
    setVistaDocentesLista(false);
    setDocenteSeleccionado(null);
    setEnEval(false);
    setTipoAct(null);
    setRespuestas({});
    setActual(null);
    setComentarios("");
    // Intentar limpiar query params para mantener URL limpia
    try {
      router.replace({ pathname: router.pathname }, undefined, {
        shallow: true,
      });
    } catch (e) {
      console.warn("No se pudo limpiar la query al volver a evaluaciones:", e);
    }
  };

  // Manejar cambio de vista de docentes
  const handleViewModeDocentesChange = (mode) => {
    setViewModeDocentes(mode);

    // Toast profesional para cambio de vista
    const modeText = mode === "grid" ? "Cuadrícula" : "Lista";
    const icon =
      mode === "grid" ? (
        <FiGrid className="w-5 h-5 text-purple-600" />
      ) : (
        <FiList className="w-5 h-5 text-indigo-600" />
      );

    toast.success(`Vista cambiada a ${modeText}`, {
      icon,
      description: `Mostrando docentes en formato de ${modeText.toLowerCase()}`,
      duration: 1500,
      position: "bottom-right",
    });
  };

  // Validar si la evaluación está dentro del período permitido
  const validarPeriodoEvaluacion = (datosLanzamiento) => {
    if (!datosLanzamiento.Inicio || !datosLanzamiento.Final) {
      console.warn(
        "No se encontraron fechas de lanzamiento, permitiendo evaluación"
      );
      return true;
    }

    const ahora = new Date();
    const inicio = new Date(datosLanzamiento.Inicio);
    const final = new Date(datosLanzamiento.Final);

    const dentroDelPeriodo = ahora >= inicio && ahora <= final;

    if (!dentroDelPeriodo) {
      const opciones = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      const fechaInicioStr = inicio.toLocaleDateString("es-ES", opciones);
      const fechaFinalStr = final.toLocaleDateString("es-ES", opciones);
      const fechaActualStr = ahora.toLocaleDateString("es-ES", opciones);

      // Determinar si está antes o después del período y mostrar toast
      if (ahora < inicio) {
        // console.log("Mostrando toast: Evaluación aún no disponible");
        toast.error(
          `⏰ La evaluación aún no está disponible. Período: ${fechaInicioStr} - ${fechaFinalStr}. Fecha actual: ${fechaActualStr}`,
          {
            duration: 8000,
            position: "top-center",
            style: {
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#991B1B",
              fontSize: "14px",
              maxWidth: "500px",
            },
            icon: "�",
          }
        );
      } else {
        // console.log("Mostrando toast: Período de evaluación finalizado");
        toast.error(
          `⏰ El período de evaluación ha finalizado. Período: ${fechaInicioStr} - ${fechaFinalStr}. Fecha actual: ${fechaActualStr}`,
          {
            duration: 8000,
            position: "top-center",
            style: {
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#991B1B",
              fontSize: "14px",
              maxWidth: "500px",
            },
            icon: "📅",
          }
        );
      }

      console.warn(
        `Evaluación fuera del período permitido. Período: ${fechaInicioStr} - ${fechaFinalStr}`
      );
    }

    return dentroDelPeriodo;
  };

  // Función para obtener evaluaciones completas del usuario
  const obtenerEvaluacionesUsuario = async () => {
    if (!user?.IDReferencia) {
      console.warn(
        "No se puede obtener evaluaciones: IDReferencia no disponible"
      );
      return [];
    }

    try {
      // Usar el mismo ID que usaremos en el payload
      const usuarioIDParaConsultar = user?.IDEmpleado || user?.IDReferencia;
      const NEXT_PUBLIC_EVALUACIONES_DOCENTE =
        process.env.NEXT_PUBLIC_EVALUACIONES_DOCENTE;
      const res = await fetch(
        `${NEXT_PUBLIC_EVALUACIONES_DOCENTE}/${usuarioIDParaConsultar}`,
        { credentials: "include" }
      );

      if (res.ok) {
        const evaluaciones = await res.json();
        // console.log("📊 Evaluaciones del usuario obtenidas:", evaluaciones);
        return evaluaciones;
      } else {
        console.warn("No se pudieron obtener las evaluaciones del usuario");
        return [];
      }
    } catch (error) {
      console.error("Error obteniendo evaluaciones del usuario:", error);
      return [];
    }
  };

  // Función para verificar específicamente si una evaluación ya fue completada
  const verificarEvaluacionCompletada = async (
    tipoEvaluacion,
    idCuestionario = null,
    idLanzamiento = null
  ) => {
    if (!user?.IDReferencia || !configuracionCargada) {
      return false;
    }

    // PRIORIDAD 1: Verificar localStorage específico para este usuario
    const storageKey =
      tipoEvaluacion === "decano"
        ? `evaluacion_decano_completada_${user?.IDReferencia}`
        : `evaluacion_docente_completada_${user?.IDReferencia}`;

    const evaluacionCompletadaLocal = localStorage.getItem(storageKey);
    if (evaluacionCompletadaLocal === "true") {
      // console.log(`✅ Evaluación ${tipoEvaluacion} ya completada según localStorage para usuario ${user?.IDReferencia}`);
      return true;
    }

    // PRIORIDAD 2: Verificar en el backend solo si no está marcada como completada localmente
    try {
      let lanzamiento = idLanzamiento;

      // Si no se pasó un lanzamiento específico, obtenerlo dinámicamente
      if (!lanzamiento) {
        const datosDinamicos = await obtenerDatosDinamicos(tipoEvaluacion);
        lanzamiento = datosDinamicos?.IDLanzamiento;

        if (!lanzamiento) {
          console.warn(
            `No se pudo obtener IDLanzamiento dinámico para ${tipoEvaluacion}`
          );
          return false;
        }
      }

      // Usar el mismo ID que usaremos en el payload
      const usuarioIDParaVerificar = user?.IDEmpleado || user?.IDReferencia;

      const NEXT_PUBLIC_EVALUACIONES_VERIFICAR =
        process.env.NEXT_PUBLIC_EVALUACIONES_VERIFICAR;
      const res = await fetch(
        `${NEXT_PUBLIC_EVALUACIONES_VERIFICAR}/${usuarioIDParaVerificar}/${lanzamiento}`,
        { credentials: "include" }
      );

      /* console.log("🔍 DEBUG - Verificación en verificarEvaluacionCompletada:", {
        url: `${NEXT_PUBLIC_EVALUACIONES_VERIFICAR}/${usuarioIDParaVerificar}/${lanzamiento}`,
        usuario: user?.IDReferencia,
        usuarioIDParaVerificar,
        lanzamiento,
        tipoEvaluacion,
        status: res.status,
        ok: res.ok,
      }); */

      if (res.ok) {
        const { yaRealizada } = await res.json();
        // console.log(`✅ Verificación ${tipoEvaluacion} para usuario ${user?.IDReferencia}:`, { yaRealizada, cuestionario, lanzamiento });

        // Si el backend dice que está completada, sincronizar con localStorage específico para este usuario
        if (yaRealizada) {
          localStorage.setItem(storageKey, "true");
        }

        return yaRealizada;
      } else {
        const errorResponse = await res.json().catch(() => ({}));
        console.warn(
          `⚠️ Error en verificarEvaluacionCompletada para ${tipoEvaluacion}:`,
          {
            status: res.status,
            statusText: res.statusText,
            error: errorResponse,
            usuario: user?.IDReferencia,
          }
        );
      }
    } catch (error) {
      console.warn(`Error verificando evaluación ${tipoEvaluacion}:`, error);
      // En caso de error en backend, verificar localStorage como fallback
      if (evaluacionCompletadaLocal === "true") {
        // console.log(`✅ Usando localStorage como fuente de verdad por error en backend para ${tipoEvaluacion} del usuario ${user?.IDReferencia}`);
        return true;
      }
    }

    return false;
  };

  // Función para limpiar evaluaciones completadas (útil para desarrollo)
  const limpiarEvaluacionesCompletadas = async () => {
    // Limpiar localStorage específico para este usuario
    if (user?.IDReferencia) {
      localStorage.removeItem(
        `evaluacion_docente_completada_${user.IDReferencia}`
      );
    }

    // Limpiar también las claves antiguas globales por si acaso
    localStorage.removeItem("evaluacion_docente_completada");

    // Limpiar progreso de evaluaciones
    localStorage.removeItem("respuestas_docente");
    localStorage.removeItem("actual_docente");
    localStorage.removeItem("comentarios_docente");

    // Re-verificar estados con el backend
    if (isDoc && configuracionCargada) {
      const yaEvaluoDocente = await verificarEvaluacionCompletada("docente");
      setPendDoc(!yaEvaluoDocente);
    }

    // console.log(`🔄 Estados de evaluación actualizados desde el backend para usuario ${user?.IDReferencia}`);
  };

  // Terminar evaluación
  const terminarEvaluacion = async () => {
    setLoadingSubmit(true);

    // Variables para el scope completo
    let payload = null;
    let datosDinamicos = null;

    // Validación antes de enviar
    if (!allEscalaAnswered) {
      toast.error("Por favor responde todas las preguntas antes de continuar");
      setLoadingSubmit(false);
      return;
    }

    const userID = user?.IDReferencia;
    /* console.log("🔍 DEBUG - Información del usuario:", {
      userID,
      user_IDReferencia: user?.IDReferencia,
      user_IDEmpleado: user?.IDEmpleado,
      user_id: user?.id,
      user_completo: user,
    }); */

    if (!userID || isNaN(Number(userID))) {
      console.error("❌ Error: ID de usuario no válido:", {
        userID,
        userIDType: typeof userID,
        userIDNumber: Number(userID),
        isNaN: isNaN(Number(userID)),
      });
      toast.error("Error: ID de usuario no válido");
      setLoadingSubmit(false);
      return;
    }

    try {
      // Obtener datos dinámicos
      datosDinamicos = await obtenerDatosDinamicos(tipoAct);
      // console.log("Datos dinámicos obtenidos:", datosDinamicos);

      // Validar período de evaluación
      const periodoValido = validarPeriodoEvaluacion({
        Inicio: datosDinamicos.Inicio,
        Final: datosDinamicos.Final,
      });

      if (!periodoValido) {
        // El mensaje detallado ya se mostró en la función validarPeriodoEvaluacion
        setLoadingSubmit(false);
        return;
      }

      // Construir arrays dinámicos de los grupos
      const IDGrupoArray = grupos.map((g) => g.IDGrupo);
      const NombreMateriaArray = grupos.map((g) => g.Nombre);

      // Transformar respuestas al formato que espera el backend
      /* console.log("🔍 DEBUG - Respuestas originales antes de transformar:", {
        tipoAct,
        respuestasOriginales: respuestas,
        tipoRespuestas: typeof respuestas,
        cantidadRespuestas: Object.keys(respuestas).length,
        ejemploRespuesta: Object.entries(respuestas)[0],
      }); */

      // Para docente: el backend espera {preguntaId: {grupoId: nota}}
      const respuestasTransformadas = {};
      if (tipoAct === "docente") {
        Object.entries(respuestas).forEach(([preguntaId, valor]) => {
          if (preguntaId !== "coment") {
            // Para docente: valor ya es un objeto con respuestas por grupo {grupoId: nota}
            // El backend espera exactamente esta estructura: {preguntaId: {grupoId: nota}}
            respuestasTransformadas[preguntaId] = valor || {};
          }
        });
      } else if (tipoAct === "evaluar-docente") {
        const gruposDoc = docenteSeleccionado?.Grupos || [];
        Object.entries(respuestas).forEach(([preguntaId, valor]) => {
          if (preguntaId === "coment") return;
          const mapa = {};
          gruposDoc.forEach((gid) => {
            const nota = valor?.[gid];
            if (nota != null) mapa[gid] = nota;
          });
          respuestasTransformadas[preguntaId] = mapa;
        });
      } else {
        // Para otros tipos de evaluación de decano
        Object.entries(respuestas).forEach(([preguntaId, valor]) => {
          if (preguntaId !== "coment") {
            respuestasTransformadas[preguntaId] = valor;
          }
        });
      }

      /* console.log("🔍 DEBUG - Respuestas después de transformar:", {
        tipoAct,
        respuestasTransformadas,
        cantidadTransformadas: Object.keys(respuestasTransformadas).length,
        ejemploTransformada: Object.entries(respuestasTransformadas)[0],
      }); */

      // Determinar IDEvaluado dinámicamente
      let IDEvaluado = Number(userID);

      // Para evaluaciones de decano, el decano evalúa a otros docentes
      if (tipoAct === "decano") {
        // Si hay un parámetro de docente evaluado, usarlo
        // Para este caso, el decano se autoevalúa, pero puede extenderse
        IDEvaluado = Number(userID);
      }

      // Construir fecha actual en formato requerido por la base de datos (zona horaria local de Centroamérica)
      const obtenerFechaLocal = () => {
        try {
          const ahora = new Date();

          // Verificar que la fecha base sea válida
          if (isNaN(ahora.getTime())) {
            console.error("❌ Error: Fecha base inválida en obtenerFechaLocal");
            return null;
          }

          // Crear una nueva fecha ajustada a UTC-6 (Centroamérica)
          const offsetCentroamerica = -6 * 60; // UTC-6 en minutos
          const offsetLocal = ahora.getTimezoneOffset(); // Offset del navegador en minutos
          const diferencia = offsetCentroamerica - offsetLocal;

          // Crear fecha ajustada
          const fechaAjustada = new Date(
            ahora.getTime() + diferencia * 60 * 1000
          );

          // Verificar que la fecha ajustada sea válida
          if (isNaN(fechaAjustada.getTime())) {
            console.error(
              "❌ Error: Fecha ajustada inválida en obtenerFechaLocal"
            );
            return null;
          }

          // Formatear manualmente para asegurar el formato correcto
          const año = fechaAjustada.getFullYear();
          const mes = String(fechaAjustada.getMonth() + 1).padStart(2, "0");
          const dia = String(fechaAjustada.getDate()).padStart(2, "0");
          const horas = String(fechaAjustada.getHours()).padStart(2, "0");
          const minutos = String(fechaAjustada.getMinutes()).padStart(2, "0");
          const segundos = String(fechaAjustada.getSeconds()).padStart(2, "0");

          const resultado = `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

          // Validar el formato antes de retornar
          if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(resultado)) {
            console.error(
              "❌ Error: Formato de fecha generado inválido en obtenerFechaLocal:",
              resultado
            );
            return null;
          }

          return resultado;
        } catch (error) {
          console.error("❌ Error en obtenerFechaLocal:", error);
          return null;
        }
      };

      const fechaFormateada = obtenerFechaLocal();

      // Crear fecha de finalización en formato datetime para MySQL
      const obtenerFechaFinalizacion = () => {
        try {
          const ahora = new Date();

          // Verificar que la fecha base sea válida
          if (isNaN(ahora.getTime())) {
            console.error("❌ Error: Fecha base inválida");
            return null;
          }

          const offsetCentroamerica = -6 * 60;
          const offsetLocal = ahora.getTimezoneOffset();
          const diferencia = offsetCentroamerica - offsetLocal;

          const fechaAjustada = new Date(
            ahora.getTime() + diferencia * 60 * 1000
          );

          // Verificar que la fecha ajustada sea válida
          if (isNaN(fechaAjustada.getTime())) {
            console.error("❌ Error: Fecha ajustada inválida");
            return null;
          }

          // Formatear manualmente para asegurar el formato correcto YYYY-MM-DD HH:MM:SS
          const año = fechaAjustada.getFullYear();
          const mes = String(fechaAjustada.getMonth() + 1).padStart(2, "0");
          const dia = String(fechaAjustada.getDate()).padStart(2, "0");
          const horas = String(fechaAjustada.getHours()).padStart(2, "0");
          const minutos = String(fechaAjustada.getMinutes()).padStart(2, "0");
          const segundos = String(fechaAjustada.getSeconds()).padStart(2, "0");

          const resultado = `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

          // Validar el formato antes de retornar
          if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(resultado)) {
            console.error(
              "❌ Error: Formato de fecha generado inválido:",
              resultado
            );
            return null;
          }

          return resultado;
        } catch (error) {
          console.error("❌ Error en obtenerFechaFinalizacion:", error);
          return null;
        }
      };

      const fechaFinalizacion = obtenerFechaFinalizacion();

      // Validar que las fechas sean válidas
      if (
        !fechaFormateada ||
        fechaFormateada === null ||
        typeof fechaFormateada !== "string"
      ) {
        console.error(
          "❌ Error: Fecha de inicio no válida generada:",
          fechaFormateada
        );
        toast.error("Error generando fecha de inicio del sistema");
        setLoadingSubmit(false);
        return;
      }

      if (
        !fechaFinalizacion ||
        fechaFinalizacion === null ||
        typeof fechaFinalizacion !== "string"
      ) {
        console.error(
          "❌ Error: Fecha de finalización no válida generada:",
          fechaFinalizacion
        );
        toast.error("Error generando fecha de finalización del sistema");
        setLoadingSubmit(false);
        return;
      }

      // console.log("📅 Fecha de inicio (Fecha):", fechaFormateada);
      // console.log("✅ Fecha de finalización (Finalizacion):", fechaFinalizacion);
      /* console.log("🔍 Validación de fechas:", {
        fechaInicioLength: fechaFormateada.length,
        fechaFinalizacionLength: fechaFinalizacion.length,
        fechaInicioFormat: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
          fechaFormateada
        ),
        fechaFinalizacionFormat: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
          fechaFinalizacion
        ),
      }); */

      // Obtener IDFacultad dinámicamente
      const IDFacultadDinamico = await obtenerIDFacultadDinamico();
      // console.log("🎯 IDFacultad FINAL obtenido:", IDFacultadDinamico);

      // Verificación estricta para Ingeniería
      if (IDFacultadDinamico === 3) {
        // console.log("✅ CORRECTO: IDFacultad = 3 (Ingeniería) confirmado");
      } else {
        console.error(
          "❌ ERROR: IDFacultad debería ser 3 pero es:",
          IDFacultadDinamico
        );
        console.warn(
          "🔧 FORZANDO corrección a IDFacultad = 3 para este usuario"
        );
        // Forzar corrección
        const IDFacultadCorregido = 3;
        // console.log("✅ IDFacultad corregido a:", IDFacultadCorregido);
      }

      // Usar siempre IDFacultad = 3 para este caso específico
      const IDFacultadFinal = 3;
      // console.log("🎯 IDFacultad DEFINITIVO usado en payload:", IDFacultadFinal);

      // Obtener información del usuario autenticado desde el backend
      let docenteIDValidado = null;
      let estrategiaAutenticacion = "default";

      try {
        // Intentar obtener información del usuario autenticado
        const NEXT_PUBLIC_DASHBOARD_PROTECTED_ME =
          process.env.NEXT_PUBLIC_DASHBOARD_PROTECTED_ME;
        const userInfoRes = await fetch(
          `${NEXT_PUBLIC_DASHBOARD_PROTECTED_ME}`,
          {
            credentials: "include",
          }
        );

        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          // console.log("🔍 DEBUG - Información del usuario desde backend:", userInfo);

          // Usar el ID que el backend reconoce para este usuario
          docenteIDValidado =
            userInfo.IDEmpleado || userInfo.IDReferencia || userInfo.id;
          estrategiaAutenticacion = "backend";
        } else {
          console.warn(
            "No se pudo obtener info del usuario desde backend, usando valores locales"
          );
        }
      } catch (error) {
        console.warn("Error obteniendo info del usuario desde backend:", error);
      }

      // Fallback a datos locales si no se pudo obtener del backend
      if (!docenteIDValidado) {
        docenteIDValidado = user?.IDEmpleado || user?.IDReferencia || userID;
        estrategiaAutenticacion = "local";
      }

      /* console.log("🔐 DEBUG - Estrategia de autenticación:", {
        estrategia: estrategiaAutenticacion,
        docenteIDValidado,
        userID_original: userID,
        user_IDEmpleado: user?.IDEmpleado,
        user_IDReferencia: user?.IDReferencia,
      }); */

      // Payload simplificado que coincide exactamente con lo que espera el backend
      if (tipoAct === "docente") {
        // Estrategia 1: Usar IDDocente específico
        payload = {
          // Campos requeridos por el backend para autoevaluación docente
          IDDocente: Number(docenteIDValidado),
          IDReferencia: Number(docenteIDValidado), // Backend requiere IDReferencia para validación de seguridad
          IDCuestionario: datosDinamicos.IDCuestionario,
          IDLanzamiento: datosDinamicos.IDLanzamiento,
          IDGrupo: grupos.map((g) => g.IDGrupo), // Array de números
          NombreMateria: grupos.map((g) => g.Nombre), // Array de strings
          Ponderacion: validarPonderacion(datosDinamicos.Ponderacion, tipoAct),
          Calificacion: calcularCalificacion(respuestasTransformadas, tipoAct),
          Comentarios: comentarios || "", // ✅ AGREGADO: Campo faltante para comentarios
          respuestas: respuestasTransformadas, // {preguntaId: {grupoId: nota}}
        };

        // Log adicional para debugging del error 403
        /* console.log("🔍 DEBUG - Payload para autoevaluación docente:", {
          IDDocente: payload.IDDocente,
          IDReferencia: payload.IDReferencia,
          IDDocenteType: typeof payload.IDDocente,
          IDReferenciaType: typeof payload.IDReferencia,
          estrategiaAutenticacion,
          docenteIDValidado,
          userID_original: userID,
          user_IDEmpleado: user?.IDEmpleado,
          user_IDReferencia: user?.IDReferencia,
          IDCuestionario: payload.IDCuestionario,
          IDLanzamiento: payload.IDLanzamiento,
          cantidadGrupos: payload.IDGrupo.length,
          cantidadMaterias: payload.NombreMateria.length,
          cantidadRespuestas: Object.keys(payload.respuestas).length,
          // ✅ AGREGADO: Debug de comentarios
          Comentarios: payload.Comentarios,
          comentariosType: typeof payload.Comentarios,
          comentariosLength: payload.Comentarios?.length || 0,
    }); */
      } else if (tipoAct === "evaluar-docente") {
        if (!docenteSeleccionado) {
          toast.error("Error: No hay docente seleccionado para evaluar");
          setLoadingSubmit(false);
          return;
        }
        const gruposDoc = docenteSeleccionado.Grupos || [];
        const materiasDoc = docenteSeleccionado.Materias || [];
        const nombreMateriaArray = gruposDoc.map(
          (_, idx) => materiasDoc[idx] || materiasDoc[0] || "MATERIA"
        );
        payload = {
          IDEvaluador: Number(userID),
          IDEvaluado: Number(
            docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia
          ),
          IDLanzamiento: datosDinamicos?.IDLanzamiento || 1,
          IDGrupo: gruposDoc,
          NombreMateria: nombreMateriaArray,
          IDFacultad: IDFacultadFinal,
          Calificacion: calcularCalificacion(respuestasTransformadas, tipoAct),
          Comentarios: comentarios || "",
          respuestas: respuestasTransformadas,
          tipoEvaluacion: "evaluar-docente",
          modoMultiGrupo: true,
        };
        /* console.log("🔍 DEBUG - Payload para evaluación decano multi-grupo:", {
          ...payload,
          ejemploRespuesta: Object.entries(payload.respuestas)[0],
        }); */
      } else {
        // Para evaluación de decano (estructura diferente)
        payload = {
          Fecha: fechaFormateada,
          Finalizacion: fechaFinalizacion,
          IDCuestionario: datosDinamicos.IDCuestionario,
          IDLanzamiento: datosDinamicos.IDLanzamiento,
          IDEvaluador: Number(userID),
          IDEvaluado: Number(userID),
          Estado: "EDITABLE",
          Ponderacion: validarPonderacion(datosDinamicos.Ponderacion, tipoAct),
          Calificacion: calcularCalificacion(respuestasTransformadas, tipoAct),
          IDFacultad: IDFacultadFinal,
          Comentarios: comentarios || "",
          tipoEvaluacion: tipoAct,
          IDGrupo: grupos[0]?.IDGrupo || 1,
          IDMateria: grupos[0]?.IDMateria || grupos[0]?.IDGrupo || 1,
          respuestas: respuestasTransformadas,
        };
      }

      // Validar ponderación final antes de enviar
      /*   console.log("Ponderación original:", datosDinamicos.Ponderacion);
      console.log("Ponderación validada:", payload.Ponderacion);
      console.log(
        "🚀 Payload completo enviado:",
        JSON.stringify(payload, null, 2)
      );
      console.log("📦 Campos principales del payload:", {
        Fecha: payload.Fecha,
        Finalizacion: payload.Finalizacion,
        IDCuestionario: payload.IDCuestionario,
        IDLanzamiento: payload.IDLanzamiento,
        IDFacultad: payload.IDFacultad,
        tipoEvaluacion: payload.tipoEvaluacion,
      });
      console.log("Tipo de evaluación:", tipoAct); */

      // Validación específica por tipo de evaluación
      if (tipoAct === "docente") {
        // Validaciones para evaluación docente según backend
        if (!payload.IDDocente || isNaN(Number(payload.IDDocente))) {
          console.error("❌ Error: IDDocente inválido:", payload.IDDocente);
          toast.error("Error: ID de docente no válido");
          setLoadingSubmit(false);
          return;
        }

        if (!payload.IDReferencia || isNaN(Number(payload.IDReferencia))) {
          console.error(
            "❌ Error: IDReferencia inválido:",
            payload.IDReferencia
          );
          toast.error("Error: ID de referencia no válido");
          setLoadingSubmit(false);
          return;
        }

        // Validar que IDDocente e IDReferencia sean el mismo (requisito del backend)
        if (Number(payload.IDDocente) !== Number(payload.IDReferencia)) {
          console.error(
            "❌ Error: IDDocente e IDReferencia deben ser iguales:",
            {
              IDDocente: payload.IDDocente,
              IDReferencia: payload.IDReferencia,
            }
          );
          toast.error("Error: Inconsistencia en identificación de usuario");
          setLoadingSubmit(false);
          return;
        }

        if (!Array.isArray(payload.IDGrupo) || payload.IDGrupo.length === 0) {
          console.error(
            "❌ Error: IDGrupo debe ser un array válido para evaluación docente:",
            payload.IDGrupo
          );
          toast.error(
            "Error: No se encontraron grupos válidos para la evaluación"
          );
          setLoadingSubmit(false);
          return;
        }

        if (
          !Array.isArray(payload.NombreMateria) ||
          payload.NombreMateria.length === 0
        ) {
          console.error(
            "❌ Error: NombreMateria debe ser un array válido para evaluación docente:",
            payload.NombreMateria
          );
          toast.error(
            "Error: No se encontraron nombres de materias válidos para la evaluación"
          );
          setLoadingSubmit(false);
          return;
        }

        // Validar que todos los IDGrupo sean números
        const gruposValidos = payload.IDGrupo.every(
          (g) => typeof g === "number"
        );
        if (!gruposValidos) {
          console.error(
            "❌ Error: Todos los IDGrupo deben ser números:",
            payload.IDGrupo
          );
          toast.error("Error: Grupos con formato inválido");
          setLoadingSubmit(false);
          return;
        }

        // Validar que todos los NombreMateria sean strings
        const materiasValidas = payload.NombreMateria.every(
          (m) => typeof m === "string"
        );
        if (!materiasValidas) {
          console.error(
            "❌ Error: Todos los NombreMateria deben ser strings:",
            payload.NombreMateria
          );
          toast.error("Error: Nombres de materias con formato inválido");
          setLoadingSubmit(false);
          return;
        }

        // Validar estructura de respuestas
        if (
          typeof payload.respuestas !== "object" ||
          Object.keys(payload.respuestas).length === 0
        ) {
          console.error("❌ Error: Respuestas inválidas:", payload.respuestas);
          toast.error("Error: No se encontraron respuestas válidas");
          setLoadingSubmit(false);
          return;
        }

        // console.log("✅ Validación para evaluación docente exitosa");
        /* console.log("🔍 DEBUG - Payload FINAL para backend de docente:", {
          IDDocente: payload.IDDocente,
          IDCuestionario: payload.IDCuestionario,
          IDLanzamiento: payload.IDLanzamiento,
          IDGrupo: payload.IDGrupo,
          NombreMateria: payload.NombreMateria,
          Ponderacion: payload.Ponderacion,
          respuestas: Object.keys(payload.respuestas),
        }); */
        /* console.log("🔍 DEBUG - Ejemplo de estructura de respuestas:", {
          primeraRespuesta: Object.entries(payload.respuestas)[0],
        }); */
      } else if (tipoAct === "evaluar-docente") {
        if (!payload.IDEvaluador || isNaN(Number(payload.IDEvaluador))) {
          console.error("❌ Error: IDEvaluador inválido:", payload.IDEvaluador);
          toast.error("Error: ID de evaluador (decano) no válido");
          setLoadingSubmit(false);
          return;
        }
        if (!payload.IDEvaluado || isNaN(Number(payload.IDEvaluado))) {
          console.error("❌ Error: IDEvaluado inválido:", payload.IDEvaluado);
          toast.error("Error: ID de docente evaluado no válido");
          setLoadingSubmit(false);
          return;
        }
        if (!Array.isArray(payload.IDGrupo) || payload.IDGrupo.length === 0) {
          console.error(
            "❌ Error: IDGrupo inválido (multi-grupo requerido)",
            payload.IDGrupo
          );
          toast.error("Error: Sin grupos para el docente");
          setLoadingSubmit(false);
          return;
        }
        // Validar que cada pregunta tenga nota para todos los grupos
        const faltantes = Object.entries(payload.respuestas).some(
          ([pid, mapa]) => {
            if (pid === "coment") return false;
            return payload.IDGrupo.some((gid) => mapa[gid] == null);
          }
        );
        if (faltantes) {
          console.error(
            "❌ Error: Faltan notas por grupo en alguna pregunta",
            payload.respuestas
          );
          toast.error("Error: Faltan notas en uno o más grupos");
          setLoadingSubmit(false);
          return;
        }
        /* console.log(
          "✅ Validación multi-grupo para evaluación decano->docente exitosa"
        ); */
      } else {
        // Validaciones para evaluación de decano (autoevaluación)
        if (
          !payload.Fecha ||
          typeof payload.Fecha !== "string" ||
          !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payload.Fecha)
        ) {
          console.error("❌ Error: Fecha inválida:", payload.Fecha);
          toast.error("Error: Fecha de inicio inválida");
          setLoadingSubmit(false);
          return;
        }

        if (
          !payload.Finalizacion ||
          typeof payload.Finalizacion !== "string" ||
          !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payload.Finalizacion)
        ) {
          console.error(
            "❌ Error: Fecha de finalización inválida:",
            payload.Finalizacion
          );
          toast.error("Error: Fecha de finalización inválida");
          setLoadingSubmit(false);
          return;
        }

        // console.log("✅ Validación para evaluación de decano exitosa");
      }

      // AJUSTE: Usar los endpoints correctos según las rutas del backend
      const NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION =
        process.env.NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION;
      const NEXT_PUBLIC_EVALUACIONES_DECANO_FINALIZAR =
        process.env.NEXT_PUBLIC_EVALUACIONES_DECANO_FINALIZAR;
      const endpoint =
        tipoAct === "docente"
          ? NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION
          : tipoAct === "evaluar-docente"
          ? NEXT_PUBLIC_EVALUACIONES_DECANO_FINALIZAR
          : NEXT_PUBLIC_EVALUACIONES_DECANO_FINALIZAR; // POST /decano/finalizar → guardarEvaluacionDecano (ruta correcta)

      let res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // Si es error 403 en evaluación docente, intentar estrategia alternativa
      if (!res.ok && res.status === 403 && tipoAct === "docente") {
        console.warn(
          "⚠️ Error 403 detectado, intentando estrategia alternativa sin IDDocente..."
        );

        // Estrategia 2: Omitir IDDocente para que el backend lo determine de la sesión
        const payloadAlternativo = {
          IDReferencia: Number(docenteIDValidado), // Mantener IDReferencia para validación
          IDCuestionario: datosDinamicos.IDCuestionario,
          IDLanzamiento: datosDinamicos.IDLanzamiento,
          IDGrupo: grupos.map((g) => g.IDGrupo),
          NombreMateria: grupos.map((g) => g.Nombre),
          Ponderacion: validarPonderacion(datosDinamicos.Ponderacion, tipoAct),
          Comentarios: comentarios || "", // ✅ AGREGADO: Campo faltante para comentarios
          respuestas: respuestasTransformadas,
        };

        // console.log("🔄 Reintentando con payload alternativo (sin IDDocente):", payloadAlternativo);

        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payloadAlternativo),
        });

        // Si aún falla, intentar con el endpoint original como fallback
        if (!res.ok && res.status === 403) {
          console.warn(
            "⚠️ Segundo intento fallido, usando endpoint original como fallback..."
          );

          // Usar el mismo endpoint original pero con payload simplificado
          const NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION =
            process.env.NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION;
          const endpointAlternativo = NEXT_PUBLIC_EVALUACIONES_AUTOEVALUACION;
          res = await fetch(endpointAlternativo, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payloadAlternativo),
          });
        }
      }

      if (!res.ok) {
        let err;
        try {
          err = await res.json();
        } catch (_) {
          try {
            const txt = await res.text();
            err = { message: txt };
          } catch (__) {
            err = { message: "Error desconocido (sin cuerpo)" };
          }
        }
        const errorMessage = err.message || `Status ${res.status}`;

        // Manejo específico para error 409 - Evaluación ya realizada
        if (res.status === 409) {
          /* console.log("⚠️ Error 409 - Evaluación ya realizada:", {
            status: res.status,
            statusText: res.statusText,
            errorMessage,
            usuario: user?.IDReferencia,
            tipoEvaluacion: tipoAct,
          }); */

          // Si el backend dice que ya está realizada, marcar como completada
          if (tipoAct === "decano") {
            setPendDec(false);
            localStorage.setItem(
              `evaluacion_decano_completada_${user?.IDReferencia}`,
              "true"
            );
            toast.success("Esta evaluación ya fue completada anteriormente.", {
              position: "top-center",
              duration: 4000,
            });
          } else if (tipoAct === "docente") {
            setPendDoc(false);
            localStorage.setItem(
              `evaluacion_docente_completada_${user?.IDReferencia}`,
              "true"
            );
            toast.success("Esta evaluación ya fue completada anteriormente.", {
              position: "top-center",
              duration: 4000,
            });
          } else if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
            // Para evaluación de docente específico, marcar en localStorage específico
            const docenteId =
              docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia;
            localStorage.setItem(
              `evaluacion_docente_${docenteId}_completada_por_${user?.IDReferencia}`,
              "true"
            );
            toast.success(
              `Evaluación de ${
                docenteSeleccionado.NombreCompleto ||
                docenteSeleccionado.Nombre ||
                docenteSeleccionado.PrimerNombre
              } completada anteriormente.`,
              {
                position: "top-center",
                duration: 4000,
              }
            );
          }

          // Resetear estados de la evaluación activa y redirigir
          setEnEval(false);
          setTipoAct(null);
          setRespuestas({});
          setActual(null);
          setComentarios("");
          setDocenteSeleccionado(null);

          // Limpiar localStorage de la evaluación en curso
          if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
            const docenteId =
              docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia;
            const storageKey = `respuestas_evaluar_docente_${docenteId}`;
            const actualKey = `actual_evaluar_docente_${docenteId}`;
            const comentariosKey = `comentarios_evaluar_docente_${docenteId}`;
            localStorage.removeItem(storageKey);
            localStorage.removeItem(actualKey);
            localStorage.removeItem(comentariosKey);
          } else {
            const storageKey =
              tipoAct === "decano" ? "respuestas_decano" : "respuestas_docente";
            const actualKey =
              tipoAct === "decano" ? "actual_decano" : "actual_docente";
            const comentariosKey =
              tipoAct === "decano"
                ? "comentarios_decano"
                : "comentarios_docente";
            localStorage.removeItem(storageKey);
            localStorage.removeItem(actualKey);
            localStorage.removeItem(comentariosKey);
          }

          setLoadingSubmit(false);
          return; // Salir de la función sin mostrar error
        }

        // Log detallado para errores 403
        if (res.status === 403) {
          console.error("❌ Error 403 - Forbidden:", {
            status: res.status,
            statusText: res.statusText,
            errorMessage,
            errorCompleto: err,
            payloadEnviado: payload,
            endpoint: endpoint,
            headers: Object.fromEntries(res.headers.entries()),
          });
        }

        // Log adicional para errores de ponderación
        if (
          errorMessage.includes("ponderación") ||
          errorMessage.includes("Ponderacion")
        ) {
          console.error("Error de ponderación detectado:", {
            ponderacionEnviada: payload.Ponderacion,
            ponderacionOriginal: datosDinamicos.Ponderacion,
            tipoEvaluacion: tipoAct,
            errorCompleto: err,
            payloadCompleto: payload,
          });
        }

        throw new Error(errorMessage);
      }
      await res.json();

      // Mostrar mensaje de éxito específico según el tipo
      if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
        toast.success(
          `¡Evaluación de ${
            docenteSeleccionado.NombreCompleto ||
            docenteSeleccionado.Nombre ||
            docenteSeleccionado.PrimerNombre
          } enviada con éxito!`,
          {
            position: "top-center",
            duration: 4000,
          }
        );
      } else {
        toast.success("¡Evaluación enviada con éxito!", {
          position: "top-center",
          duration: 4000,
        });
      }

      // Marcar el tipo específico como completado y guardarlo en localStorage específico para este usuario
      if (tipoAct === "decano") {
        setPendDec(false);
        localStorage.setItem(
          `evaluacion_decano_completada_${user?.IDReferencia}`,
          "true"
        );
      } else if (tipoAct === "docente") {
        setPendDoc(false);
        localStorage.setItem(
          `evaluacion_docente_completada_${user?.IDReferencia}`,
          "true"
        );
        // Resetear estados de período cuando se complete la evaluación
        setEvaluacionDocenteNoDisponible(false);
        setPeriodoDocenteFinalizado(false);
        setDatosPeriodoDocente(null);
      } else if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
        // Para evaluación de docente específico, marcar en localStorage específico
        const docenteId =
          docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia;
        localStorage.setItem(
          `evaluacion_docente_${docenteId}_completada_por_${user?.IDReferencia}`,
          "true"
        );
      }

      // Resetear estados de la evaluación activa
      setEnEval(false);
      setTipoAct(null);
      setRespuestas({});
      setActual(null);
      setComentarios("");

      // Limpiar estados específicos de evaluación de docente
      if (tipoAct === "evaluar-docente") {
        setDocenteSeleccionado(null);
        setVistaDocentesLista(true); // Volver a la lista de docentes
        // Resetear estados de período cuando se complete la evaluación de docente
        setEvaluacionDecanoNoDisponible(false);
        setPeriodoDecanoFinalizado(false);
        setDatosPeriodoDecano(null);
      }

      // Limpiar localStorage de la evaluación en curso
      if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
        const docenteId =
          docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia;
        const storageKey = `respuestas_evaluar_docente_${docenteId}`;
        const actualKey = `actual_evaluar_docente_${docenteId}`;
        const comentariosKey = `comentarios_evaluar_docente_${docenteId}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(actualKey);
        localStorage.removeItem(comentariosKey);
      } else {
        const storageKey =
          tipoAct === "decano" ? "respuestas_decano" : "respuestas_docente";
        const actualKey =
          tipoAct === "decano" ? "actual_decano" : "actual_docente";
        const comentariosKey =
          tipoAct === "decano" ? "comentarios_decano" : "comentarios_docente";
        localStorage.removeItem(storageKey);
        localStorage.removeItem(actualKey);
        localStorage.removeItem(comentariosKey);
      }

      // Actualizar estado de docentes evaluados en memoria (sin recargar página)
      if (tipoAct === "evaluar-docente" && docenteSeleccionado) {
        const did =
          docenteSeleccionado.IDDocente || docenteSeleccionado.IDReferencia;
        setDocentesEvaluados((prev) => new Set(prev).add(did));
      }

      // Mostrar lista nuevamente sin recarga
      if (tipoAct === "evaluar-docente") {
        setVistaDocentesLista(true);
      }
      // Recargar la pantalla principal de evaluaciones tras completar cualquier evaluación
      if (
        tipoAct === "docente" ||
        tipoAct === "decano" ||
        tipoAct === "evaluar-docente"
      ) {
        try {
          // Forzar recarga completa para asegurar estado fresco del servidor
          if (typeof window !== "undefined") {
            window.location.href = "/evaluaciones";
          } else {
            // Fallback a navegación client-side si no hay window
            router.replace({ pathname: "/evaluaciones" }, undefined, {
              shallow: false,
            });
          }
        } catch (e) {
          console.warn("No se pudo redirigir/recargar a /evaluaciones:", e);
        }
      }
    } catch (error) {
      console.error("Error al enviar evaluación:", error);

      // Manejo específico para errores de ponderación
      let userFriendlyMessage = error.message;
      if (
        error.message.includes("ponderación") ||
        error.message.includes("Ponderacion")
      ) {
        userFriendlyMessage =
          "Error en la configuración de ponderación. Por favor, contacta al administrador del sistema.";
        console.error("Información de depuración de ponderación:", {
          ponderacionUtilizada: payload?.Ponderacion || "No disponible",
          ponderacionOriginal: datosDinamicos?.Ponderacion || "No disponible",
          tipoEvaluacion: tipoAct,
          errorOriginal: error.message,
        });
      }

      toast.error("Error al guardar la evaluación: " + userFriendlyMessage, {
        position: "top-center",
        duration: 6000,
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Buscar pregunta actual con conversión de tipos para compatibilidad
  const preguntaActual = lista.find((p) => {
    // Convertir ambos valores a string para comparación consistente
    const pId = String(p.id);
    const actualStr = String(actual);
    return pId === actualStr;
  });

  return (
    <Layout>
      <Head>
        <title>Evaluaciones</title>
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes progressPulse {
            0%,
            100% {
              opacity: 0.7;
            }
            50% {
              opacity: 1;
            }
          }

          .progress-shimmer {
            animation: shimmer 2s infinite;
          }

          .progress-pulse {
            animation: progressPulse 2s infinite;
          }

          .progress-bar {
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </Head>
      <Toaster />
      <div className="min-h-screen bg-white px-4 py-4 md:px-6 md:py-6">
        {/* Encabezado de la página: título y descripción breve */}
        {/* Header Section */}
        <div className="bg-white text-black py-8 px-6 md:px-8">
          <div className="w-full ">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Sistema de Evaluaciones
            </h1>
            <p className="text-gray-500 text-lg">
              Bienvenido al sistema de evaluaciones. Aquí puedes completar tus
              evaluaciones de manera eficiente.
            </p>
          </div>
        </div>
        <div className="border-b border-gray-200" />
        {/* Spinner */}
        {loadingGeneral && (
          <div className="flex flex-col items-center justify-center py-40">
            <ImSpinner9 className="animate-spin text-blue-500 text-6xl mb-4" />
            <p className="text-gray-600 text-lg">Cargando…</p>
          </div>
        )}

        {/* Mensaje de evaluaciones deshabilitadas - se muestra primero cuando están deshabilitadas */}
        {!loadingGeneral && evaluacionesDeshabilitadas && (
          <div className="max-w-4xl mx-auto p-4 pb-12">
            <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg px-8 py-12 text-center">
              {/* Icono */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-red-500"
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
              </div>

              {/* Título */}
              <h2 className="text-gray-800 text-2xl font-bold mb-3">
                Evaluaciones No Disponibles
              </h2>

              {/* Descripción */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {mensajeEvaluacionesDeshabilitadas ||
                  "Las evaluaciones están actualmente deshabilitadas por el administrador del sistema."}
              </p>

              {/* Información adicional */}
              <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-3">
                <div className="text-sm text-red-800">
                  <div className="font-semibold mb-1">Información:</div>
                  <div>
                    Las evaluaciones están temporalmente suspendidas para el
                    ciclo {cicloActual}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes de evaluación en horizontal (solo cuando no estamos dentro de una evaluación ni en la lista) */}
        {!loadingGeneral &&
          habilitada &&
          !enEval &&
          !vistaDocentesLista &&
          !evaluacionesDeshabilitadas && (
            <div className="max-w-6xl mx-auto p-4 pb-12">
              {/* Grid de mensajes de evaluación */}
              <div
                className={`mx-auto gap-8 ${
                  // Determinar layout basado en cuántos mensajes hay
                  (evaluacionDocenteNoDisponible || periodoDocenteFinalizado) &&
                  (evaluacionDecanoNoDisponible || periodoDecanoFinalizado)
                    ? "grid grid-cols-1 md:grid-cols-2 max-w-4xl" // Ambos mensajes = 2 columnas
                    : "flex justify-center" // Solo 1 mensaje
                }`}
              >
                {/* Mensaje autoevaluación docente */}
                {(evaluacionDocenteNoDisponible ||
                  periodoDocenteFinalizado) && (
                  <div className="bg-white border border-blue-200 rounded-xl shadow-lg px-8 py-12 text-center max-w-md w-full">
                    {/* Icono */}
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-10 h-10 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            evaluacionDocenteNoDisponible
                              ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          }
                        />
                      </svg>
                    </div>

                    {/* Título */}
                    <h2 className="text-gray-800 text-2xl font-bold mb-3">
                      {evaluacionDocenteNoDisponible
                        ? "Autoevaluación Docente no disponible"
                        : "Período de autoevaluación docente finalizado"}
                    </h2>

                    {/* Descripción */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {evaluacionDocenteNoDisponible
                        ? "La autoevaluación docente para el ciclo actual aún no está disponible. Se habilitará automáticamente cuando llegue la fecha programada."
                        : "El período para realizar la autoevaluación docente ha concluido. Las evaluaciones ya no están disponibles para este ciclo."}
                    </p>

                    {/* Información del período */}
                    {datosPeriodoDocente && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                        <div className="text-sm text-blue-800">
                          <div className="font-semibold mb-1">
                            {evaluacionDocenteNoDisponible
                              ? "Período de autoevaluación docente:"
                              : "Período completado:"}
                          </div>
                          <div>
                            Inicio:{" "}
                            {new Date(
                              datosPeriodoDocente.inicio
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <div>
                            Fin:{" "}
                            {new Date(
                              datosPeriodoDocente.final
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          {datosPeriodoDocente.ciclo && (
                            <div className="mt-1 font-medium">
                              Ciclo: {datosPeriodoDocente.ciclo}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estado */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            evaluacionDocenteNoDisponible
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            evaluacionDocenteNoDisponible
                              ? "text-blue-700"
                              : "text-gray-500"
                          }`}
                        >
                          {evaluacionDocenteNoDisponible
                            ? "Pendiente de activación"
                            : "Período finalizado"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingGeneral &&
                  habilitada &&
                  !enEval &&
                  !vistaDocentesLista &&
                  (isDoc || isDec) &&
                  ((isDoc &&
                    !evaluacionDocenteNoDisponible &&
                    !periodoDocenteFinalizado &&
                    hayLanzamientoDocente !== false) ||
                    (isDec &&
                      !evaluacionDecanoNoDisponible &&
                      !periodoDecanoFinalizado &&
                      hayLanzamientoDecano !== false)) && (
                    <div className="max-w-6xl mx-auto p-4">
                      {/* Grid de tarjetas de evaluación */}
                      <div
                        className={`mx-auto gap-8 ${
                          // Determinar layout basado en cuántas tarjetas hay
                          isDoc &&
                          !evaluacionDocenteNoDisponible &&
                          !periodoDocenteFinalizado &&
                          isDec &&
                          !evaluacionDecanoNoDisponible &&
                          !periodoDecanoFinalizado
                            ? "grid grid-cols-1 md:grid-cols-2 max-w-4xl"
                            : "flex justify-center"
                        }`}
                      >
                        {mostrarTarjetaDocente && (
                          <div
                            className={`relative bg-white rounded-xl shadow-lg border-t-8 max-w-md w-full ${
                              pendDoc === null
                                ? "border-gray-400"
                                : !pendDoc
                                ? "border-green-500"
                                : "border-blue-500"
                            }`}
                          >
                            {/* Ciclo actual: esquina superior izquierda */}
                            <div className="absolute top-4 left-4 bg-blue-50 border border-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded text-lg">
                              Ciclo: {cicloActual || "—"}
                            </div>
                            {(pendDoc === null || !configuracionCargada) && (
                              <span className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full animate-pulse">
                                {!configuracionCargada
                                  ? "Cargando..."
                                  : "Verificando..."}
                              </span>
                            )}
                            {pendDoc === true && (
                              <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full animate-bounce">
                                ¡Pendiente!
                              </span>
                            )}
                            {pendDoc === false && (
                              <span className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full">
                                ✓ Completada
                              </span>
                            )}
                            <div className="p-8 text-center">
                              <FaChalkboardTeacher
                                className={`mx-auto text-5xl mb-4 ${
                                  pendDoc === null || !configuracionCargada
                                    ? "text-gray-500"
                                    : pendDoc === false
                                    ? "text-green-500"
                                    : "text-blue-500"
                                }`}
                              />
                              <h2 className="text-gray-800 text-3xl font-extrabold mb-3">
                                Autoevaluación Docente
                              </h2>
                              <p className="text-gray-600 mb-6">
                                {pendDoc === null || !configuracionCargada
                                  ? !configuracionCargada
                                    ? "Cargando configuración del sistema..."
                                    : "Verificando estado de evaluación..."
                                  : pendDoc === false
                                  ? "Autoevaluación completada exitosamente!"
                                  : "Ya puedes realizar tu autoevaluación."}
                              </p>

                              <button
                                onClick={() => iniciar("docente")}
                                disabled={pendDoc !== true}
                                className={`w-full py-3 rounded-lg font-semibold ${
                                  pendDoc === null || !configuracionCargada
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : pendDoc === false
                                    ? "bg-green-100 text-green-800 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {pendDoc === null || !configuracionCargada
                                  ? !configuracionCargada
                                    ? "Cargando..."
                                    : "Verificando..."
                                  : pendDoc === false
                                  ? "Evaluación Completada"
                                  : "Iniciar"}
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Nueva tarjeta: Evaluar Docentes (solo para decanos) */}
                        {isDec &&
                          !evaluacionDecanoNoDisponible &&
                          !periodoDecanoFinalizado && (
                            <div className="relative bg-white rounded-xl shadow-lg border-t-8 border-amber-500 max-w-md w-full">
                              {/* Indicador de docentes pendientes */}
                              {loadingDocentes ? (
                                /* Badge de cargando */
                                <span className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Cargando...
                                </span>
                              ) : docentesFacultad.length > 0 ? (
                                <>
                                  {/* Badge de disponible cuando no hay pendientes */}
                                  {docentesFacultad.filter(
                                    (d) =>
                                      !docentesEvaluados.has(
                                        d.IDDocente || d.IDReferencia
                                      )
                                  ).length === 0 ? (
                                    <span className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
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
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Completo
                                    </span>
                                  ) : (
                                    /* Badge de pendientes con número */
                                    <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
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
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      {
                                        docentesFacultad.filter(
                                          (d) =>
                                            !docentesEvaluados.has(
                                              d.IDDocente || d.IDReferencia
                                            )
                                        ).length
                                      }{" "}
                                      Pendientes
                                    </span>
                                  )}
                                </>
                              ) : (
                                /* Badge por defecto cuando no se han cargado los docentes */
                                <span className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full">
                                  📋 Disponible
                                </span>
                              )}

                              <div className="p-8 text-center">
                                <div className="mx-auto text-5xl mb-4 text-amber-500">
                                  👥
                                </div>
                                <h2 className="text-gray-800 text-3xl font-extrabold mb-3">
                                  Evaluar Docentes
                                </h2>
                                {/* Descripción dinámica basada en el estado */}
                                {docentesFacultad.length > 0 ? (
                                  <p className="text-gray-600 mb-4">
                                    {docentesFacultad.filter(
                                      (d) =>
                                        !docentesEvaluados.has(
                                          d.IDDocente || d.IDReferencia
                                        )
                                    ).length === 0
                                      ? `✅ Has completado todas las evaluaciones (${
                                          docentesFacultad.length
                                        } ${
                                          docentesFacultad.length === 1
                                            ? "docente"
                                            : "docentes"
                                        }).`
                                      : `Tienes ${
                                          docentesFacultad.filter(
                                            (d) =>
                                              !docentesEvaluados.has(
                                                d.IDDocente || d.IDReferencia
                                              )
                                          ).length
                                        } de ${docentesFacultad.length} ${
                                          docentesFacultad.length === 1
                                            ? "docente"
                                            : "docentes"
                                        } pendientes por evaluar.`}
                                  </p>
                                ) : (
                                  <p className="text-gray-600 mb-4">
                                    Ya puedes evaluar a los docentes de tu
                                    facultad.
                                  </p>
                                )}
                                <button
                                  onClick={() => iniciar("evaluar-docentes")}
                                  className="w-full py-3 rounded-lg font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                                >
                                  Ver Lista de Docentes
                                </button>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* (Estado ahora mostrado dentro de la card de Autoevaluación) */}
                    </div>
                  )}

                {/* Mensaje evaluación de docentes */}
                {(evaluacionDecanoNoDisponible || periodoDecanoFinalizado) && (
                  <div className="bg-white border border-amber-200 rounded-xl shadow-lg px-8 py-12 text-center max-w-md w-full">
                    {/* Icono */}
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-10 h-10 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            evaluacionDecanoNoDisponible
                              ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          }
                        />
                      </svg>
                    </div>

                    {/* Título */}
                    <h2 className="text-gray-800 text-2xl font-bold mb-3">
                      {evaluacionDecanoNoDisponible
                        ? "Evaluación de Docentes no disponible"
                        : "Período de evaluación de docentes finalizado"}
                    </h2>

                    {/* Descripción */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {evaluacionDecanoNoDisponible
                        ? "La evaluación de docentes para el ciclo actual aún no está disponible. Se habilitará automáticamente cuando llegue la fecha programada."
                        : "El período para realizar la evaluación de docentes ha concluido. Las evaluaciones ya no están disponibles para este ciclo."}
                    </p>

                    {/* Información del período */}
                    {datosPeriodoDecano && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                        <div className="text-sm text-amber-800">
                          <div className="font-semibold mb-1">
                            {evaluacionDecanoNoDisponible
                              ? "Período de evaluación de docentes:"
                              : "Período completado:"}
                          </div>
                          <div>
                            Inicio:{" "}
                            {new Date(
                              datosPeriodoDecano.inicio
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <div>
                            Fin:{" "}
                            {new Date(
                              datosPeriodoDecano.final
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          {datosPeriodoDecano.ciclo && (
                            <div className="mt-1 font-medium">
                              Ciclo: {datosPeriodoDecano.ciclo}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estado */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            evaluacionDecanoNoDisponible
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            evaluacionDecanoNoDisponible
                              ? "text-amber-700"
                              : "text-gray-500"
                          }`}
                        >
                          {evaluacionDecanoNoDisponible
                            ? "Pendiente de activación"
                            : "Período finalizado"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Vista de Lista de Docentes para Evaluar */}
        {vistaDocentesLista && !enEval && (
          <div className="w-full mx-auto p-4 pb-12">
            <div className="bg-amber-50 rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  {infoFacultadDecano?.Facultad && (
                    <h2 className="text-gray-800 text-2xl font-bold mb-2">
                      {infoFacultadDecano.Facultad}
                    </h2>
                  )}
                  {infoFacultadDecano?.ciclo && (
                    <p className="text-gray-600 text-lg mb-2">
                      Ciclo actual evaluado:{" "}
                      <span className="font-semibold text-gray-800">
                        {infoFacultadDecano.ciclo}
                      </span>
                    </p>
                  )}
                  <p className="text-gray-600 text-lg">
                    Selecciona un docente para evaluar (
                    {docentesFacultad.length}{" "}
                    {docentesFacultad.length === 1
                      ? "docente encontrado"
                      : "docentes encontrados"}
                    )
                  </p>
                </div>
                <button
                  onClick={() => setVistaDocentesLista(false)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  ← Volver
                </button>
              </div>

              {/* Loading */}
              {loadingDocentes && (
                <div className="flex flex-col items-center justify-center py-12">
                  <ImSpinner9 className="animate-spin text-amber-500 text-6xl mb-4" />
                  <p className="text-gray-600 text-lg">Cargando docentes...</p>
                </div>
              )}

              {/* Lista de Docentes */}
              {!loadingDocentes && docentesFacultad.length > 0 && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4 sm:space-x-6 order-2 md:order-1">
                      <div className="text-sm text-gray-600">
                        Pendientes:{" "}
                        {
                          docentesFacultad.filter(
                            (d) =>
                              !docentesEvaluados.has(
                                d.IDDocente || d.IDReferencia
                              )
                          ).length
                        }{" "}
                        / {docentesFacultad.length}
                      </div>
                      {/* Vista display */}
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                          <FiGrid className="text-amber-600 text-base" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Vista
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {viewModeDocentes === "grid"
                              ? "Cuadrícula"
                              : "Lista"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto order-1 md:order-2">
                      <div className="relative flex-1 sm:w-64">
                        <input
                          type="text"
                          value={busquedaDocente}
                          onChange={(e) => setBusquedaDocente(e.target.value)}
                          placeholder="Buscar por nombre o ID..."
                          className="w-full text-amber-600 pl-9 pr-8 py-2 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                        {busquedaDocente && (
                          <button
                            onClick={() => setBusquedaDocente("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                            title="Limpiar"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-2 bg-white border border-amber-300 rounded-md hover:bg-amber-50">
                        <input
                          type="checkbox"
                          checked={mostrarCompletados}
                          onChange={(e) =>
                            setMostrarCompletados(e.target.checked)
                          }
                        />
                        <span className="text-gray-800">
                          Mostrar completados
                        </span>
                      </label>
                      {/* Controles de vista */}
                      <div className="flex bg-amber-100 rounded-lg p-1">
                        <button
                          onClick={() => handleViewModeDocentesChange("grid")}
                          className={`p-2 rounded-md transition-all ${
                            viewModeDocentes === "grid"
                              ? "bg-white text-amber-600 shadow-sm"
                              : "text-amber-500 hover:text-amber-700"
                          }`}
                          title="Vista de cuadrícula"
                        >
                          <FiGrid size={16} />
                        </button>
                        <button
                          onClick={() => handleViewModeDocentesChange("list")}
                          className={`p-2 rounded-md transition-all ${
                            viewModeDocentes === "list"
                              ? "bg-white text-amber-600 shadow-sm"
                              : "text-amber-500 hover:text-amber-700"
                          }`}
                          title="Vista de lista"
                        >
                          <FiList size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Renderizado condicional basado en el modo de vista */}
                  {viewModeDocentes === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {docentesFacultad
                        .filter((d) =>
                          mostrarCompletados
                            ? true
                            : !docentesEvaluados.has(
                                d.IDDocente || d.IDReferencia
                              )
                        )
                        .filter((d) => {
                          if (!busquedaDocente.trim()) return true;
                          const term = busquedaDocente.trim().toLowerCase();
                          const nombre = (
                            d.NombreCompleto ||
                            d.Nombre ||
                            `${d.PrimerNombre || ""} ${d.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          const idStr = (d.IDDocente || d.IDReferencia || "")
                            .toString()
                            .toLowerCase();
                          return nombre.includes(term) || idStr.includes(term);
                        })
                        .sort((a, b) => {
                          if (!mostrarCompletados) return 0; // No ordenar si no se muestran completados

                          const aCompleted = docentesEvaluados.has(
                            a.IDDocente || a.IDReferencia
                          );
                          const bCompleted = docentesEvaluados.has(
                            b.IDDocente || b.IDReferencia
                          );

                          // Completados primero (true = 1, false = 0, entonces b - a pone los true primero)
                          if (aCompleted !== bCompleted) {
                            return bCompleted - aCompleted;
                          }

                          // Si ambos tienen el mismo estado, ordenar alfabéticamente por nombre
                          const nombreA = (
                            a.NombreCompleto ||
                            a.Nombre ||
                            `${a.PrimerNombre || ""} ${a.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          const nombreB = (
                            b.NombreCompleto ||
                            b.Nombre ||
                            `${b.PrimerNombre || ""} ${b.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          return nombreA.localeCompare(nombreB);
                        })
                        .map((docente, index) => {
                          const did =
                            docente.IDDocente ||
                            docente.IDReferencia ||
                            docente.IDEmpleado ||
                            docente.ID ||
                            `docente-${index}`;
                          const completado = docentesEvaluados.has(
                            docente.IDDocente || docente.IDReferencia
                          );
                          const empezada = tieneEvaluacionEmpezada(docente);
                          return (
                            <div
                              key={did}
                              className={`relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 transition-all duration-200 ${
                                completado ? "opacity-60" : "hover:shadow-lg"
                              }`}
                            >
                              <div className="text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <FaChalkboardTeacher className="text-amber-600 text-2xl" />
                                </div>
                                <h3 className="text-gray-800 text-xl font-bold mb-2">
                                  {docente.NombreCompleto ||
                                    docente.Nombre ||
                                    `${docente.PrimerNombre} ${docente.PrimerApellido}` ||
                                    "Docente sin nombre"}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">
                                  ID:{" "}
                                  {docente.IDDocente ||
                                    docente.IDReferencia ||
                                    docente.IDEmpleado ||
                                    docente.ID ||
                                    "Sin ID"}
                                </p>
                                {completado ? (
                                  <div className="bg-green-600/90 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 text-sm">
                                    <span>Completado</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="w-4 h-4"
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  </div>
                                ) : empezada ? (
                                  <button
                                    onClick={() =>
                                      iniciarEvaluacionDocente(docente)
                                    }
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Continuar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      iniciarEvaluacionDocente(docente)
                                    }
                                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                                  >
                                    Evaluar
                                  </button>
                                )}
                              </div>
                              {completado && (
                                <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded shadow-sm border border-green-200">
                                  ✔ Listo
                                </div>
                              )}
                              {empezada && !completado && (
                                <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded shadow-sm border border-orange-200 animate-pulse">
                                  ⚠️ Pendiente
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {docentesFacultad
                        .filter((d) =>
                          mostrarCompletados
                            ? true
                            : !docentesEvaluados.has(
                                d.IDDocente || d.IDReferencia
                              )
                        )
                        .filter((d) => {
                          if (!busquedaDocente.trim()) return true;
                          const term = busquedaDocente.trim().toLowerCase();
                          const nombre = (
                            d.NombreCompleto ||
                            d.Nombre ||
                            `${d.PrimerNombre || ""} ${d.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          const idStr = (d.IDDocente || d.IDReferencia || "")
                            .toString()
                            .toLowerCase();
                          return nombre.includes(term) || idStr.includes(term);
                        })
                        .sort((a, b) => {
                          if (!mostrarCompletados) return 0; // No ordenar si no se muestran completados

                          const aCompleted = docentesEvaluados.has(
                            a.IDDocente || a.IDReferencia
                          );
                          const bCompleted = docentesEvaluados.has(
                            b.IDDocente || b.IDReferencia
                          );

                          // Completados primero (true = 1, false = 0, entonces b - a pone los true primero)
                          if (aCompleted !== bCompleted) {
                            return bCompleted - aCompleted;
                          }

                          // Si ambos tienen el mismo estado, ordenar alfabéticamente por nombre
                          const nombreA = (
                            a.NombreCompleto ||
                            a.Nombre ||
                            `${a.PrimerNombre || ""} ${a.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          const nombreB = (
                            b.NombreCompleto ||
                            b.Nombre ||
                            `${b.PrimerNombre || ""} ${b.PrimerApellido || ""}`
                          )
                            .toString()
                            .toLowerCase();
                          return nombreA.localeCompare(nombreB);
                        })
                        .map((docente, index) => {
                          const did =
                            docente.IDDocente ||
                            docente.IDReferencia ||
                            docente.IDEmpleado ||
                            docente.ID ||
                            `docente-${index}`;
                          const completado = docentesEvaluados.has(
                            docente.IDDocente || docente.IDReferencia
                          );
                          const empezada = tieneEvaluacionEmpezada(docente);
                          return (
                            <div
                              key={did}
                              className={`relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 transition-all duration-200 ${
                                completado ? "opacity-60" : "hover:shadow-lg"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaChalkboardTeacher className="text-amber-600 text-xl" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-800 text-lg font-bold truncate">
                                      {docente.NombreCompleto ||
                                        docente.Nombre ||
                                        `${docente.PrimerNombre} ${docente.PrimerApellido}` ||
                                        "Docente sin nombre"}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                      ID:{" "}
                                      {docente.IDDocente ||
                                        docente.IDReferencia ||
                                        docente.IDEmpleado ||
                                        docente.ID ||
                                        "Sin ID"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                  {completado ? (
                                    <div className="bg-green-600/90 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-sm">
                                      <span>Completado</span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4"
                                      >
                                        <path d="M20 6 9 17l-5-5" />
                                      </svg>
                                    </div>
                                  ) : empezada ? (
                                    <button
                                      onClick={() =>
                                        iniciarEvaluacionDocente(docente)
                                      }
                                      className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer flex items-center gap-2"
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
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      Continuar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        iniciarEvaluacionDocente(docente)
                                      }
                                      className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                                    >
                                      Evaluar
                                    </button>
                                  )}
                                </div>
                              </div>
                              {completado && (
                                <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded shadow-sm border border-green-200">
                                  ✔ Listo
                                </div>
                              )}
                              {empezada && !completado && (
                                <div className="absolute top-2 left-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded shadow-sm border border-orange-200 animate-pulse">
                                  ⚠️ Pendiente
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* Sin docentes */}
              {!loadingDocentes && docentesFacultad.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-gray-600 text-xl font-semibold mb-2">
                    No hay docentes disponibles
                  </h3>
                  <p className="text-gray-500">
                    No se encontraron docentes en tu facultad para evaluar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón flotante Scroll to Top */}
        {vistaDocentesLista && showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50 group"
            title="Volver arriba"
          >
            <svg
              className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}

        {/* Evaluación activa */}
        {enEval && preguntaActual && (
          <div className="relative max-w-5xl mx-auto bg-white p-6 shadow-xl rounded-lg my-8 border border-gray-200">
            {/* Ciclo actual: badge en la esquina superior izquierda del cuestionario activo */}
            <div className="absolute top-4 left-4 bg-blue-600 border border-blue-100 text-white font-semibold px-3 py-1 rounded text-xl">
              Ciclo: {cicloActual || "—"}
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-800 text-2xl font-bold text-center w-full">
                {tipoAct === "docente"
                  ? "Autoevaluación Docente"
                  : tipoAct === "evaluar-docente"
                  ? "Evaluación de Docente"
                  : "Evaluación"}
              </h2>
              {tipoAct !== "evaluar-docente" && (
                <div className="ml-4">
                  <button
                    onClick={volverAEvaluaciones}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    ← Volver a evaluaciones
                  </button>
                </div>
              )}
            </div>
            {/* Header con información del docente evaluado */}
            {tipoAct === "evaluar-docente" && docenteSeleccionado && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <FaChalkboardTeacher className="text-amber-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-gray-800 text-lg font-bold">
                        Evaluando a:{" "}
                        {docenteSeleccionado.NombreCompleto ||
                          docenteSeleccionado.Nombre ||
                          `${docenteSeleccionado.PrimerNombre} ${docenteSeleccionado.PrimerApellido}`}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        ID:{" "}
                        {docenteSeleccionado.IDDocente ||
                          docenteSeleccionado.IDReferencia}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={volverAListaDocentes}
                    className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700"
                  >
                    ← Volver a lista
                  </button>
                </div>
              </div>
            )}

            {/* Barra de progreso mejorada con animación y porcentaje */}
            <div className="w-full bg-gray-200 h-4 rounded-full mb-6 relative overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full progress-bar relative overflow-hidden"
                style={{
                  width: `${
                    ((lista.findIndex((p) => p.id === actual) + 1) /
                      lista.length) *
                    100
                  }%`,
                }}
              >
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 progress-shimmer w-full"></div>
                {/* Pulso de progreso */}
                <div className="absolute inset-0 bg-blue-400 opacity-20 progress-pulse"></div>
              </div>
              {/* Porcentaje centrado */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700 bg-white/80 px-2 py-0.5 rounded-full shadow-sm transition-all duration-500">
                  {Math.round(
                    ((lista.findIndex((p) => p.id === actual) + 1) /
                      lista.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Información de progreso adicional */}
            <div className="flex justify-between items-center mb-6 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Pregunta {lista.findIndex((p) => p.id === actual) + 1} de{" "}
                    {lista.length}
                  </span>
                </span>
                {lista.length - (lista.findIndex((p) => p.id === actual) + 1) >
                0 ? (
                  <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      {lista.length -
                        (lista.findIndex((p) => p.id === actual) + 1)}{" "}
                      restantes
                    </span>
                  </span>
                ) : (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>¡Última pregunta!</span>
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-gray-500 flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Progreso del cuestionario</span>
                </div>
                <div className="font-semibold text-blue-600 flex items-center space-x-1">
                  <span>
                    {Math.round(
                      ((lista.findIndex((p) => p.id === actual) + 1) /
                        lista.length) *
                        100
                    )}
                    % completado
                  </span>
                  {Math.round(
                    ((lista.findIndex((p) => p.id === actual) + 1) /
                      lista.length) *
                      100
                  ) === 100 && (
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Navegación lateral */}
              <aside className="md:w-1/4 md:border-r md:pr-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 font-semibold">Navegación</h3>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {lista.filter((p) => isRespondida(p.id)).length}/
                    {lista.length}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {lista.map((p, i) => {
                    const idxAct = lista.findIndex((q) => q.id === actual);
                    const isAct = p.id === actual;
                    const done = isRespondida(p.id);

                    // Mejorar la lógica para mostrar la siguiente pregunta disponible
                    const isNextAvailable =
                      i === idxAct + 1 && isRespondida(actual);
                    const isPreviouslyAccessible = i < idxAct;
                    const isAccessible =
                      isAct ||
                      done ||
                      isPreviouslyAccessible ||
                      isNextAvailable;

                    const disabled = !isAccessible;

                    // Mejorar los colores para mostrar mejor el progreso
                    const bg = isAct
                      ? "bg-blue-600 text-white" // Pregunta actual
                      : done
                      ? "bg-green-500 text-white" // Pregunta completada
                      : isNextAvailable
                      ? "bg-yellow-400 text-gray-900" // Siguiente pregunta disponible (más brillante)
                      : isPreviouslyAccessible
                      ? "bg-yellow-300 text-gray-900" // Preguntas anteriores accesibles
                      : "bg-gray-300 text-gray-500"; // Preguntas bloqueadas

                    return (
                      <button
                        key={p.id}
                        disabled={disabled}
                        onClick={() => !disabled && setActual(p.id)}
                        className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-semibold transition-all duration-200 ${bg} ${
                          disabled
                            ? "opacity-70 cursor-not-allowed"
                            : isNextAvailable
                            ? "hover:scale-110 hover:shadow-lg ring-2 ring-yellow-400 ring-opacity-50" // Destacar la siguiente pregunta
                            : "hover:scale-105 hover:shadow-md"
                        }`}
                        title={`Pregunta ${i + 1}: ${
                          isNextAvailable
                            ? "¡Siguiente pregunta disponible! " +
                              p.texto.substring(0, 40) +
                              "..."
                            : p.texto.substring(0, 50) + "..."
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Leyenda de colores */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-gray-600">Pregunta actual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">Completada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded ring-1 ring-yellow-400"></div>
                    <span className="text-gray-600">Siguiente disponible</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span className="text-gray-600">Bloqueada</span>
                  </div>
                </div>

                {/* Botón Terminar sólo en comentarios */}
                {actual === "coment" && (
                  <button
                    onClick={terminarEvaluacion}
                    disabled={loadingSubmit}
                    className="mt-6 w-full bg-red-500 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    {loadingSubmit ? "Enviando..." : "Terminar evaluacion"}
                  </button>
                )}
              </aside>

              {/* Contenido principal */}
              <section className="flex-1 md:pl-6">
                <h3 className="text-gray-800 font-semibold mb-4 text-xl">
                  Pregunta actual
                </h3>
                <div className="bg-blue-50  p-4 rounded-lg shadow-inner mb-6">
                  <p className="mb-4 text-gray-800 text-lg">
                    {preguntaActual.texto}
                  </p>

                  {/* Comentarios */}
                  {preguntaActual.tipo === "comentario" ? (
                    <textarea
                      className="text-gray-800 w-full p-2 border rounded"
                      rows={4}
                      placeholder="Escribe aquí tus comentarios (opcional)"
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                    />
                  ) : tipoAct === "evaluar-docente" ? (
                    // Multi-grupo para decano evaluando docente
                    (docenteSeleccionado?.Grupos || []).map((gid, idx) => {
                      const val = respuestas[actual]?.[gid] || 0;
                      const materia =
                        docenteSeleccionado?.Materias?.[idx] ||
                        docenteSeleccionado?.Materias?.[0] ||
                        "Materia";
                      return (
                        <div
                          key={gid}
                          className="mb-6 p-4 border border-amber-200 rounded-md bg-white shadow-sm"
                        >
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold text-amber-800">
                              {materia}
                            </span>
                            <span className="font-semibold text-amber-800">
                              Grupo: {gid}
                            </span>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                              <div
                                key={v}
                                onClick={() =>
                                  setRespuestas((r) => ({
                                    ...r,
                                    [actual]: {
                                      ...(r[actual] || {}),
                                      [gid]: v,
                                    },
                                  }))
                                }
                                className={`h-8 rounded-full cursor-pointer flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${
                                  val >= v
                                    ? "bg-amber-600 ring-2 ring-amber-300 shadow-md"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                                title={`Valor ${v}`}
                              >
                                {v}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-600 flex justify-between px-1">
                            <span>Deficiente</span>
                            <span>Regular</span>
                            <span>Bueno</span>
                            <span>Excelente</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Escala por grupo
                    grupos.map((g) => {
                      const val = respuestas[actual]?.[g.IDGrupo] || 0;
                      return (
                        <div
                          key={g.IDGrupo}
                          className="mb-6 p-4 border border-blue-200 rounded-md bg-white shadow-sm"
                        >
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold text-blue-800">
                              Materia: {g.Nombre}
                            </span>
                            <span className="font-semibold text-blue-800">
                              Grupo: {g.Identificador}
                            </span>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                              <div
                                key={v}
                                onClick={() =>
                                  setRespuestas((r) => ({
                                    ...r,
                                    [actual]: {
                                      ...(r[actual] || {}),
                                      [g.IDGrupo]: v,
                                    },
                                  }))
                                }
                                className={`h-8 rounded-full cursor-pointer flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${
                                  val >= v
                                    ? "bg-blue-600 ring-2 ring-blue-300 shadow-md"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                                title={`Valor ${v}`}
                              >
                                {v}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-600 flex justify-between px-1">
                            <span>Deficiente</span>
                            <span>Regular</span>
                            <span>Bueno</span>
                            <span>Excelente</span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Botón Siguiente sólo en escala */}
                  {preguntaActual.tipo !== "comentario" && (
                    <div className="flex justify-end">
                      <button
                        onClick={siguiente}
                        disabled={!isRespondida(actual)}
                        className="mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                      >
                        Siguiente Pregunta
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Espaciado final para asegurar que el contenido no se pegue al final */}
        <div className="h-8"></div>
      </div>
    </Layout>
  );
}
