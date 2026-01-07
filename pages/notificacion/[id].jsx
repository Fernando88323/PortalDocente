import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";
import {
  FiArrowLeft,
  FiArchive,
  FiTrash2,
  FiFilter,
  FiMoreVertical,
  FiChevronDown,
  FiCornerDownLeft,
  FiFile,
  FiPaperclip,
  FiImage,
} from "react-icons/fi";
import { RiFileTextLine } from "react-icons/ri";
import { GrDocumentPdf } from "react-icons/gr";
import { FaRegFileWord } from "react-icons/fa";
import { toast } from "sonner";
import { useUser, UserProvider } from "../../context/contextUser"; // Asegúrate de importar tu contexto de usuario

const Spinner = ({ size = "md" }) => {
  const dims =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : "h-8 w-8";
  const border =
    size === "sm" ? "border-2" : size === "lg" ? "border-4" : "border-[3px]";
  return (
    <div
      className={`${dims} ${border} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
    />
  );
};

export default () => (
  <UserProvider>
    <NotificationDetailPage />
  </UserProvider>
);

function NotificationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [notification, setNotification] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser(); // Obtén el usuario y sus roles
  const [responderModalOpen, setResponderModalOpen] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [respuestas, setRespuestas] = useState([]);
  const [decanos, setDecanos] = useState([]);

  // Función para cargar información de decanos
  useEffect(() => {
    const fetchDecanos = async () => {
      try {
        const DECANOS_URL = process.env.NEXT_PUBLIC_DECANOS;
        const res = await fetch(DECANOS_URL, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setDecanos(data.decanos || []);
        }
      } catch (error) {
        console.error("Error al cargar decanos:", error);
      }
    };

    fetchDecanos();
  }, []);

  // Función para obtener nombre del decano
  const obtenerNombreDecano = (respuesta) => {
    // Si viene el nombre y no es un ID numérico, usarlo
    if (
      respuesta.remitente_nombre &&
      typeof respuesta.remitente_nombre === "string" &&
      !respuesta.remitente_nombre.match(/^\d+$/)
    ) {
      return respuesta.remitente_nombre;
    }

    // Si hay ID del remitente, buscar en la lista de decanos
    if (respuesta.remitente_id && decanos.length > 0) {
      const decano = decanos.find(
        (d) =>
          d.IDEmpleado === parseInt(respuesta.remitente_id) ||
          d.IDEmpleado === respuesta.remitente_id ||
          d.IDDecano === parseInt(respuesta.remitente_id) ||
          d.IDDecano === respuesta.remitente_id
      );

      if (decano) {
        // Usar el campo correcto NombreEmpleado
        return decano.NombreEmpleado || "Decano";
      }
    }

    return "Decano";
  };

  // --- Estados y referencias para el redimensionamiento de la barra lateral ---
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const sidebarRef = useRef(null);
  const listContainerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (sidebarRef.current) {
      let newWidth = e.clientX - sidebarRef.current.offsetLeft;
      newWidth = Math.max(250, newWidth); // Tamaño minimo de la ventana lateral
      newWidth = Math.min(450, newWidth); // Tamaño máximo de la ventana lateral
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Refactorizar el useEffect de carga de notificaciones
  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const NOTIFICACIONES_URL = process.env.NEXT_PUBLIC_NOTIFICACIONES;
        const response = await fetch(NOTIFICACIONES_URL, {
          credentials: "include",
        });
        const data = await response.json();
        setList(data);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      } finally {
        setListLoading(false);
      }
    };

    fetchNotificaciones();
  }, []);

  // Refactorizar el useEffect de carga de detalle de notificación
  useEffect(() => {
    const fetchNotificacionDetalle = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const NOTIFICACIONES_URL = process.env.NEXT_PUBLIC_NOTIFICACIONES;
        const response = await fetch(`${NOTIFICACIONES_URL}/${id}`, {
          credentials: "include",
        });

        if (response.status === 401) {
          toast.error("Sesión expirada. Inicia sesión.");
          router.push("/");
          return;
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setNotification({
          ...data,
          archivos: Array.isArray(data.archivos) ? data.archivos : [],
        });
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificacionDetalle();
  }, [id, router]);

  // Refactorizar el useEffect de carga de respuestas
  useEffect(() => {
    const fetchRespuestas = async () => {
      if (!notification?.solicitud_id) return;

      try {
        const NEXT_PUBLIC_SOLICITUDES = process.env.NEXT_PUBLIC_SOLICITUDES;
        const response = await fetch(
          `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/respuestas`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Error al cargar las respuestas");
        }

        const data = await response.json();
        // console.log("Respuestas cargadas:", data);
        setRespuestas(data);
      } catch (error) {
        console.error("Error al cargar respuestas:", error);
        setRespuestas([]);
      }
    };

    fetchRespuestas();
  }, [notification?.solicitud_id]);

  // Deshabilitar restauración de scroll del navegador
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const back = () => router.back();

  const formatDateForDetail = (date) =>
    new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateForList = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "Fecha inválida";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (itemDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  if (loading || listLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detalle solicitudes</title>
      </Head>
      <div className="p-6 flex h-[calc(100vh-100px)] bg-gray-100 overflow-hidden">
        {/* ASIDE: Bandeja de entrada */}
        <aside
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className="bg-white border-r border-gray-200 shadow-sm flex flex-col rounded-lg overflow-x-hidden relative"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-800">
              Bandeja de entrada
            </h2>
            <div className="flex items-center space-x-1">
              <button className="text-gray-600 hover:text-blue-600">
                <FiFilter className="text-lg" />
              </button>
              <button className="text-gray-600 hover:text-blue-600">
                <FiChevronDown className="text-lg" />
              </button>
            </div>
          </div>
          <div className="flex border-b border-gray-200 text-sm font-medium text-center text-gray-500">
            <button className="flex-1 p-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active">
              Prioritarios
            </button>
            <button className="flex-1 p-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">
              Otros
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto text-sm"
            ref={listContainerRef}
          >
            <ul className="divide-y divide-gray-200">
              {list.map((item) => {
                const parts = item.mensaje.split(":");
                const asuntoLimpio =
                  parts.length > 1
                    ? parts.slice(1).join(":").trim()
                    : item.mensaje;
                const cuerpoTexto = item.cuerpo
                  ? item.cuerpo.replace(/<[^>]*>/g, "").slice(0, 60) + "..."
                  : "Sin contenido.";
                return (
                  <li key={item.IDNotificacion}>
                    <button
                      type="button"
                      data-notification-id={item.IDNotificacion}
                      className={`block w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        id === String(item.IDNotificacion)
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : "bg-white"
                      }`}
                      onClick={async () => {
                        try {
                          // Primero marcar como leída
                          const NEXT_PUBLIC_NOTIFICACIONES =
                            process.env.NEXT_PUBLIC_NOTIFICACIONES;
                          await fetch(
                            `${NEXT_PUBLIC_NOTIFICACIONES}/${item.IDNotificacion}/leida`,
                            {
                              method: "PUT",
                              credentials: "include",
                            }
                          );

                          // En lugar de redireccionar, actualizar el estado
                          const res = await fetch(
                            `${NEXT_PUBLIC_NOTIFICACIONES}/${item.IDNotificacion}`,
                            {
                              credentials: "include",
                            }
                          );

                          if (!res.ok)
                            throw new Error("Error cargando detalle");

                          const data = await res.json();
                          setNotification({
                            ...data,
                            archivos: Array.isArray(data.archivos)
                              ? data.archivos
                              : [],
                          });

                          // Actualizar la URL sin recargar la página
                          router.push(
                            `/notificacion/${item.IDNotificacion}`,
                            undefined,
                            { shallow: true }
                          );
                        } catch (error) {
                          console.error("Error:", error);
                          toast.error("Error al cargar el detalle");
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-gray-900 truncate w-full">
                              {item.docente_nombre || "Sistema"}
                            </span>
                            <span className="text-sm text-gray-800 truncate w-full">
                              {asuntoLimpio}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateForList(item.fecha)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600 truncate w-full">
                        {cuerpoTexto}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-gray-300 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </aside>

        {/* MAIN: Detalle de la notificación */}
        <main className="px-2 flex-1 overflow-y-auto bg-gray-100 relative text-base">
          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="sticky top-0 bg-gray-100 z-10">
            <div className="flex items-center mb-3 space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 sticky top-0 z-20 text-sm">
              <button
                onClick={back}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-600"
              >
                <FiArrowLeft className="text-base" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-md text-gray-600">
                <FiArchive className="text-base" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-md text-gray-600">
                <FiTrash2 className="text-base" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-md text-gray-600">
                <FiFilter className="text-base" />
              </button>
              <div className="border-l border-gray-300 h-5 mx-2" />
              <button className="ml-auto p-1 hover:bg-gray-100 rounded-md text-gray-600">
                <FiMoreVertical className="text-base" />
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3 sticky top-[56px] z-20">
              {respuestas.length > 0 && (
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  {respuestas[0].asunto || "Asunto no disponible"}
                </h2>
              )}
              <div className="flex items-center text-sm text-gray-600 space-x-2 pb-4">
                <div className="flex items-center">
                  <span className="mr-1">De:</span>
                  <span className="font-semibold text-gray-800">
                    {notification.docente_nombre || "No disponible"}
                  </span>
                  <FiChevronDown className="ml-1 text-xs" />
                </div>
                <span className="text-sm text-gray-500">
                  {formatDateForDetail(notification.fecha)}
                </span>
              </div>

              {notification.archivos.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    <FiPaperclip className="inline-block mr-2 text-base" />
                    Archivos adjuntos ({notification.archivos.length})
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                    {notification.archivos.map((file) => {
                      const ext = file.nombre_original
                        .split(".")
                        .pop()
                        .toLowerCase();
                      let IconComponent = FiFile;
                      if (ext === "pdf") IconComponent = GrDocumentPdf;
                      if (["doc", "docx"].includes(ext))
                        IconComponent = FaRegFileWord;
                      if (["txt", "md"].includes(ext))
                        IconComponent = RiFileTextLine;
                      if (["png", "jpg", "jpeg", "gif"].includes(ext))
                        IconComponent = FiImage;

                      return (
                        <li
                          key={file.IDArchivo || file.nombre_original}
                          className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md px-3 py-2 transition"
                        >
                          <IconComponent
                            className={`text-xl ${
                              ext === "pdf"
                                ? "text-red-500"
                                : ["doc", "docx"].includes(ext)
                                ? "text-blue-500"
                                : ["png", "jpg", "jpeg", "gif"].includes(ext)
                                ? "text-green-500"
                                : "text-gray-600"
                            }`}
                          />

                          <a
                            //...
                            href={`${process.env.NEXT_PUBLIC_SERVER}${file.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-800 hover:underline truncate flex-1"
                          >
                            {file.nombre_original}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <section>
            <div className="bg-white text-justify text-sm text-gray-800 rounded-lg px-4 sm:pl-14 sm:pr-6 py-6 shadow-sm border border-gray-200 whitespace-pre-wrap w-full max-w-full overflow-x-auto">
              {notification.cuerpo || (
                <p className="italic text-gray-500">Sin contenido.</p>
              )}

              <div className="mt-6 flex space-x-2 pt-4">
                {/* Mostrar botón solo si el usuario es Decano (IDRol: 2) */}
                {user?.sistemaasignacionroles?.some((r) => r.IDRol === 2) && (
                  <button
                    onClick={() => setResponderModalOpen(true)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 border border-blue-700 rounded-md text-white text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <FiCornerDownLeft className="text-base" />
                    <span>Responder</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Modal para responder */}
          {responderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                <h3 className="text-gray-800 text-lg font-semibold mb-4">
                  Responder a la solicitud
                </h3>

                {/* Botones de respuestas predeterminadas */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Respuestas rápidas:
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={async () => {
                        try {
                          const NEXT_PUBLIC_SOLICITUDES =
                            process.env.NEXT_PUBLIC_SOLICITUDES;
                          const response = await fetch(
                            `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/responder`,
                            {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                cuerpo: "APROBADO",
                              }),
                            }
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                              errorData.message ||
                                "Error al enviar la respuesta"
                            );
                          }

                          // Actualizar las respuestas después de enviar
                          const respuestasResponse = await fetch(
                            `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/respuestas`,
                            {
                              credentials: "include",
                            }
                          );
                          const nuevasRespuestas =
                            await respuestasResponse.json();
                          setRespuestas(nuevasRespuestas);

                          setResponderModalOpen(false);
                          setRespuestaTexto("");
                          toast.success("Solicitud APROBADA exitosamente");
                        } catch (error) {
                          toast.error(
                            error.message || "Error al enviar la respuesta"
                          );
                          console.error(error);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                    >
                      APROBADO
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const NEXT_PUBLIC_SOLICITUDES =
                            process.env.NEXT_PUBLIC_SOLICITUDES;
                          const response = await fetch(
                            `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/responder`,
                            {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                cuerpo: "RECHAZADO",
                              }),
                            }
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                              errorData.message ||
                                "Error al enviar la respuesta"
                            );
                          }

                          // Actualizar las respuestas después de enviar
                          const respuestasResponse = await fetch(
                            `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/respuestas`,
                            {
                              credentials: "include",
                            }
                          );
                          const nuevasRespuestas =
                            await respuestasResponse.json();
                          setRespuestas(nuevasRespuestas);

                          setResponderModalOpen(false);
                          setRespuestaTexto("");
                          toast.success("Solicitud RECHAZADA exitosamente");
                        } catch (error) {
                          toast.error(
                            error.message || "Error al enviar la respuesta"
                          );
                          console.error(error);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                    >
                      RECHAZADO
                    </button>
                  </div>
                </div>

                {/* Área de texto personalizada */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    O escribe una respuesta personalizada:
                  </p>
                  <textarea
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    className="text-gray-600 w-full border rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={5}
                    placeholder="Escribe tu respuesta aquí..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setResponderModalOpen(false);
                      setRespuestaTexto(""); // Limpiar el texto al cerrar
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      // Validar que el texto no esté vacío
                      if (!respuestaTexto.trim()) {
                        toast.error(
                          "Debe ingresar una respuesta para el docente"
                        );
                        return;
                      }

                      try {
                        const NEXT_PUBLIC_SOLICITUDES =
                          process.env.NEXT_PUBLIC_SOLICITUDES;
                        const response = await fetch(
                          `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/responder`,
                          {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              cuerpo: respuestaTexto,
                            }),
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(
                            errorData.message || "Error al enviar la respuesta"
                          );
                        }

                        // Actualizar las respuestas después de enviar
                        const respuestasResponse = await fetch(
                          `${NEXT_PUBLIC_SOLICITUDES}/${notification.solicitud_id}/respuestas`,
                          {
                            credentials: "include",
                          }
                        );
                        const nuevasRespuestas =
                          await respuestasResponse.json();
                        setRespuestas(nuevasRespuestas);

                        setResponderModalOpen(false);
                        setRespuestaTexto("");
                        toast.success("Respuesta enviada exitosamente");
                      } catch (error) {
                        toast.error(
                          error.message || "Error al enviar la respuesta"
                        );
                        console.error(error);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                  >
                    Enviar Respuesta
                  </button>
                </div>
              </div>
            </div>
          )}

          {respuestas.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-700 mb-2">
                Respuestas del Decano
              </h4>
              <ul className="space-y-4">
                {respuestas.map((resp) => (
                  <li
                    key={resp.IDRespuesta}
                    className="bg-blue-50 border-l-4 border-blue-400 rounded p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-700">
                        {obtenerNombreDecano(resp)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(resp.fecha).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-line">
                      {resp.cuerpo}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
