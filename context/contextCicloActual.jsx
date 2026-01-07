import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/router";

const CicloActualContext = createContext();

export function CicloActualProvider({ children }) {
  const [cicloActual, setCicloActual] = useState(null);
  const [loadingCiclo, setLoadingCiclo] = useState(true);
  const [errorCiclo, setErrorCiclo] = useState(null);
  const cicloLoaded = useRef(false);
  const router = useRouter();

  // Función para obtener el ciclo actual dinámicamente
  const obtenerCicloActual = useCallback(
    async (gruposDisponibles = [], groupId = null) => {
      // Solo hacer peticiones si NO estamos en la página de login
      if (router.pathname === "/") {
        // console.log("🚫 No cargar ciclo en página de login");
        setLoadingCiclo(false);
        return null;
      }

      try {
        // console.log("🔄 Iniciando petición para obtener ciclo actual...");
        setLoadingCiclo(true);
        setErrorCiclo(null);
        cicloLoaded.current = true; // Marcar como intentado

        const NEXT_PUBLIC_CICLO_ACTUAL = process.env.NEXT_PUBLIC_CICLO_ACTUAL;

        const response = await fetch(NEXT_PUBLIC_CICLO_ACTUAL, {
          credentials: "include",
        });

        // console.log("📡 Respuesta del servidor para ciclo:", response.status);

        if (!response.ok) {
          const errorMsg = `Error al obtener ciclo actual: ${response.status}`;
          console.error(errorMsg);
          setErrorCiclo(errorMsg);

          // intentar obtener ciclo de los grupos disponibles
          if (gruposDisponibles.length > 0 && groupId) {
            const grupo = gruposDisponibles.find(
              (g) => g.IDGrupo.toString() === groupId.toString()
            );
            if (grupo?.Ciclo) {
              setCicloActual(grupo.Ciclo);
              return grupo.Ciclo;
            }
          }
          return null;
        }

        const data = await response.json();
        // console.log("📋 Datos recibidos del ciclo:", data);

        if (data.ok && data.cicloActual) {
          // console.log(
          //   "✅ Ciclo actual obtenido exitosamente:",
          //   data.cicloActual
          // );
          setCicloActual(data.cicloActual);
          setErrorCiclo(null);
          return data.cicloActual;
        } else {
          const errorMsg = "Respuesta inválida del ciclo actual";
          console.warn("⚠️", errorMsg, data);
          setErrorCiclo(errorMsg);

          // Fallback: intentar obtener ciclo de los grupos disponibles
          if (gruposDisponibles.length > 0 && groupId) {
            const grupo = gruposDisponibles.find(
              (g) => g.IDGrupo.toString() === groupId.toString()
            );
            if (grupo?.Ciclo) {
              setCicloActual(grupo.Ciclo);
              return grupo.Ciclo;
            }
          }
          return null;
        }
      } catch (error) {
        const errorMsg = "Error de conexión al obtener ciclo actual";
        console.error("❌", errorMsg, error);
        setErrorCiclo(errorMsg);

        // Fallback: intentar obtener ciclo de los grupos disponibles
        if (gruposDisponibles.length > 0 && groupId) {
          // console.log("🔄 Intentando fallback con grupos disponibles");
          const grupo = gruposDisponibles.find(
            (g) => g.IDGrupo.toString() === groupId.toString()
          );
          if (grupo?.Ciclo) {
            setCicloActual(grupo.Ciclo);
            return grupo.Ciclo;
          }
        }
        return null;
      } finally {
        // console.log("🏁 Finalizando carga de ciclo - loadingCiclo será false");
        setLoadingCiclo(false);
      }
    },
    [router.pathname]
  );

  // Función para establecer el ciclo actual manualmente (fallback)
  const setCicloActualFallback = useCallback((ciclo) => {
    setCicloActual(ciclo);
    setErrorCiclo(null);
    setLoadingCiclo(false);
  }, []);

  // Función para refrescar el ciclo actual
  const refrescarCicloActual = useCallback(
    async (gruposDisponibles = [], groupId = null) => {
      cicloLoaded.current = false;
      return await obtenerCicloActual(gruposDisponibles, groupId);
    },
    [obtenerCicloActual]
  );

  // Cargar el ciclo actual al montar el componente y cuando cambia la ruta
  useEffect(() => {
    const shouldLoadCycle = router.pathname !== "/" && !cicloLoaded.current;

    if (shouldLoadCycle) {
      // console.log(
      //   "🔄 Iniciando carga de ciclo actual para ruta:",
      //   router.pathname
      // );
      obtenerCicloActual();
    } else if (router.pathname === "/") {
      // Si estamos en login, resetear todo para permitir carga en próxima navegación
      // console.log("🏠 En página de login - reseteando estado del ciclo");
      setLoadingCiclo(false);
      setCicloActual(null);
      setErrorCiclo(null);
      cicloLoaded.current = false; // Permitir carga cuando salga del login
    }
  }, [router.pathname, obtenerCicloActual]);

  // Efecto adicional para forzar carga si no se ha cargado después de un tiempo
  useEffect(() => {
    if (
      router.pathname !== "/" &&
      !cicloActual &&
      !loadingCiclo &&
      !errorCiclo
    ) {
      const timeoutId = setTimeout(() => {
        if (!cicloLoaded.current) {
          // console.log("⏰ Forzando carga de ciclo después de timeout");
          obtenerCicloActual();
        }
      }, 1000); // Esperar 1 segundo antes de forzar

      return () => clearTimeout(timeoutId);
    }
  }, [
    router.pathname,
    cicloActual,
    loadingCiclo,
    errorCiclo,
    obtenerCicloActual,
  ]);

  return (
    <CicloActualContext.Provider
      value={{
        cicloActual,
        loadingCiclo,
        errorCiclo,
        obtenerCicloActual,
        setCicloActualFallback,
        setCicloActual,
        refrescarCicloActual,
      }}
    >
      {children}
    </CicloActualContext.Provider>
  );
}

export function useCicloActual() {
  const context = useContext(CicloActualContext);
  if (!context) {
    throw new Error(
      "useCicloActual debe ser usado dentro de un CicloActualProvider"
    );
  }
  return context;
}
