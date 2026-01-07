// context/contextEstudiantes.js
import React, { createContext, useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useGrupos } from "./contextGroups";
import { useRouter } from "next/router";

const EstudiantesContext = createContext(null);

export function EstudiantesProvider({ children }) {
  const { grupoSeleccionado, grupos, cicloActual } = useGrupos();
  const router = useRouter();

  // Estado para estudiantes para NOTAS (GET)
  const [estudiantes, setEstudiantes] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  // Estado para estudiantes para REPORTES (POST)
  const [estudiantesReporte, setEstudiantesReporte] = useState([]);
  const [loadingReporte, setLoadingReporte] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [errorMsg, setErrorMsg] = useState(false);

  // Estaos para TODOS los estudiantes de TODOS los grupos del usuario
  const [todosLosEstudiantes, setTodosLosEstudiantes] = useState([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);

  // -- Fetch estudiantes para NOTAS (GET) --
  useEffect(() => {
    const fetchEstudiantesNotas = async () => {
      try {
        setLoadingEstudiantes(true);
        setErrorMsg(false);

        if (!grupoSeleccionado) {
          setEstudiantes([]);
          return;
        }
        const NEXT_PUBLIC_ESTUDIANTES_GRUPO =
          process.env.NEXT_PUBLIC_ESTUDIANTES_GRUPO;
        const endpoint = `${NEXT_PUBLIC_ESTUDIANTES_GRUPO}/${grupoSeleccionado}/estudiantes`;
        // console.log(
        //   `🔄 Fetching estudiantes para notas grupo ${grupoSeleccionado}`
        // );

        const response = await fetch(endpoint, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        let datos = result.data || result;
        if (Array.isArray(datos)) {
          datos = datos.flat();
        } else {
          console.warn("⚠️ API no devolvió array para notas, ajustando a []");
          datos = [];
        }

        setEstudiantes(datos);
        // console.log("✅ Estudiantes para notas cargados:", datos);
      } catch (error) {
        console.error("❌ Error al cargar estudiantes para notas:", error);
        setErrorMsg("Error al obtener datos de estudiantes para notas.");
        setEstudiantes([]);
        toast.error(`¡Ups! Algo salió mal: ${error.message}`);
      } finally {
        setLoadingEstudiantes(false);
      }
    };

    fetchEstudiantesNotas();
  }, [grupoSeleccionado]);

  // -- Fetch estudiantes para REPORTES (POST) --
  useEffect(() => {
    const fetchEstudiantesReportes = async () => {
      try {
        setLoadingReporte(true);
        setErrorMsg(false);

        if (!grupoSeleccionado || !cicloActual) {
          setEstudiantesReporte([]);
          return;
        }

        const idgrupo = grupoSeleccionado;
        const NEXT_PUBLIC_ESTUDIANTES = process.env.NEXT_PUBLIC_ESTUDIANTES;
        const endpoint = NEXT_PUBLIC_ESTUDIANTES;
        // console.log(
        //   `🔄 Fetching estudiantes para reporte: grupo ${idgrupo} y ciclo ${cicloActual}`
        // );

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idgrupo, ciclo: cicloActual }),
        });

        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        let datos = result.data || result;
        if (Array.isArray(datos)) {
          datos = datos.flat();
        } else {
          console.warn(
            "⚠️ API no devolvió array para reportes, ajustando a []"
          );
          datos = [];
        }

        setEstudiantesReporte(datos);
        // console.log("✅ Estudiantes para reportes cargados:", datos);
      } catch (error) {
        console.error("❌ Error al cargar estudiantes para reportes:", error);
        setErrorMsg("Error al obtener datos de estudiantes para reportes.");
        setEstudiantesReporte([]);
        toast.error(`¡Ups! Algo salió mal: ${error.message}`);
      } finally {
        setLoadingReporte(false);
      }
    };

    fetchEstudiantesReportes();
  }, [grupoSeleccionado, cicloActual]);

  // Nuevo efecto para cargar TODOS los estudiantes de TODOS los grupos del usuario
  // Esto se ejecutará cuando la lista de 'grupos' cambie
  useEffect(() => {
    const fetchAllEstudiantesForUserGroups = async () => {
      if (!grupos || grupos.length === 0) {
        setTodosLosEstudiantes([]);
        return;
      }

      setLoadingAllStudents(true);
      setErrorMsg(false);
      let allStudentsData = [];

      try {
        // Itera sobre cada grupo y haz una llamada API
        for (const grupo of grupos) {
          // Sino funcionan quitar /grupo/estudiantes
          const NEXT_PUBLIC_ESTUDIANTES_GRUPO =
            process.env.NEXT_PUBLIC_ESTUDIANTES_GRUPO;
          const endpoint = `${NEXT_PUBLIC_ESTUDIANTES_GRUPO}/${grupo.IDGrupo}/estudiantes`; // Asume que cada grupo tiene un IDGrupo
          const response = await fetch(endpoint, {
            headers: { "Content-Type": "application/json" },
          });

          if (response.status === 401) {
            router.push("/");
            return; // Detener si hay un error de autenticación
          }
          if (!response.ok) {
            console.error(
              `Error al cargar estudiantes para el grupo ${grupo.IDGrupo}:`,
              response.statusText
            );
            continue; // Continúa con el siguiente grupo si hay un error en este
          }

          const result = await response.json();
          let datosGrupo = result.data || result;

          if (Array.isArray(datosGrupo)) {
            allStudentsData = allStudentsData.concat(datosGrupo.flat());
          } else {
            console.warn(
              `⚠️ API no devolvió array para grupo ${grupo.IDGrupo}, ajustando a []`
            );
          }
        }
        setTodosLosEstudiantes(allStudentsData);
        // console.log(
        //   "✅ Todos los estudiantes de los grupos cargados:",
        //   allStudentsData
        // );
      } catch (error) {
        console.error(
          "❌ Error al cargar todos los estudiantes de los grupos:",
          error
        );
        setErrorMsg("Error al obtener datos de todos los estudiantes.");
        setTodosLosEstudiantes([]);
        toast.error(
          `¡Ups! Algo salió mal al cargar todos los estudiantes: ${error.message}`
        );
      } finally {
        setLoadingAllStudents(false);
      }
    };

    fetchAllEstudiantesForUserGroups();
  }, [grupos]); // Depende de la lista de grupos

  const value = useMemo(
    () => ({
      estudiantes,
      setEstudiantes,
      loadingEstudiantes,
      estudiantesReporte,
      setEstudiantesReporte,
      todosLosEstudiantes,
      setTodosLosEstudiantes,
      loadingReporte,
      busqueda,
      setBusqueda,
      errorMsg,
      setErrorMsg,
    }),
    [
      estudiantes,
      loadingEstudiantes,
      estudiantesReporte,
      todosLosEstudiantes,
      loadingReporte,
      busqueda,
      errorMsg,
    ]
  );

  return (
    <EstudiantesContext.Provider value={value}>
      {children}
    </EstudiantesContext.Provider>
  );
}

export function useEstudiantes() {
  const context = React.useContext(EstudiantesContext);
  if (!context) {
    throw new Error("useEstudiantes debe usarse dentro de EstudiantesProvider");
  }
  return context;
}
