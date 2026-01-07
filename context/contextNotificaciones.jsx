import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useUser } from "./contextUser";
import { useRouter } from "next/router";

// Crear el contexto
const contextNotificaciones = createContext();

// Proveedor del contexto
export function NotificacionesProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [notificaciones, setNotificaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conteoNotificaciones, setConteoNotificaciones] = useState(0);
  const router = useRouter();

  // Función para obtener el conteo de notificaciones
  const fetchConteoNotificaciones = useCallback(async () => {
    try {
      // console.log("🔢 Obteniendo conteo de notificaciones...");
      const NEXT_PUBLIC_NOTIFICACIONES_NO_LEIDAS_CONTADOR =
        process.env.NEXT_PUBLIC_NOTIFICACIONES_NO_LEIDAS_CONTADOR;
      const res = await fetch(
        `${NEXT_PUBLIC_NOTIFICACIONES_NO_LEIDAS_CONTADOR}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("📊 Respuesta del conteo:", {
      //   status: res.status,
      //   statusText: res.statusText,
      //   ok: res.ok,
      // });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error al obtener conteo:", {
          status: res.status,
          error: errorText,
        });
        setConteoNotificaciones(0);
        return;
      }

      const data = await res.json();
      // console.log("📈 Conteo de notificaciones recibido:", data);

      // Se actualiza el estado con la data recibida
      if (typeof data.conteo === "number") {
        setConteoNotificaciones(data.conteo);
      } else {
        // console.warn("⚠️ Respuesta inesperada en conteo:", data);
        setConteoNotificaciones(0);
      }
    } catch (error) {
      console.error("💥 Error al obtener conteo de notificaciones:", error);
      setConteoNotificaciones(0);
    }
  }, []);

  // Cargar notificaciones desde el backend (endpoint original)
  const fetchNotificaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      // console.log(
      //   "🔄 Cargando notificaciones del backend (endpoint original)..."
      // );

      const NEXT_PUBLIC_NOTIFICACIONES = process.env.NEXT_PUBLIC_NOTIFICACIONES;
      const res = await fetch(`${NEXT_PUBLIC_NOTIFICACIONES}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // console.log("📡 Respuesta del servidor:", {
      //   status: res.status,
      //   statusText: res.statusText,
      //   ok: res.ok,
      //   headers: Object.fromEntries(res.headers.entries()),
      // });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error al cargar notificaciones:", {
          status: res.status,
          error: errorText,
        });

        // Si es error 401, podría ser problema de autenticación
        if (res.status === 401) {
          // console.warn("⚠️ Usuario no autenticado para notificaciones");
        }

        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      // console.log("📋 Datos de notificaciones recibidos:", data);

      const notificacionesMapeadas = data.map((n) => ({
        id: n.IDNotificacion,
        mensaje: n.mensaje_corto || n.mensaje,
        asunto: n.solicitud_asunto,
        cuerpo: n.solicitud_cuerpo || n.cuerpo,
        archivo: n.solicitud_archivo_path || n.archivo_path,
        url: n.url_destino,
        leida: n.leida,
        fecha: n.fecha,
      }));

      // console.log("✅ Notificaciones procesadas:", {
      //   total: notificacionesMapeadas.length,
      //   noLeidas: notificacionesMapeadas.filter((n) => !n.leida).length,
      //   notificaciones: notificacionesMapeadas,
      // });

      setNotificaciones(notificacionesMapeadas);
    } catch (error) {
      console.error("💥 Error completo al cargar notificaciones:", error);
      setNotificaciones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marcar notificación como leída usando el endpoint original
  const marcarNotificacionLeida = async (id) => {
    try {
      // console.log(`📝 Marcando notificación ${id} como leída...`);
      const NEXT_PUBLIC_NOTIFICACIONES = process.env.NEXT_PUBLIC_NOTIFICACIONES;
      const res = await fetch(`${NEXT_PUBLIC_NOTIFICACIONES}/${id}/leida`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // console.log("📡 Respuesta marcar como leída:", {
      //   status: res.status,
      //   statusText: res.statusText,
      //   ok: res.ok,
      // });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error al marcar como leída:", {
          status: res.status,
          error: errorText,
        });
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      // Actualizar el estado local
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );

      // Actualizar también el conteo
      fetchConteoNotificaciones();

      // console.log("✅ Notificación marcada como leída exitosamente");
    } catch (error) {
      console.error("💥 Error al marcar notificación como leída:", error);
    }
  };

  // Cargar notificaciones al montar y cada minuto, pero solo si el usuario está cargado y NO estamos en login
  useEffect(() => {
    // No cargar notificaciones si estamos en la página de login
    if (router.pathname === "/") {
      return;
    }

    // No cargar notificaciones si el usuario aún está cargando o no existe
    if (userLoading || !user) {
      // console.log(
      //   "⏳ Esperando a que el usuario se cargue antes de obtener notificaciones..."
      // );
      return;
    }

    // console.log("👤 Usuario cargado, iniciando carga de notificaciones para:", {
    //   usuario: user.NombreCompleto,
    //   email: user.email,
    //   roles: user.sistemaasignacionroles,
    // });

    // Cargar tanto las notificaciones como el conteo
    fetchNotificaciones();
    fetchConteoNotificaciones();

    const interval = setInterval(() => {
      fetchNotificaciones();
      fetchConteoNotificaciones();
    }, 60000);

    return () => clearInterval(interval);
  }, [
    fetchNotificaciones,
    fetchConteoNotificaciones,
    user,
    userLoading,
    router.pathname,
  ]); // Usar router.pathname en lugar de isProtectedRoute

  const value = useMemo(
    () => ({
      notificaciones,
      isLoading,
      conteoNotificaciones,
      marcarNotificacionLeida,
      fetchNotificaciones,
      fetchConteoNotificaciones,
    }),
    [
      notificaciones,
      isLoading,
      conteoNotificaciones,
      fetchNotificaciones,
      fetchConteoNotificaciones,
    ]
  );

  return (
    <contextNotificaciones.Provider value={value}>
      {children}
    </contextNotificaciones.Provider>
  );
}

// Hook para usar el contexto fácilmente
export function useNotificaciones() {
  const context = React.useContext(contextNotificaciones);
  if (!context) {
    throw new Error(
      "useNotificaciones debe estar dentro del proveedor contextNotificaciones"
    );
  }
  return context;
}
