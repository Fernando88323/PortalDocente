import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotificaciones } from "../../../context/contextNotificaciones";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const {
    notificaciones,
    isLoading,
    conteoNotificaciones,
    marcarNotificacionLeida,
  } = useNotificaciones();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("noLeidas");
  const router = useRouter(); // Inicializa el router aquí

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leida);
  const listaMostrar =
    view === "noLeidas" ? notificacionesNoLeidas : notificaciones;

  // Usar el conteo del endpoint si está disponible, sino usar el conteo local
  const conteoMostrar =
    conteoNotificaciones > 0
      ? conteoNotificaciones
      : notificacionesNoLeidas.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Nueva función para manejar el clic en la notificación
  const handleNotificationClick = async (notificationId) => {
    // Primero, cierra el cajón de notificaciones
    setOpen(false);

    // Marca la notificación como leída
    await marcarNotificacionLeida(notificationId);

    // Luego, navega a la página de detalles de esa notificación
    router.push(`/notificacion/${notificationId}`);
  };

  return (
    <header className="sticky top-0 w-full z-50 p-4 shadow-md flex justify-between items-center bg-gradient-to-r from-blue-700 to-sky-400 h-20 text-white">
      <h1 className="text-3xl font-semibold">Portal Docente USO</h1>
      <div className="flex items-center gap-6">
        <button
          onClick={() => setOpen(true)}
          className="relative hover:text-yellow-300"
          aria-label="Abrir notificaciones"
        >
          <Bell size={24} />
          {conteoMostrar > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
              {conteoMostrar}
            </span>
          )}
        </button>

        <img src="/imagenes/uso-logo.ico" alt="Logo" className="h-12 w-auto" />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-semibold">Notificaciones</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex border-b">
                <button
                  onClick={() => setView("noLeidas")}
                  className={`flex-1 py-2 text-center ${
                    view === "noLeidas"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  No leídas ({conteoMostrar})
                </button>
                <button
                  onClick={() => setView("todas")}
                  className={`flex-1 py-2 text-center ${
                    view === "todas"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Todas ({notificaciones.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-gray-500">Cargando...</div>
                ) : listaMostrar.length === 0 ? (
                  <div className="p-4 text-gray-500">
                    {view === "noLeidas"
                      ? "No tienes notificaciones nuevas"
                      : "No hay notificaciones"}
                  </div>
                ) : (
                  listaMostrar.map((n) => (
                    <motion.div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)} // <-- ¡CAMBIO CLAVE AQUÍ!
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col px-4 py-3 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-150 ${
                        !n.leida ? "bg-blue-50 font-medium" : ""
                      }`}
                    >
                      <span className="text-gray-800 mb-1">{n.mensaje}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(n.fecha).toLocaleString()}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
