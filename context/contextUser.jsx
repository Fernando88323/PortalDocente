import React, { createContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

import { toast } from "react-hot-toast";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_SERVER;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // No hacer peticiones si estamos en la página de login
        if (router.pathname === "/") {
          setLoading(false);
          return;
        }

        // Simulación de carga inicial
        await new Promise((resolve) => setTimeout(resolve, 500));

        const userResponse = await fetch(`${API_BASE}/protected/dashboard/me`, {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.status === 401) {
          const errorData = await userResponse.json();
          toast.error(
            errorData.error || "No estás autorizado. Redirigiendo a inicio..."
          );
          // setTimeout(() => router.push("/"), 5000);
          return;
        }

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          console.error("Error fetching user data:", errorData.error);
          throw new Error(
            errorData.error || "Error al obtener datos de usuario"
          );
        }

        const userData = await userResponse.json();
        setUser(userData);
        // console.log("👤 Datos de usuario cargados:", userData);
        // console.log("🎭 Roles del usuario:", userData?.sistemaasignacionroles);

        // Verificar si es decano
        const isDecano = userData?.sistemaasignacionroles?.some(
          (r) => r.IDRol === 2
        );
        const isDocente = userData?.sistemaasignacionroles?.some(
          (r) => r.IDRol === 10
        );
        // console.log("🔍 Verificación de roles:", { isDecano, isDocente });

        /*const metricsResponse = await fetch(
          `${API_BASE}/protected/dashboard/metrics`,
          { method: "GET", credentials: "include" }
        );

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          await new Promise((resolve) => setTimeout(resolve, 300));
          setMetrics({
            ...prevMetrics,
            notesLoaded: metricsData.notesLoaded ?? 0,
            passedPercentage: metricsData.passedPercentage ?? 0,
            averageByGroup: metricsData.averageByGroup ?? 0,
            passedVsFailed: {
              passed: metricsData.passedVsFailed?.passed ?? 0,
              failed: metricsData.passedVsFailed?.failed ?? 0,
            },
            // totalStudents y totalGruposAsignados ya se manejarán por los useEffects de los contextos
          });
        } else {
          console.warn("No se pudieron cargar métricas.");
        }
          */
      } catch (error) {
        console.error(error);
        toast.error("Error al obtener los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]); // Simplificar dependencias

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      setLoading,
    }),
    [user, loading]
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe estar dentro del proveedor UserContext");
  }
  return context;
}
