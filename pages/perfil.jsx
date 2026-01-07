// TeacherProfileForm.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout/DashboardLayout";
import {
  PencilIcon,
  CheckCircleIcon as SaveIcon,
  XCircleIcon as CancelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Componente para cada campo
const Field = ({
  label,
  name,
  value,
  editing,
  onChange,
  type = "text",
  placeholder = "",
  helper = "",
  children,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {label}
    </label>
    {editing ? (
      <>
        {children ||
          (name === "DUI" ? (
            <input
              id={name}
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              maxLength={10}
              pattern="^\d{8}-\d$"
              className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          ) : name === "NIT" ? (
            <input
              id={name}
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              maxLength={17}
              className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          ) : (
            <input
              id={name}
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          ))}
        {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
      </>
    ) : (
      <p className="mt-1 text-gray-600 bg-gray-100 rounded-md py-2 px-3">
        {value || "No definido"}
      </p>
    )}
  </div>
);

// Controles de edición/guardado
const EditSaveControls = ({ isEditing, onEdit, onSave, onCancel, loading }) =>
  isEditing ? (
    <div className="flex gap-4">
      <button
        onClick={onSave}
        disabled={loading}
        className="bg-green-500 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-2xl flex items-center transition-all duration-200"
      >
        <SaveIcon className="mr-2 h-5 w-5" />
        {loading ? "Guardando..." : "Guardar"}
      </button>
      <button
        onClick={onCancel}
        className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-2xl flex items-center transition-all duration-200"
      >
        <CancelIcon className="mr-2 h-5 w-5" />
        Cancelar
      </button>
    </div>
  ) : (
    <button
      onClick={onEdit}
      className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-2xl flex items-center transition-all duration-200"
    >
      <PencilIcon className="mr-2 h-5 w-5" />
      Editar
    </button>
  );

const TeacherProfileForm = () => {
  // URLs constants
  const POSGRADO_URL = process.env.NEXT_PUBLIC_POSGRADO;
  const PERFIL_DOCENTE_URL = process.env.NEXT_PUBLIC_PERFIL_DOCENTE;
  const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS;

  // ...existing code...
  // Modal de confirmación para eliminar posgrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [posgradoToDelete, setPosgradoToDelete] = useState(null);
  const [selectedPosgrados, setSelectedPosgrados] = useState([]);

  // Estado para editar posgrados existentes
  const [editingExistingPosgrado, setEditingExistingPosgrado] = useState(null);
  const [editPosgradoData, setEditPosgradoData] = useState({
    Fecha: "",
    Lugar: "",
    Especialidad: "",
    DiplomaPDF: null,
    hasExistingFile: false, // Para saber si ya tiene archivo
    existingFileName: "", // Para mostrar el nombre del archivo actual
  });
  const [loadingEditPosgrado, setLoadingEditPosgrado] = useState(false);

  const openDeleteModal = (id) => {
    setPosgradoToDelete(id);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPosgradoToDelete(null);
  };
  const confirmDeletePosgrado = async () => {
    if (posgradoToDelete) {
      await handleEliminarPosgrado(posgradoToDelete);
      setSelectedPosgrados((prev) =>
        prev.filter((id) => id !== posgradoToDelete)
      );
      closeDeleteModal();
    }
  };

  // Funciones para editar posgrado existente
  const startEditExistingPosgrado = (posgrado) => {
    setEditingExistingPosgrado(posgrado.IDPosGrado);
    setEditPosgradoData({
      Fecha: posgrado.Fecha ? posgrado.Fecha.split("T")[0] : "",
      Lugar: posgrado.Lugar || "",
      Especialidad: posgrado.Especialidad || "",
      DiplomaPDF: null, // Para nuevo archivo seleccionado
      hasExistingFile: !!posgrado.DiplomaPDF, // Verificar si tiene archivo
      existingFileName: posgrado.DiplomaPDF
        ? `${posgrado.Especialidad}_diploma.pdf`
        : "",
    });
    setSelectedPosgrados([]); // Limpiar selecciones
  };

  const cancelEditExistingPosgrado = () => {
    setEditingExistingPosgrado(null);
    setEditPosgradoData({
      Fecha: "",
      Lugar: "",
      Especialidad: "",
      DiplomaPDF: null,
      hasExistingFile: false,
      existingFileName: "",
    });
  };

  const saveEditExistingPosgrado = async () => {
    setLoadingEditPosgrado(true);
    try {
      // Validar que el perfil esté cargado
      if (!perfilData.IDPerfil) {
        toast.error(
          "Perfil no cargado. Espera a que se cargue el perfil antes de editar posgrados."
        );
        setLoadingEditPosgrado(false);
        return;
      }

      // Validar campos obligatorios
      if (
        !editPosgradoData.Fecha ||
        !editPosgradoData.Lugar ||
        !editPosgradoData.Especialidad
      ) {
        toast.error(
          <span>
            Debe completar todos los campos (Fecha, Lugar y Especialidad).
          </span>,
          {
            duration: 5000,
            style: {
              background: "#444",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            },
          }
        );
        setLoadingEditPosgrado(false);
        return;
      }

      // Validar que tenga archivo (existente o nuevo)
      if (!editPosgradoData.hasExistingFile && !editPosgradoData.DiplomaPDF) {
        toast.error(
          <span>
            Debe subir un archivo PDF del diploma para completar el posgrado.
          </span>,
          {
            duration: 5000,
            style: {
              background: "#444",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            },
          }
        );
        setLoadingEditPosgrado(false);
        return;
      }

      // Si no se seleccionó archivo nuevo pero hay uno existente,
      // usar una estrategia diferente: solo actualizar los campos de texto
      if (!editPosgradoData.DiplomaPDF && editPosgradoData.hasExistingFile) {
        // Actualizar solo los campos de texto para preservar el archivo
        const updateData = {
          fkPerfil: perfilData.IDPerfil,
          Fecha: editPosgradoData.Fecha,
          Lugar: editPosgradoData.Lugar,
          Especialidad: editPosgradoData.Especialidad,
          preservarArchivo: true,
        };

        const res = await fetch(`${POSGRADO_URL}/${editingExistingPosgrado}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error del servidor (sin archivo):", errorData);
          throw new Error(errorData.message || "Error al actualizar posgrado");
        }

        const responseData = await res.json();
        // console.log("Respuesta del servidor (sin archivo):", responseData);
      } else {
        // Si hay archivo nuevo, usar FormData
        const formData = new FormData();
        formData.append("fkPerfil", perfilData.IDPerfil);
        formData.append("Fecha", editPosgradoData.Fecha);
        formData.append("Lugar", editPosgradoData.Lugar);
        formData.append("Especialidad", editPosgradoData.Especialidad);

        if (editPosgradoData.DiplomaPDF) {
          formData.append("DiplomaPDF", editPosgradoData.DiplomaPDF);
          /* console.log(
            "Enviando archivo nuevo:",
            editPosgradoData.DiplomaPDF.name
          ); */
        }

        const res = await fetch(`${POSGRADO_URL}/${editingExistingPosgrado}`, {
          method: "PUT",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error del servidor (con archivo):", errorData);
          throw new Error(errorData.message || "Error al actualizar posgrado");
        }

        const responseData = await res.json();
        // console.log("Respuesta del servidor (con archivo):", responseData);
      }

      setSuccessMessage("Posgrado actualizado correctamente");
      setEditingExistingPosgrado(null);
      setEditPosgradoData({
        Fecha: "",
        Lugar: "",
        Especialidad: "",
        DiplomaPDF: null,
        hasExistingFile: false,
        existingFileName: "",
      });

      // Recargar lista
      if (perfilData.IDPerfil) {
        const posRes = await fetch(`${POSGRADO_URL}/${perfilData.IDPerfil}`);
        if (posRes.ok) {
          const data = await posRes.json();
          setPosgrados(data);
        }
      }
    } catch (err) {
      toast.error("Error al actualizar posgrado");
    } finally {
      setLoadingEditPosgrado(false);
    }
  };

  // Render de la pestaña Posgrado

  const renderPosgradoTab = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}
      {/* Formulario de posgrado arriba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* ...existing code... */}
        <Field
          label="Fecha"
          name="Fecha"
          type="date"
          value={posgradoData.Fecha}
          editing={editingPosgrado}
          onChange={handleChange(setPosgradoData)}
          helper="Fecha de obtención"
        />
        <Field
          label="Lugar"
          name="Lugar"
          value={posgradoData.Lugar}
          editing={editingPosgrado}
          onChange={handleChange(setPosgradoData)}
          placeholder="Institución/Universidad"
          helper="Ej: UES"
        />
        <Field
          label="Especialidad"
          name="Especialidad"
          value={posgradoData.Especialidad}
          editing={editingPosgrado}
          onChange={handleChange(setPosgradoData)}
          placeholder="Tu especialidad"
          helper="Ej: Maestría en Educación"
        />
        <Field
          label="Diploma (PDF)"
          name="DiplomaPDF"
          editing={editingPosgrado}
          helper="Sube tu diploma en PDF"
        >
          {editingPosgrado ? (
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleDiplomaChange}
                className="mt-1 block w-full text-gray-700"
              />
              {posgradoData.DiplomaPDF && (
                <p className="mt-2 text-sm text-gray-600">
                  Archivo: {posgradoData.DiplomaPDF.name}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-gray-600 bg-gray-100 rounded-md py-2 px-3">
              {posgradoData.Especialidad || "No definido"}
            </p>
          )}
        </Field>
      </div>
      {/* Botón de editar/agregar posgrado */}
      <div className="flex justify-end mb-8">
        <EditSaveControls
          isEditing={editingPosgrado}
          onEdit={() => {
            // No permitir agregar si se está editando un posgrado existente
            if (editingExistingPosgrado) {
              toast.error(
                "Complete la edición del posgrado actual antes de agregar uno nuevo"
              );
              return;
            }
            startEditPosgrado();
          }}
          onSave={savePosgrado}
          onCancel={cancelPosgrado}
          loading={loadingPosgrado}
        />
      </div>
      <hr className="my-8 border-gray-200" />
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="text-base font-semibold text-blue-700">Posgrados</h3>
          {selectedPosgrados.length > 0 && !editingExistingPosgrado && (
            <div className="flex gap-2">
              <button
                className="px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                onClick={() => {
                  if (selectedPosgrados.length === 1) {
                    const posgradoToEdit = posgrados.find(
                      (p) => p.IDPosGrado === selectedPosgrados[0]
                    );
                    if (posgradoToEdit) {
                      startEditExistingPosgrado(posgradoToEdit);
                    }
                  }
                }}
                disabled={selectedPosgrados.length !== 1}
                title={
                  selectedPosgrados.length !== 1
                    ? "Seleccione solo un posgrado para editar"
                    : "Editar posgrado seleccionado"
                }
              >
                Editar
              </button>
              <button
                className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                onClick={() => setShowDeleteModal(true)}
              >
                Eliminar
              </button>
              <button
                className="px-2 py-0.5 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-xs"
                style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                onClick={() => setSelectedPosgrados([])}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        {posgrados.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No tienes posgrados registrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {posgrados.map((p) => {
              const isEditing = editingExistingPosgrado === p.IDPosGrado;

              return (
                <li
                  key={p.IDPosGrado}
                  className={`bg-gray-50 rounded border p-2 transition-all duration-200 ${
                    selectedPosgrados.includes(p.IDPosGrado)
                      ? "border-blue-500 ring-2 ring-blue-200 shadow-lg"
                      : isEditing
                      ? "border-green-500 ring-2 ring-green-200 shadow-lg"
                      : "hover:border-blue-300"
                  }`}
                >
                  {isEditing ? (
                    // Formulario de edición inline
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={editPosgradoData.Fecha}
                            onChange={(e) =>
                              setEditPosgradoData((prev) => ({
                                ...prev,
                                Fecha: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lugar
                          </label>
                          <input
                            type="text"
                            value={editPosgradoData.Lugar}
                            onChange={(e) =>
                              setEditPosgradoData((prev) => ({
                                ...prev,
                                Lugar: e.target.value,
                              }))
                            }
                            placeholder="Institución/Universidad"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Especialidad
                          </label>
                          <input
                            type="text"
                            value={editPosgradoData.Especialidad}
                            onChange={(e) =>
                              setEditPosgradoData((prev) => ({
                                ...prev,
                                Especialidad: e.target.value,
                              }))
                            }
                            placeholder="Tu especialidad"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Diploma (PDF){" "}
                          {editPosgradoData.hasExistingFile
                            ? "- Opcional cambiar"
                            : "- Obligatorio"}
                        </label>

                        {/* Mostrar archivo existente */}
                        {editPosgradoData.hasExistingFile && (
                          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 text-blue-600 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-sm text-blue-800 font-medium">
                                  Archivo actual:{" "}
                                  {editPosgradoData.existingFileName}
                                </span>
                              </div>
                              <a
                                href={`${PERFIL_DOCENTE_URL}/diploma/${editingExistingPosgrado}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                Ver archivo
                              </a>
                            </div>
                          </div>
                        )}

                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            setEditPosgradoData((prev) => ({
                              ...prev,
                              DiplomaPDF: e.target.files[0],
                            }))
                          }
                          className="w-full text-sm text-gray-700"
                        />

                        {/* Mostrar archivo nuevo seleccionado */}
                        {editPosgradoData.DiplomaPDF && (
                          <p className="mt-2 text-sm text-green-600">
                            📄 Nuevo archivo seleccionado:{" "}
                            {editPosgradoData.DiplomaPDF.name}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          {editPosgradoData.hasExistingFile
                            ? "Seleccione un archivo solo si desea reemplazar el diploma actual"
                            : "Debe subir un archivo PDF del diploma"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditExistingPosgrado}
                          disabled={loadingEditPosgrado}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded flex items-center"
                        >
                          <SaveIcon className="mr-1 h-4 w-4" />
                          {loadingEditPosgrado ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          onClick={cancelEditExistingPosgrado}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded flex items-center"
                        >
                          <CancelIcon className="mr-1 h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Vista normal del posgrado
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPosgrados.includes(p.IDPosGrado)}
                          onChange={() => {
                            // No permitir seleccionar si se está editando algún posgrado
                            if (editingExistingPosgrado) return;

                            setSelectedPosgrados((prev) =>
                              prev.includes(p.IDPosGrado)
                                ? prev.filter((id) => id !== p.IDPosGrado)
                                : [...prev, p.IDPosGrado]
                            );
                          }}
                          disabled={editingExistingPosgrado !== null}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded disabled:opacity-50"
                          aria-label={`Seleccionar posgrado ${p.Especialidad}`}
                        />
                        <span className="font-semibold text-blue-700 text-md">
                          {p.Especialidad}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(p.Fecha).toLocaleDateString()}
                        </span>
                        <div className="text-sm text-gray-600">{p.Lugar}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        {p.DiplomaPDF && (
                          <a
                            href={`${PERFIL_DOCENTE_URL}/diploma/${p.IDPosGrado}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline text-xs"
                          >
                            Ver Diploma
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h4 className="text-lg font-semibold mb-4 text-red-600">
              ¿Eliminar posgrados?
            </h4>
            <p className="mb-4 text-gray-700">
              ¿Estás seguro que deseas eliminar{" "}
              {selectedPosgrados.length > 1
                ? "estos posgrados"
                : "este posgrado"}
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={async () => {
                  for (const id of selectedPosgrados) {
                    await handleEliminarPosgrado(id);
                  }
                  setSelectedPosgrados([]);
                  setShowDeleteModal(false);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  // --- POSGRADO STATE ---
  const initialPosgrado = {
    Fecha: "",
    Lugar: "",
    Especialidad: "",
    DiplomaPDF: null,
  };
  const [posgradoData, setPosgradoData] = useState(initialPosgrado);
  const [backupPosgrado, setBackupPosgrado] = useState(initialPosgrado);
  const [editingPosgrado, setEditingPosgrado] = useState(false);
  const [loadingPosgrado, setLoadingPosgrado] = useState(false);
  const [posgrados, setPosgrados] = useState([]);
  const [posgradoError, setPosgradoError] = useState("");
  const [selectedPosgrado, setSelectedPosgrado] = useState(null);
  // Eliminar posgrado
  const handleEliminarPosgrado = async (id) => {
    try {
      const res = await fetch(`${POSGRADO_URL}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar el posgrado");
      setSuccessMessage("Posgrado eliminado correctamente");
      // Recargar lista
      if (perfilData.IDPerfil) {
        const posRes = await fetch(`${POSGRADO_URL}/${perfilData.IDPerfil}`);
        if (posRes.ok) {
          const data = await posRes.json();
          setPosgrados(data);
        }
      }
    } catch (err) {
      toast.error("Error al eliminar posgrado");
    }
  };

  // --- POSGRADO ACTIONS ---
  const startEditPosgrado = () => {
    setBackupPosgrado(posgradoData);
    setEditingPosgrado(true);
  };
  const cancelPosgrado = () => {
    setPosgradoData(backupPosgrado);
    setEditingPosgrado(false);
  };
  const savePosgrado = async () => {
    setLoadingPosgrado(true);
    setPosgradoError("");
    // Validar campos obligatorios
    if (
      !posgradoData.Fecha ||
      !posgradoData.Lugar ||
      !posgradoData.Especialidad ||
      !posgradoData.DiplomaPDF
    ) {
      toast.error(
        <span>
          Debe completar todos los campos y adjuntar el PDF del diploma para
          guardar el posgrado.
        </span>,
        {
          duration: 5000,
          style: {
            background: "#444",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        }
      );
      setLoadingPosgrado(false);
      return;
    }
    try {
      if (!perfilData.IDPerfil) {
        toast.error(
          "Perfil no cargado. Espera a que se cargue el perfil antes de agregar posgrados."
        );
        setLoadingPosgrado(false);
        return;
      }
      const formData = new FormData();
      formData.append("fkPerfil", perfilData.IDPerfil);
      formData.append("Fecha", posgradoData.Fecha);
      formData.append("Lugar", posgradoData.Lugar);
      formData.append("Especialidad", posgradoData.Especialidad);
      formData.append("DiplomaPDF", posgradoData.DiplomaPDF);
      const res = await fetch(POSGRADO_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al guardar posgrado");
      setSuccessMessage("Posgrado guardado correctamente");
      setEditingPosgrado(false);
      setPosgradoData(initialPosgrado);
      // Recargar lista
      const posRes = await fetch(`${POSGRADO_URL}/${perfilData.IDPerfil}`);
      if (posRes.ok) {
        const data = await posRes.json();
        setPosgrados(data);
      }
    } catch (err) {
      setPosgradoError("No se pudo guardar el posgrado");
    } finally {
      setLoadingPosgrado(false);
    }
  };

  // Handler para diploma
  const handleDiplomaChange = (e) => {
    const file = e.target.files[0];
    setPosgradoData((prev) => ({ ...prev, DiplomaPDF: file }));
  };

  // Handler para diploma en modo edición
  const handleEditDiplomaChange = (e) => {
    const file = e.target.files[0];
    setEditPosgradoData((prev) => ({ ...prev, DiplomaPDF: file }));
  };
  // Ref para el input file de la foto
  const fotoInputRef = React.useRef(null);
  // Estado para controlar si hubo error al cargar la imagen
  const [fotoError, setFotoError] = useState(false);
  // Estado para guardar el archivo seleccionado
  const [fotoFile, setFotoFile] = useState(null);

  // Handler para cargar foto y convertir a base64
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file); // Guardar el archivo para FormData
    // Mostrar preview local solo si está editando
    if (editingPerfil) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFotoError(false);
        setPerfilData((prev) => ({
          ...prev,
          Foto: ev.target.result,
        }));
      };
      reader.onerror = () => setFotoError(true);
      reader.readAsDataURL(file);
    }
  };
  const [activeTab, setActiveTab] = useState("perfil");
  const [successMessage, setSuccessMessage] = useState("");

  // --- PERFIL STATE ---
  const initialPerfil = {
    IDPerfil: null,
    Nombres: "",
    Apellidos: "",
    Titulo: "",
    Credencial: "",
    Activo: 1,
    FechaCreacion: null,
    DUI: "",
    NIT: "",
    NUP: "",
    Direccion: "",
    FechaNacimiento: "",
    IDReferencia: null,
    Foto: "",
    perfil_completado: false,
  };
  const [perfilData, setPerfilData] = useState(initialPerfil);
  const [backupPerfil, setBackupPerfil] = useState(initialPerfil);
  const [editingPerfil, setEditingPerfil] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPerfilInit, setLoadingPerfilInit] = useState(true);

  // Cargar historial de posgrados cuando el perfil esté disponible
  useEffect(() => {
    const fetchPosgrados = async () => {
      if (!perfilData.IDPerfil) return;
      try {
        const res = await fetch(`${POSGRADO_URL}/${perfilData.IDPerfil}`);
        if (res.ok) {
          const data = await res.json();
          setPosgrados(data);
        } else {
          setPosgrados([]);
        }
      } catch {
        setPosgrados([]);
      }
    };
    fetchPosgrados();
  }, [perfilData.IDPerfil]);

  // Temporal success message y notificación de perfil completado
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => {
        setSuccessMessage("");
        setShowPerfilCompletado(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // Estado para mostrar la notificación de perfil completado solo al cargar
  const [showPerfilCompletado, setShowPerfilCompletado] = useState(false);

  // Mostrar la notificación solo al cargar la página
  useEffect(() => {
    setShowPerfilCompletado(true);
    // Se oculta después de 3 segundos (sincronizado con successMessage)
    const t = setTimeout(() => setShowPerfilCompletado(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Load initial data (perfil)
  useEffect(() => {
    const loadPerfilData = async () => {
      try {
        setLoadingPerfilInit(true);
        // console.log("Cargando perfil del docente...");
        const res = await fetch(PERFIL_DOCENTE_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        // console.log("Respuesta del servidor:", res.status, res.statusText);
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("No autorizado - Token inválido o expirado");
          } else if (res.status === 404) {
            throw new Error("Docente no encontrado");
          } else {
            const errorData = await res
              .json()
              .catch(() => ({ message: "Error desconocido" }));
            throw new Error(
              errorData.message || `Error ${res.status}: ${res.statusText}`
            );
          }
        }
        const data = await res.json();
        // console.log("Datos recibidos del perfil:", data);
        setPerfilData((p) => ({
          ...p,
          IDPerfil: data.IDPerfil ?? null,
          Nombres: data.Nombres || "",
          Apellidos: data.Apellidos || "",
          Titulo: data.Titulo || "",
          Credencial: data.Credencial || "",
          Activo: data.Activo ?? 1,
          FechaCreacion: data.FechaCreacion ?? null,
          DUI: data.DUI || "",
          NIT: data.NIT || "",
          NUP: data.NUP || "",
          Direccion: data.Direccion || "",
          FechaNacimiento: data.FechaNacimiento
            ? data.FechaNacimiento.split("T")[0]
            : "",
          IDReferencia: data.IDReferencia ?? null,
          Foto: data.Foto ?? "",
          perfil_completado: !!(data.Nombres && data.Apellidos),
        }));
      } catch (err) {
        console.error("No se pudo cargar el perfil:", err);
        toast.error(`No se pudo cargar el perfil: ${err.message}`);
      } finally {
        setLoadingPerfilInit(false);
      }
    };
    loadPerfilData();
  }, []);

  // Generic handlers
  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    if (name === "DUI") {
      // Permitir solo el formato 8 dígitos + guion + 1 dígito
      const duiRegex = /^\d{0,8}-?\d{0,1}$/;
      if (!duiRegex.test(value)) {
        toast.error(
          <span>
            El DUI solo permite 8 dígitos, un guion y 1 dígito final. Ejemplo:
            12345678-9
          </span>,
          {
            duration: 5000,
            style: {
              background: "#444",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            },
          }
        );
        return;
      }
    }
    if (name === "NIT" && value.length > 17) {
      // No permitir más de 17 caracteres
      return;
    }
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // --- PERFIL ACTIONS ---
  const startEditPerfil = () => {
    setBackupPerfil(perfilData);
    setEditingPerfil(true);
  };
  const cancelPerfil = () => {
    setPerfilData(backupPerfil);
    setEditingPerfil(false);
  };
  const savePerfil = async () => {
    // Validar formato exacto del NIT
    if (perfilData.NIT.length < 17) {
      toast.error(
        <span>
          No se puede guardar el perfil. El NIT debe tener 17 caracteres.
        </span>,
        {
          duration: 5000,
          style: {
            background: "#444",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        }
      );
      setLoadingPerfil(false);
      return;
    }
    setLoadingPerfil(true);
    // Validar campos obligatorios antes de enviar
    const camposObligatorios = [
      { campo: "Nombres", nombre: "Nombres" },
      { campo: "Apellidos", nombre: "Apellidos" },
      { campo: "Titulo", nombre: "Título" },
      { campo: "DUI", nombre: "DUI" },
    ];
    const camposFaltantes = camposObligatorios.filter(
      ({ campo }) => !perfilData[campo] || perfilData[campo].trim() === ""
    );
    if (camposFaltantes.length > 0) {
      toast.error(
        <span>
          No se puede guardar el perfil. Debe llenar los campos obligatorios:{" "}
          {camposFaltantes.map((c) => c.nombre).join(", ")}
        </span>,
        {
          duration: 5000,
          style: {
            background: "#444", // gris oscuro
            color: "#fff",
            borderRadius: "8px",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        }
      );
      setLoadingPerfil(false);
      return;
    }
    // Validar formato exacto del DUI
    const duiRegex = /^\d{8}-\d$/;
    if (!duiRegex.test(perfilData.DUI)) {
      toast.error(
        <span>
          No se puede guardar el perfil. El DUI debe tener el formato 12345678-9
          (8 dígitos, guion y 1 dígito final).
        </span>,
        {
          duration: 5000,
          style: {
            background: "#444",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        }
      );
      setLoadingPerfil(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("Nombres", perfilData.Nombres ?? "");
      formData.append("Apellidos", perfilData.Apellidos ?? "");
      formData.append("Titulo", perfilData.Titulo ?? "");
      formData.append("Credencial", perfilData.Credencial ?? "");
      formData.append("Activo", perfilData.Activo ?? 1);
      formData.append("DUI", perfilData.DUI ?? "");
      formData.append("NIT", perfilData.NIT ?? "");
      formData.append("NUP", perfilData.NUP ?? "");
      formData.append("Direccion", perfilData.Direccion ?? "");
      formData.append("FechaNacimiento", perfilData.FechaNacimiento || "");
      // Si hay archivo seleccionado, agrégalo
      if (fotoFile) {
        formData.append("Foto", fotoFile);
      }
      const res = await fetch(PERFIL_DOCENTE_URL, {
        method: "PUT",
        body: formData,
        credentials: "include",
        // No pongas Content-Type, el navegador lo pone automáticamente
      });
      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(
          errBody.message || `Error ${res.status}: ${res.statusText}`
        );
      }
      const response = await res.json();
      // Si se subió una nueva foto, actualizar el estado para mostrarla inmediatamente
      if (fotoFile && response.perfil && response.perfil.Foto) {
        // Si el backend retorna solo el nombre, construye la URL completa
        let fotoUrl = response.perfil.Foto;
        if (
          fotoUrl &&
          typeof fotoUrl === "string" &&
          !fotoUrl.startsWith("http")
        ) {
          fotoUrl = `${UPLOADS_URL}/${fotoUrl}`;
        }
        setPerfilData((p) => ({
          ...p,
          ...response.perfil,
          Foto: fotoUrl,
          FechaNacimiento: response.perfil.FechaNacimiento
            ? response.perfil.FechaNacimiento.split("T")[0]
            : "",
        }));
        setFotoError(false);
        setFotoFile(null); // Limpiar el archivo para evitar preview local
      } else {
        setPerfilData((p) => ({
          ...p,
          ...response.perfil,
          FechaNacimiento: response.perfil.FechaNacimiento
            ? response.perfil.FechaNacimiento.split("T")[0]
            : "",
        }));
      }
      setSuccessMessage(response.message || "Perfil guardado con éxito");
      setEditingPerfil(false);
      toast.success(response.message || "Perfil actualizado correctamente");
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      toast.error("Error al guardar perfil: " + (err.message || ""));
    } finally {
      setLoadingPerfil(false);
    }
  };

  // Render functions
  const renderPerfilTab = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}

      {/* Foto de perfil en la parte superior */}
      <div className="flex flex-col items-center mb-8">
        <input
          type="file"
          accept="image/*"
          ref={fotoInputRef}
          style={{ display: "none" }}
          onChange={handleFotoChange}
        />
        <div
          className={`relative cursor-pointer ${
            editingPerfil ? "hover:opacity-80" : ""
          }`}
          onClick={() =>
            editingPerfil &&
            fotoInputRef.current &&
            fotoInputRef.current.click()
          }
        >
          {!fotoError && perfilData.Foto ? (
            <img
              src={perfilData.Foto}
              alt="Foto de perfil"
              className="w-36 h-36 rounded-full object-cover shadow-lg border-4 border-white"
              onError={() => setFotoError(true)}
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-gray-400 text-6xl">👤</span>
            </div>
          )}
          {editingPerfil && !fotoError && (
            <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md border cursor-pointer flex items-center justify-center">
              <span className="text-blue-500 text-xl">📷</span>
            </div>
          )}
        </div>
        <span className="mt-2 text-gray-600 text-sm">Foto de perfil</span>
        {editingPerfil && (
          <span className="text-xs text-gray-500 mt-2">
            Haz clic sobre la foto para elegir una imagen desde tus archivos
          </span>
        )}
      </div>

      {/* Estado del perfil: solo mostrar notificación de completado al cargar */}
      {showPerfilCompletado && perfilData.perfil_completado && (
        <div className="p-4 rounded-md mb-6 bg-green-100 border border-green-300">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
            <span className="font-medium text-green-800">
              ✓ Perfil completado
            </span>
          </div>
        </div>
      )}
      {/* Si el perfil está incompleto, mostrar advertencia solo al editar */}
      {editingPerfil && !perfilData.perfil_completado && (
        <div className="p-4 rounded-md mb-6 bg-yellow-100 border border-yellow-300">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-3 bg-yellow-500"></div>
            <span className="font-medium text-yellow-800">
              ⚠ Perfil incompleto - Complete los campos obligatorios (*)
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Field
          label="Nombres *"
          name="Nombres"
          value={perfilData.Nombres}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Ingresa tus nombres"
          helper="Campo obligatorio - Ej: Juan Carlos"
        />
        <Field
          label="Apellidos *"
          name="Apellidos"
          value={perfilData.Apellidos}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Ingresa tus apellidos"
          helper="Campo obligatorio - Ej: Funes Gómez"
        />
        <Field
          label="Título"
          name="Titulo"
          value={perfilData.Titulo}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Tu título profesional"
          helper="Campo obligatorio - Ej: Ingeniería en..."
        />
        <Field
          label="Credencial"
          name="Credencial"
          value={perfilData.Credencial}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Número de credencial"
          helper="Obtén tu colegiado"
        />
        <Field
          label="DUI"
          name="DUI"
          value={perfilData.DUI}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="12345678-9"
          helper="Campo obligatorio - 8 dígitos + guión"
        />
        <Field
          label="NIT"
          name="NIT"
          value={perfilData.NIT}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="0614-290298-102-3"
          helper="Formato estándar"
        />
        <Field
          label="NUP"
          name="NUP"
          value={perfilData.NUP}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Número único"
          helper="Opcional"
        />
        <Field
          label="Dirección"
          name="Direccion"
          value={perfilData.Direccion}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          placeholder="Calle, colonia..."
          helper="Tu dirección completa"
        />
        <Field
          label="Fecha de Nacimiento"
          name="FechaNacimiento"
          type="date"
          value={perfilData.FechaNacimiento}
          editing={editingPerfil}
          onChange={handleChange(setPerfilData)}
          helper="Selecciona tu fecha (día/mes/año)"
          inputProps={{
            pattern: "\\d{4}-\\d{2}-\\d{2}",
            placeholder: "dd/mm/yyyy",
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-8"></div>
      <hr className="my-8 border-gray-200" />
      <div className="flex justify-end">
        <EditSaveControls
          isEditing={editingPerfil}
          onEdit={startEditPerfil}
          onSave={savePerfil}
          onCancel={cancelPerfil}
          loading={loadingPerfil}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto">
          {loadingPerfilInit ? (
            <div className="p-8 bg-white rounded shadow text-center">
              <p className="text-gray-600">Cargando perfil...</p>
            </div>
          ) : (
            <>
              <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === "perfil"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("perfil")}
                  >
                    Información Personal
                  </button>
                  <button
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === "posgrado"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("posgrado")}
                  >
                    Posgrados
                  </button>
                </nav>
              </div>
              {activeTab === "perfil" ? renderPerfilTab() : renderPosgradoTab()}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherProfileForm;
