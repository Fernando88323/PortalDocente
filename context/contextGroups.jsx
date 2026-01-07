import React, { createContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useCicloActual } from "./contextCicloActual";

const GruposContext = createContext(null);

export function GruposProvider({ children }) {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(false); // Estado para manejar el error
  const [noCicloDisponible, setNoCicloDisponible] = useState(false); // Estado para cuando no hay ciclo
  const [loading, setLoading] = useState(true);
  const [datosYaCargados, setDatosYaCargados] = useState(false); // Nuevo estado para evitar cargas duplicadas
  const [IDDocente, setidDocente] = useState(null);
  const [IDGrupo, setidGrupo] = useState(null);
  const [facultad, setFacultad] = useState(null);
  const [NombreMateria, setidNombreMateria] = useState("");

  // Usar el ciclo actual del contexto
  const { cicloActual, loadingCiclo } = useCicloActual();

  const router = useRouter();

  // Efecto para resetear el estado cuando cambia la ruta
  useEffect(() => {
    if (router.pathname === "/") {
      // console.log("🏠 En login - reseteando estado de grupos");
      setLoading(false);
      setDatosYaCargados(true); // Marcar como cargado para evitar intentos en login
      setGrupos([]);
      setNoCicloDisponible(false);
      setError(false);
      return;
    } else {
      // Si no estamos en login, permitir nueva carga
      // console.log(
      //   "🌐 Navegando a:",
      //   router.pathname,
      //   "- permitiendo carga de grupos"
      // );
      setDatosYaCargados(false);
    }
  }, [router.pathname]);

  // Efecto principal para cargar datos
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchData = async () => {
      try {
        setError(false); // Reseteamos el error al iniciar la llamada

        // No hacer peticiones si estamos en la página de login
        if (router.pathname === "/") {
          // console.log("🚫 No cargar grupos en página de login");
          setLoading(false);
          return;
        }

        // Si ya cargamos los datos exitosamente, no volver a cargar
        if (datosYaCargados && grupos.length > 0) {
          // console.log("✅ Datos ya cargados, evitando recarga innecesaria");
          return;
        }

        // Verificar estado del ciclo
        if (loadingCiclo) {
          // Si aún está cargando el ciclo, mantener loading y esperar
          // console.log(
          //   "⏳ Esperando ciclo actual - loadingCiclo:",
          //   loadingCiclo,
          //   "cicloActual:",
          //   cicloActual
          // );
          return;
        }

        // Si ya terminó de cargar pero no hay cicloActual, no proceder con la carga
        if (!cicloActual) {
          // console.log(
          //   "⚠️ No hay ciclo actual disponible, no se cargarán grupos"
          // );
          setLoading(false);
          setNoCicloDisponible(true); // Marcar que no hay ciclo disponible
          setError(false); // No es un error técnico, solo falta de ciclo
          setDatosYaCargados(true); // Marcar como "procesado" para evitar reintentos
          return;
        }

        // Si llegamos aquí, tenemos ciclo y podemos proceder
        // console.log("🚀 Iniciando carga de grupos con ciclo:", cicloActual);
        setLoading(true); // Asegurar que loading esté en true mientras cargamos
        setNoCicloDisponible(false);
        setError(false);

        // console.log("Ciclo actual disponible:", cicloActual);

        // Obtener el ID del docente a través de la ruta protegida.
        const NEXT_PUBLIC_DASHBOARD_PROTECTED_GRUPOS =
          process.env.NEXT_PUBLIC_DASHBOARD_PROTECTED_GRUPOS;
        const idDocenteResponse = await fetch(
          `${NEXT_PUBLIC_DASHBOARD_PROTECTED_GRUPOS}`,
          {
            method: "GET",
            credentials: "include", // Se envía la cookie con el token
            signal,
          }
        );

        if (idDocenteResponse.status === 401) {
          // Intentamos extraer el mensaje de error en formato JSON
          const errorData = await idDocenteResponse.json();
          const errorMessage =
            errorData.error ||
            "No estás autorizado. Redirigiendo a la página de inicio...";
          toast.error(errorMessage);
          setTimeout(() => {
            router.push("/");
          }, 3000);
          return;
        }

        if (!idDocenteResponse.ok) {
          // Para otros errores usamos el mensaje que envía el backend
          const errorData = await idDocenteResponse.json();
          throw new Error(
            errorData.error || "Error al obtener el ID del Docente protegido"
          );
        }

        const dataID = await idDocenteResponse.json();
        // console.log("dataID: ", dataID);
        setidDocente(dataID.IDReferencia);
        if (!dataID?.IDReferencia) {
          throw new Error("El ID del docente no está disponible");
        }

        // Obtener los grupos del docente a través de otro endpoint.
        const NEXT_PUBLIC_GRUPOS = process.env.NEXT_PUBLIC_GRUPOS;
        // console.log("Ciclo actual antes de la petición:", cicloActual);
        const gruposResponse = await fetch(`${NEXT_PUBLIC_GRUPOS}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            iddocente: dataID.IDReferencia,
            ciclo: cicloActual, // usar cicloActual directamente (ya verificado que existe)
          }),
          signal,
        });
        // console.log("Ciclo enviado en la petición:", cicloActual);

        if (gruposResponse.status === 401) {
          const errorData = await gruposResponse.json();
          const errorMessage =
            errorData.error ||
            "No estás autorizado. Redirigiendo a la página de inicio...";
          toast.error(errorMessage);
          setTimeout(() => {
            router.push("/");
          }, 3000);
          return;
        }

        if (!gruposResponse.ok) {
          const errorData = await gruposResponse.json();
          throw new Error(errorData.error || "Error al obtener los grupos");
        }

        const data = await gruposResponse.json();
        // console.log("📋 Datos de grupos recibidos:", data);

        setGrupos(data.data || []);
        setidGrupo(data.data.map((grupo) => grupo.IDGrupo)); // Mapeo de arreglos para obtencion de IDs
        setidNombreMateria(
          data.data.map((NombreMateria) => NombreMateria.Nombre)
        ); // Mapeo de arreglos para obtencion de Nombre de materia
        setFacultad(data.data.map((Facultad) => Facultad.Facultad)); // Mapeo de arreglos para obtencion de Facultad

        // Marcar que los datos se cargaron exitosamente
        setDatosYaCargados(true);
        // console.log(
        //   "🎉 Grupos cargados exitosamente:",
        //   data.data?.length || 0,
        //   "grupos encontrados"
        // );
        // toast.success("Grupos cargados exitosamente!");
      } catch (error) {
        if (error.name !== "AbortError") {
          // console.error("Error al obtener datos:", error);
          setError(true); // Si hay un error, se activa el estado de error
          toast.error(error.message || "Error al obtener los grupos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [cicloActual, loadingCiclo, datosYaCargados, grupos.length]); // Dependencias optimizadas

  // Efecto adicional para garantizar carga cuando el ciclo esté disponible
  useEffect(() => {
    // Condiciones para forzar carga:
    // 1. No estamos cargando el ciclo
    // 2. Tenemos ciclo disponible
    // 3. No hemos cargado datos aún
    // 4. No estamos en login
    // 5. No tenemos grupos cargados
    const shouldForceLoad =
      !loadingCiclo &&
      cicloActual &&
      !datosYaCargados &&
      router.pathname !== "/" &&
      grupos.length === 0 &&
      !loading;

    if (shouldForceLoad) {
      // console.log(
      //   "🔄 Forzando carga de grupos - todas las condiciones cumplidas"
      // );
      // console.log("Condiciones:", {
      //   loadingCiclo,
      //   cicloActual,
      //   datosYaCargados,
      //   pathname: router.pathname,
      //   gruposLength: grupos.length,
      //   loading,
      // });
      setDatosYaCargados(false); // Resetear para permitir nueva carga
    }
  }, [
    loadingCiclo,
    cicloActual,
    datosYaCargados,
    grupos.length,
    router.pathname,
    loading,
  ]);

  // Efecto que se ejecuta específicamente cuando cambia loadingCiclo de true a false
  useEffect(() => {
    // Si acaba de terminar de cargar el ciclo y estamos en una página que no es login
    if (!loadingCiclo && router.pathname !== "/") {
      // console.log(
      //   "🔔 Ciclo terminó de cargar, verificando si necesitamos cargar grupos"
      // );
      // console.log("Estado actual:", {
      //   cicloActual,
      //   datosYaCargados,
      //   gruposLength: grupos.length,
      //   pathname: router.pathname,
      // });

      // Si tenemos ciclo y no hemos cargado grupos, forzar carga
      if (cicloActual && !datosYaCargados && grupos.length === 0) {
        // console.log("🚀 Activando carga de grupos después de obtener ciclo");
        // Pequeño delay para asegurar que el estado se haya actualizado
        setTimeout(() => {
          setDatosYaCargados(false);
        }, 100);
      }
    }
  }, [loadingCiclo]); // Solo depende de loadingCiclo para detectar cuando cambie

  const value = useMemo(
    () => ({
      grupos,
      setGrupos,
      grupoSeleccionado,
      setGrupoSeleccionado,
      busqueda,
      setBusqueda,
      error,
      setError,
      noCicloDisponible,
      setNoCicloDisponible,
      loading,
      setLoading,
      datosYaCargados, // Exponer el nuevo estado
      setDatosYaCargados,
      IDDocente,
      setidDocente,
      IDGrupo,
      setidGrupo,
      NombreMateria,
      setidNombreMateria,
      setFacultad,
      facultad,
      cicloActual, // Exponer cicloActual en lugar de ciclo
    }),
    [
      grupos,
      grupoSeleccionado,
      busqueda,
      error,
      noCicloDisponible,
      loading,
      datosYaCargados, // Agregar a las dependencias
      IDDocente,
      IDGrupo,
      NombreMateria,
      facultad,
      cicloActual, // Usar cicloActual en las dependencias
    ]
  );

  return (
    <GruposContext.Provider value={value}>{children}</GruposContext.Provider>
  );
}

export function useGrupos() {
  const context = React.useContext(GruposContext);
  if (!context) {
    throw new Error("useGrupos debe estar dentro del proveedor GruposContext");
  }
  return context;
}
