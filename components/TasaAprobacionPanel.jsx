import React, { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout/DashboardLayout";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import { ImSpinner9 } from "react-icons/im";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Select from "react-select";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import { GruposProvider, useGrupos } from "@/context/contextGroups";
import {
  EstudiantesProvider,
  useEstudiantes,
} from "@/context/contextEstudiantes";
import { useUser, UserProvider } from "@/context/contextUser";
import {
  CicloActualProvider,
  useCicloActual,
} from "@/context/contextCicloActual";

export default () => (
  <CicloActualProvider>
    <GruposProvider>
      <EstudiantesProvider>
        <UserProvider>
          <Reportes />
        </UserProvider>
      </EstudiantesProvider>
    </GruposProvider>
  </CicloActualProvider>
);

function Reportes() {
  //const [ciclo, setCiclo] = useState("");
  const [nombreReporte, setNombreReporte] = useState("Tasa de Aprobacion"); // Único reporte
  const [reporteGenerado, setReporteGenerado] = useState(false);
  // Decano-specific report states
  const [decanoData, setDecanoData] = useState(null);
  const [decanoLoading, setDecanoLoading] = useState(false);
  const [decanoError, setDecanoError] = useState(null);
  // Estado para la modal
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estados para la llamada del grupo
  const [grupoData, setGrupoData] = useState(null);
  const [grupoLoading, setGrupoLoading] = useState(false);
  const [grupoError, setGrupoError] = useState(null);
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda para tabla principal
  const [modalSearchTerm, setModalSearchTerm] = useState(""); // Búsqueda para modal
  // Estado para cuota (solo para decanos)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState("2"); // Valor por defecto
  const [cuotaTouched, setCuotaTouched] = useState(false);
  // Track whether the user explicitly selected filtro values (vs programmatic defaults)
  const [cicloTouched, setCicloTouched] = useState(false);
  const [reporteTouched, setReporteTouched] = useState(true);

  // Estado para validar el formato del ciclo (ej. 01/24)
  const [cicloValido, setCicloValido] = useState(true);

  // Estado para prevenir re-renders excesivos
  const [cicloAnterior, setCicloAnterior] = useState("");
  const [cicloInputLocal, setCicloInputLocal] = useState("");
  const [isUserEditing, setIsUserEditing] = useState(false);
  // Mantener el valor local aunque el contexto tenga otro hasta que el usuario ingrese un ciclo válido
  const [holdLocalInput, setHoldLocalInput] = useState(false);
  const cicloRef = useRef(null);
  const tipoReporteRef = useRef(null);
  const debounceTimer = useRef(null);

  const { user } = useUser();

  const { cicloActual, setCicloActual, loadingCiclo, refrescarCicloActual } =
    useCicloActual();
  const lastGeneratedCycleRef = useRef(null);

  // Obtener roles del usuario
  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];
  const isDecano = roles.some((rol) => rol.IDRol === 2);
  const isDocente = roles.some((rol) => rol.IDRol === 10);

  // Obtener grupos del contexto (necesario para inicializar el ciclo)
  const { grupos, facultad } = useGrupos();
  const { estudiantesReporte, loading, errorMsg } = useEstudiantes();

  // Opciones para cuota (solo para decanos)
  const cuotaOptions = [
    { value: "MATRICULA", label: "MATRICULA" },
    { value: "PRIMERA CUOTA", label: "PRIMERA CUOTA" },
    { value: "SEGUNDA CUOTA", label: "SEGUNDA CUOTA" },
    { value: "TERCERA CUOTA", label: "TERCERA CUOTA" },
    { value: "CUARTA CUOTA", label: "CUARTA CUOTA" },
    { value: "QUINTA CUOTA", label: "QUINTA CUOTA" },
    { value: "SEXTA CUOTA", label: "SEXTA CUOTA" },
    { value: "SEPTIMA CUOTA", label: "SEPTIMA CUOTA" },
  ];

  // Common props for react-select so menus render in a portal and appear above other elements
  const selectCommonProps = {
    // Render the menu in a portal attached to body to avoid being clipped by overflow containers
    menuPortalTarget: typeof window !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    menuPlacement: "auto",
    // Disable typing and clearing: user must pick from provided options only
    isSearchable: false,
    isClearable: false,
    styles: {
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    },
  };

  const grupoOptions = grupos.map((g) => ({
    value: g.IDGrupo,
    label: `${g.Nombre} - ${g.Identificador}`,
  }));

  // Definimos todas las opciones de reporte
  const allReportOptions = [
    { value: "Tasa de Aprobacion", label: "Tasa de Aprobacion" },
  ];

  // Filtramos las opciones de reporte basadas en los roles del usuario
  const reporteOptions = useMemo(() => {
    // Solo mostrar Tasa de Aprobacion para todos los roles
    return [...allReportOptions];
  }, [isDecano, isDocente]);

  // Formatea valores de tasa asegurando el símbolo % si no existe
  const formatPercent = (val) => {
    if (val === null || val === undefined || val === "") return "0%";
    const s = String(val).trim();
    return s.endsWith("%") ? s : `${s}%`;
  };

  // Inicializar ciclo automáticamente al primer grupo - UNA SOLA VEZ
  // Evitar re-inicializar si el usuario ya interactuó con el campo (cicloTouched)
  useEffect(() => {
    if (grupos.length > 0 && !cicloTouched && !cicloActual) {
      const firstGroup = grupos[0];
      const cicloTrimmed = firstGroup.Ciclo.trim();
      setCicloActual(cicloTrimmed);
      setCicloTouched(true);
    }
  }, [grupos.length, cicloActual, cicloTouched]);

  // Sincronizar el estado local del input con el contexto solo cuando no esté editando
  useEffect(() => {
    if (!isUserEditing && !holdLocalInput) {
      setCicloInputLocal(cicloActual || "");
    }
  }, [cicloActual, isUserEditing, holdLocalInput]);

  // Auto-generar el reporte cuando exista un ciclo válido y cambie
  useEffect(() => {
    const cicloValidoActual = /^(01|02)\/\d{2}$/.test(
      String(cicloActual || "").trim()
    );
    if (cicloValidoActual && cicloActual !== lastGeneratedCycleRef.current) {
      setNombreReporte("Tasa de Aprobacion");
      setReporteTouched(true);
      if (!cicloTouched) setCicloTouched(true);
      lastGeneratedCycleRef.current = cicloActual;
      // Disparar generación sin requerir click
      handleGenerarInforme();
    }
  }, [cicloActual, cicloTouched]);

  // Función para manejar cambios en el input con debounce
  const handleCicloInputChange = (newValue) => {
    setIsUserEditing(true);
    setHoldLocalInput(true);
    setCicloInputLocal(newValue);

    // Limpiar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Solo actualizar el contexto si el valor es válido (evitar propagar estado vacío/parcial)
    if (/^(01|02)\/\d{2}$/.test(newValue)) {
      debounceTimer.current = setTimeout(() => {
        setCicloActual(newValue);
        setCicloTouched(true);
        setIsUserEditing(false); // Ya no está editando después del debounce
        setHoldLocalInput(false); // Ya podemos sincronizar desde el contexto
      }, 500); // Debounce de 500ms
    }
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Efecto para manejar la tecla Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };

    // Agregar el event listener cuando la modal está abierta
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    // Limpiar el event listener cuando el componente se desmonte o la modal se cierre
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isModalOpen]);

  // Marcar ciclo como "tocado" cuando tenga valor
  useEffect(() => {
    if (cicloActual && !cicloTouched) {
      setCicloTouched(true);
    }
  }, [cicloActual, cicloTouched]);

  // Resetear estado del reporte SOLO cuando cambia el ciclo completamente
  useEffect(() => {
    // Solo resetear si el ciclo es válido y diferente al anterior
    if (
      cicloActual &&
      cicloActual !== cicloAnterior &&
      /^(01|02)\/\d{2}$/.test(cicloActual)
    ) {
      // Limpiar datos previos sin desactivar el flag de reporte generado
      setDecanoData(null);
      setDecanoError(null);
      setCicloAnterior(cicloActual);
    }
  }, [cicloActual, reporteGenerado, cicloAnterior]);

  // Filtrar estudiantes según ciclo (sin filtro de grupo ya que no se necesita para tasa de aprobación)
  const estudiantesFiltrados = useMemo(() => {
    return estudiantesReporte.filter((e) => {
      const matchCiclo = cicloActual
        ? String(e.Ciclo).trim().toLowerCase() ===
          String(cicloActual).trim().toLowerCase()
        : true;
      return matchCiclo;
    });
  }, [estudiantesReporte, cicloActual]);

  // If the user is decano and selected the special report, use decanoData
  const displayedData = useMemo(() => {
    // Solo manejar Tasa de Aprobacion
    if (isDecano && nombreReporte === "Tasa de Aprobacion") {
      return decanoData || [];
    }
    return estudiantesFiltrados;
  }, [isDecano, nombreReporte, decanoData, estudiantesFiltrados]);

  // Filtrar datos de la tabla principal por búsqueda
  const filteredDisplayedData = useMemo(() => {
    if (!searchTerm.trim()) return displayedData;

    return displayedData.filter((item) => {
      const searchLower = searchTerm.toLowerCase();

      // Búsqueda para tasa de aprobación (grupos)
      const materia = (item.NombreMateria || "").toLowerCase();
      const docente = (item.NombreDocente || "").toLowerCase();
      const grupo = (item.Grupo || "").toLowerCase();

      return (
        materia.includes(searchLower) ||
        docente.includes(searchLower) ||
        grupo.includes(searchLower)
      );
    });
  }, [displayedData, searchTerm]);

  // Filtrar datos de la modal por búsqueda
  const filteredGrupoData = useMemo(() => {
    if (!modalSearchTerm.trim() || !grupoData) return grupoData;

    return grupoData.filter((estudiante) => {
      const searchLower = modalSearchTerm.toLowerCase();

      const codigo = (estudiante.CodigoEstudiante || "").toLowerCase();
      const nombre = `${estudiante.PrimerNombre || ""} ${
        estudiante.SegundoNombre || ""
      } ${estudiante.PrimerApellido || ""} ${
        estudiante.SegundoApellido || ""
      }`.toLowerCase();
      const expediente = (estudiante.IDInscripcion || "")
        .toString()
        .toLowerCase();

      return (
        codigo.includes(searchLower) ||
        nombre.includes(searchLower) ||
        expediente.includes(searchLower)
      );
    });
  }, [grupoData, modalSearchTerm]);

  // Verificar que ciclo y tipo de reporte estén seleccionados
  const canExport =
    Boolean(reporteGenerado) &&
    Boolean(cicloTouched && reporteTouched && cicloActual && nombreReporte);

  // Requerir además que el ciclo tenga formato válido
  const canExportFinal = canExport && cicloValido;

  // Generando reporte Excel
  const handleExportExcel = () => {
    if (!canExportFinal) {
      toast.error(
        "Genere el informe primero usando el botón 'Generar Informe' y asegúrese de haber completado los filtros."
      );
      return;
    }

    // Headers para Tasa de Aprobacion
    const headers = [
      "IDGrupo",
      "NombreMateria",
      "NombreDocente",
      "Aula",
      "Grupo",
      "Inscritos",
      "Aprobados",
      "Reprobados",
      "t_aprobados",
      "t_reprobados",
    ];

    // Convertir datos para asegurar % en tasas
    const excelData = displayedData.map((d) => ({
      IDGrupo: d.IDGrupo,
      NombreMateria: d.NombreMateria,
      NombreDocente: d.NombreDocente,
      Aula: d.Aula,
      Grupo: d.Grupo,
      Inscritos: d.Inscritos,
      Aprobados: d.Aprobados,
      Reprobados: d.Reprobados,
      t_aprobados: formatPercent(d.t_aprobados),
      t_reprobados: formatPercent(d.t_reprobados),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(
      wb,
      `reporte_${nombreReporte.toLowerCase().replace(/\s+/g, "_")}.xlsx`
    );
  };

  // Generando reporte PDF
  const handleExportPDF = async () => {
    if (!canExportFinal) {
      toast.error(
        "Genere el informe primero usando el botón 'Generar Informe' y asegúrese de haber completado los filtros."
      );
      return;
    }

    if (!displayedData || displayedData.length === 0) {
      toast.error("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF({
      unit: "mm",
      format: "letter",
      orientation: "portrait",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Encabezado principal
    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text("UNIVERSIDAD DE SONSONATE - USO", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(
      `RESUMEN DE TASAS DE APROBACION PARA EL CICLO - ${cicloActual}`,
      pageWidth / 2,
      28,
      {
        align: "center",
      }
    );

    // Preparar datos para la tabla
    const tableData = displayedData.map((item, index) => [
      item.IDGrupo?.toString() || (index + 1).toString(), // ID Grupo en lugar de correlativo
      item.NombreMateria || "",
      item.NombreDocente || "",
      item.Grupo || "",
      item.Inscritos?.toString() || "0",
      item.Aprobados?.toString() || "0",
      item.Reprobados?.toString() || "0",
      formatPercent(item.t_aprobados),
      formatPercent(item.t_reprobados),
    ]);

    // Configurar columnas de la tabla
    const columns = [
      { header: "ID.", dataKey: "id" },
      { header: "NOMBRE MATERIA", dataKey: "materia" },
      { header: "DOCENTE", dataKey: "docente" },
      { header: "GRUPO", dataKey: "grupo" },
      { header: "INSC.", dataKey: "inscritos" },
      { header: "APROB.", dataKey: "aprobados" },
      { header: "REPROB.", dataKey: "reprobados" },
      { header: "TASA APROB.", dataKey: "tasa_aprob" },
      { header: "TASA REPROB.", dataKey: "tasa_reprob" },
    ];

    // Crear tabla con jsPDF-autotable
    doc.autoTable({
      startY: 35,
      head: [columns.map((col) => col.header)],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [128, 128, 128],
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 }, // ID Grupo
        1: { halign: "left", cellWidth: 45 }, // NOMBRE MATERIA
        2: { halign: "left", cellWidth: 35 }, // DOCENTE
        3: { halign: "center", cellWidth: 15 }, // GRUPO
        4: { halign: "center", cellWidth: 15 }, // INSC.
        5: { halign: "center", cellWidth: 15 }, // APROB.
        6: { halign: "center", cellWidth: 15 }, // REPROB.
        7: { halign: "center", cellWidth: 20 }, // TASA APROB.
        8: { halign: "center", cellWidth: 20 }, // TASA REPROB.
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: (data) => {
        // Pie de página
        const userEmail = user?.EmailKey || "Email no especificado";
        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString("es-SV");
        const horaStr = fecha.toLocaleTimeString("es-SV", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const pageNumber = doc.internal.getNumberOfPages();

        doc.setFontSize(8);
        doc.setTextColor(100);

        // Información del pie de página
        doc.text(`Fecha: ${fechaStr}`, margin, pageHeight - 10);
        doc.text(`Hora: ${horaStr}`, margin, pageHeight - 5);
        doc.text(`${userEmail}`, pageWidth - margin, pageHeight - 10, {
          align: "right",
        });
        doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 5, {
          align: "right",
        });
      },
    });

    // Total de registros
    const finalY = doc.lastAutoTable.finalY || 35;
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.text(
      `N° de registros actual: ${displayedData.length}`,
      margin,
      finalY + 10
    );

    // Factor de zoom (como en la imagen)
    doc.text("Factor de zoom: 100%", pageWidth - margin, finalY + 10, {
      align: "right",
    });

    // Guardar el documento PDF
    doc.save(`resumen_tasas_aprobacion_${cicloActual.replace("/", "_")}.pdf`);
  };

  // Exportar Excel de estudiantes del grupo (modal)
  const handleExportModalExcel = () => {
    if (!filteredGrupoData || filteredGrupoData.length === 0) {
      toast.error("No hay datos de estudiantes para exportar.");
      return;
    }

    const headers = [
      "ID_EXP",
      "CODIGO",
      "NOMBRE_DE_ESTUDIANTE",
      "P1",
      "P2",
      "L1",
      "L2",
      "L3",
      "NP",
      "P3",
      "ER",
      "NF",
    ];

    const excelData = filteredGrupoData.map((estudiante) => ({
      ID_EXP: estudiante.IDInscripcion || "",
      CODIGO: estudiante.CodigoEstudiante || "",
      NOMBRE_DE_ESTUDIANTE: `${estudiante.PrimerApellido || ""} ${
        estudiante.SegundoApellido || ""
      } ${estudiante.PrimerNombre || ""} ${
        estudiante.SegundoNombre || ""
      }`.trim(),
      P1: estudiante.p1 || 0,
      P2: estudiante.p2 || 0,
      L1: estudiante.l1 || 0,
      L2: estudiante.l2 || 0,
      L3: estudiante.l3 || 0,
      NP: estudiante.np || 0,
      P3: estudiante.p3 || 0,
      ER: estudiante.er || 0,
      NF: estudiante.NF || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(
      wb,
      `estudiantes_grupo_${
        selectedRow.IDGrupo
      }_${selectedRow.NombreMateria.replace(/\s+/g, "_")}.xlsx`
    );
  };

  // Exportar PDF de estudiantes del grupo (modal)
  const handleExportModalPDF = async () => {
    if (!filteredGrupoData || filteredGrupoData.length === 0) {
      toast.error("No hay datos de estudiantes para exportar.");
      return;
    }

    const doc = new jsPDF({
      unit: "mm",
      format: "letter",
      orientation: "portrait", // Cambiado a vertical como en la captura
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Encabezado principal
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text("UNIVERSIDAD DE SONSONATE - USO", pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(
      `DETALLE DE TASAS DE APROBACION PARA EL CICLO - ${cicloActual}`,
      pageWidth / 2,
      22,
      {
        align: "center",
      }
    );

    // Agregar contenedor de detalles del grupo como bloque unificado sin líneas internas
    const startY = 30;
    const containerHeight = 20;
    const containerWidth = pageWidth - 2 * margin;

    // Dibujar rectángulo gris de fondo
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, startY, containerWidth, containerHeight, "F");

    // Agregar texto sobre el fondo gris sin líneas divisorias
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");

    // Columna izquierda
    doc.text("ID. Grupo:", margin + 5, startY + 7);
    doc.text("Materia:", margin + 5, startY + 15);

    // Valores columna izquierda
    doc.setFont("helvetica", "normal");
    doc.text(String(selectedRow.IDGrupo || ""), margin + 30, startY + 7);
    doc.text(String(selectedRow.NombreMateria || ""), margin + 30, startY + 15);

    // Columna derecha
    doc.setFont("helvetica", "bold");
    const rightColumnX = margin + containerWidth / 2 + 10;
    doc.text("Docente:", rightColumnX, startY + 7);
    doc.text("Grupo:", rightColumnX, startY + 15);

    // Valores columna derecha
    doc.setFont("helvetica", "normal");
    doc.text(
      String(selectedRow.NombreDocente || ""),
      rightColumnX + 25,
      startY + 7
    );
    doc.text(String(selectedRow.Grupo || ""), rightColumnX + 25, startY + 15);

    const groupTableEndY = startY + containerHeight + 10;

    // Preparar datos para la tabla según la captura
    const tableData = filteredGrupoData.map((estudiante) => [
      estudiante.IDInscripcion || "",
      estudiante.CodigoEstudiante || "",
      `${estudiante.PrimerApellido || ""} ${estudiante.SegundoApellido || ""} ${
        estudiante.PrimerNombre || ""
      } ${estudiante.SegundoNombre || ""}`.trim(),
      estudiante.p1 || 0,
      estudiante.p2 || 0,
      estudiante.l1 || 0,
      estudiante.l2 || 0,
      estudiante.l3 || 0,
      estudiante.np || 0,
      estudiante.p3 || 0,
      estudiante.er || 0,
      estudiante.NF || 0,
    ]);

    // Configurar columnas según la captura
    const columns = [
      { header: "ID EXP.", dataKey: "idexp" },
      { header: "CODIGO", dataKey: "codigo" },
      { header: "NOMBRE DE ESTUDIANTE", dataKey: "nombre" },
      { header: "P1", dataKey: "p1" },
      { header: "P2", dataKey: "p2" },
      { header: "L1", dataKey: "l1" },
      { header: "L2", dataKey: "l2" },
      { header: "L3", dataKey: "l3" },
      { header: "NP", dataKey: "np" },
      { header: "P3", dataKey: "p3" },
      { header: "ER", dataKey: "er" },
      { header: "NF", dataKey: "nf" },
    ];

    // Crear tabla con jsPDF-autotable centrada y bien alineada
    doc.autoTable({
      startY: groupTableEndY,
      head: [columns.map((col) => col.header)],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [128, 128, 128],
        textColor: [0, 0, 0],
        halign: "center",
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 16 }, // ID EXP
        1: { halign: "center", cellWidth: 20 }, // CODIGO
        2: { halign: "left", cellWidth: 55 }, // NOMBRE
        3: { halign: "center", cellWidth: 11 }, // P1
        4: { halign: "center", cellWidth: 11 }, // P2
        5: { halign: "center", cellWidth: 11 }, // L1
        6: { halign: "center", cellWidth: 11 }, // L2
        7: { halign: "center", cellWidth: 11 }, // L3
        8: { halign: "center", cellWidth: 11 }, // NP
        9: { halign: "center", cellWidth: 11 }, // P3
        10: { halign: "center", cellWidth: 11 }, // ER
        11: { halign: "center", cellWidth: 11 }, // NF
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      // Colorear filas con NF < 6 en rojo
      didParseCell: function (data) {
        if (data.column.index === 11 && data.cell.raw < 6) {
          // NF column
          data.cell.styles.fillColor = [255, 200, 200]; // Light red
        }
      },
      didDrawPage: (data) => {
        // Pie de página
        const userEmail = user?.EmailKey || "Email no especificado";
        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString("es-SV");
        const horaStr = fecha.toLocaleTimeString("es-SV", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const pageNumber = doc.internal.getNumberOfPages();

        doc.setFontSize(7);
        doc.setTextColor(100);

        // Información del pie de página
        doc.text(`Fecha: ${fechaStr}`, margin, pageHeight - 8);
        doc.text(`Hora: ${horaStr}`, margin, pageHeight - 4);
        doc.text(`${userEmail}`, pageWidth - margin, pageHeight - 8, {
          align: "right",
        });
        doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 4, {
          align: "right",
        });
      },
    });

    // Total de registros
    const finalY = doc.lastAutoTable.finalY || groupTableEndY;
    doc.setFont("helvetica", "normal").setFontSize(7);
    doc.text(
      `N° de registros actual: ${filteredGrupoData.length}`,
      margin,
      finalY + 8
    );

    // Guardar el documento PDF
    doc.save(
      `estudiantes_grupo_${
        selectedRow.IDGrupo
      }_${selectedRow.NombreMateria.replace(/\s+/g, "_")}.pdf`
    );
  };

  // Compute which filters the user still hasn't selected (to show helpful messages)
  const missingSelections = useMemo(() => {
    const missing = [];

    // Validar ciclo
    if (!cicloActual || !cicloTouched) {
      missing.push("Ciclo");
    }

    // Validar tipo de reporte
    if (!nombreReporte || !reporteTouched) {
      missing.push("Tipo de reporte");
    }

    return missing;
  }, [cicloActual, nombreReporte, cicloTouched, reporteTouched]);

  // Mostrar vista previa solo si todos los filtros están seleccionados
  const canShowPreview = useMemo(() => {
    return cicloActual && nombreReporte && cicloTouched && reporteTouched;
  }, [cicloActual, nombreReporte, cicloTouched, reporteTouched]);

  const handleGenerarInforme = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    // Elegir ciclo a usar: priorizar el input local si es válido
    // Normalizar ciclo a formato mm/yy
    const normalizeCiclo = (c) => {
      if (!c) return "";
      const s = String(c).trim();
      const m4 = s.match(/^(01|02)\/(\d{4})$/);
      if (m4) return `${m4[1]}/${m4[2].slice(-2)}`;
      return s;
    };
    const cicloLocal = normalizeCiclo(cicloInputLocal);
    const cicloCtx = normalizeCiclo(cicloActual);
    const cicloLocalValido = /^(01|02)\/\d{2}$/.test(cicloLocal);
    const cicloParaGenerar = cicloLocalValido ? cicloLocal : cicloCtx;

    // Validar los campos faltantes
    if (!cicloParaGenerar) {
      if (e && cicloRef.current) cicloRef.current.focus();
      if (e) toast.error("Por favor selecciona un ciclo.");
      return;
    }

    if (!nombreReporte || !reporteTouched) {
      // Tipo de reporte está fijo; marcar como tocado si no lo está
      setNombreReporte("Tasa de Aprobacion");
      setReporteTouched(true);
    }

    // Sincronizar contexto con el ciclo elegido (si difiere)
    if (cicloParaGenerar !== cicloCtx) {
      setCicloActual(cicloParaGenerar);
    }

    // Generar reporte de Tasa de Aprobacion
    setDecanoLoading(true);
    setDecanoError(null);
    setReporteGenerado(true);
    try {
      const NEXT_PUBLIC_TASA_APROBACION =
        process.env.NEXT_PUBLIC_TASA_APROBACION;

      const res = await fetch(NEXT_PUBLIC_TASA_APROBACION, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ciclo: cicloParaGenerar }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error en el servidor");
      }

      const json = await res.json();
      const payload = json && json.data ? json.data : json;
      setDecanoData(Array.isArray(payload) ? payload : [payload]);
    } catch (err) {
      setDecanoError(err.message || "Error al obtener datos");
      setDecanoData([]);
    } finally {
      setDecanoLoading(false);
    }
  };

  // Mostrar cargando solo mientras se obtiene el ciclo actual
  if (loadingCiclo && !cicloActual) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-10">
          {" "}
          {/* Contenedor para centrar */}
          <ImSpinner9 className="animate-spin text-blue-500 text-6xl mb-4" />
          <p className="text-gray-600 text-lg">Cargando Reportes...</p>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }

          @keyframes spinner {
            0% {
              transform: rotate(0deg) scale(0.8);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) scale(1);
            }
          }
          .animate-spinner {
            animation: spinner 1.2s ease-out forwards, spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  // Función para manejar clic en fila de la tabla
  const handleRowClick = async (rowData) => {
    setSelectedRow(rowData);
    setIsModalOpen(true);

    // Hacer llamada al endpoint para obtener detalles del grupo
    if (rowData.IDGrupo) {
      setGrupoLoading(true);
      setGrupoError(null);
      setGrupoData(null);

      try {
        const payload = {
          idgrupo: rowData.IDGrupo,
          ciclo: cicloActual,
        };
        const NEXT_PUBLIC_TASA_APROBACION_GRUPO =
          process.env.NEXT_PUBLIC_TASA_APROBACION_GRUPO;
        const response = await fetch(NEXT_PUBLIC_TASA_APROBACION_GRUPO, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.ok && data.data) {
          setGrupoData(data.data);
        } else {
          setGrupoError("Error al obtener los datos del grupo.");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        setGrupoError("Error al conectar con el servidor.");
      } finally {
        setGrupoLoading(false);
      }
    }
  };

  // Función para cerrar la modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    setGrupoData(null);
    setGrupoError(null);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Reportes de Estudiantes</title>
      </Head>

      <div className="w-full h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="h-full p-6 flex flex-col">
          {/* Main content: full-height split */}
          <div className="flex flex-col gap-4">
            <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-shrink-0">
                <h2 className="text-md font-semibold text-gray-800">Filtros</h2>
                <span className="text-xs text-gray-500">Avanzado</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap flex-1">
                <div className="min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Ciclo
                  </label>
                  <input
                    ref={cicloRef}
                    type="text"
                    value={cicloInputLocal || ""}
                    onChange={(e) => {
                      // Formatear automáticamente: aceptar solo dígitos y
                      // colocar '/' después de los dos primeros dígitos.
                      const rawDisplay = String(e.target.value || "");
                      const prevDisplay = String(cicloInputLocal || "");
                      const isDeleting = rawDisplay.length < prevDisplay.length;
                      const digits = rawDisplay.replace(/\D/g, "").slice(0, 4);
                      let formatted = "";

                      if (digits.length === 0) {
                        formatted = "";
                      } else if (digits.length === 1) {
                        formatted = digits;
                      } else if (digits.length === 2) {
                        // If user is deleting, don't re-insert the slash so it can be removed.
                        formatted = isDeleting ? digits : `${digits}/`;
                      } else {
                        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                      }

                      handleCicloInputChange(formatted);
                      setCicloValido(
                        formatted === "" || /^(01|02)\/\d{2}$/.test(formatted)
                      );
                    }}
                    onFocus={() => {
                      setIsUserEditing(true); // Usuario empezó a editar
                    }}
                    onBlur={() => {
                      setIsUserEditing(false); // Usuario terminó de editar

                      // Validar formato al salir del campo
                      const isValid = /^(01|02)\/\d{2}$/.test(cicloInputLocal);
                      setCicloValido(cicloInputLocal === "" ? true : isValid);

                      // Si está vacío, no propagamos al contexto y mantenemos el valor local
                      if (cicloInputLocal === "") {
                        setHoldLocalInput(true);
                        return;
                      }

                      // Si el valor es válido y diferente, actualizar inmediatamente
                      if (isValid && cicloInputLocal !== cicloActual) {
                        setCicloActual(cicloInputLocal);
                        setCicloTouched(true);
                        setHoldLocalInput(false);
                      }
                    }}
                    placeholder="Escribe un ciclo (ej. 01/25)"
                    className={`w-full px-3 py-2 border rounded-md ${
                      cicloValido ? "border-gray-200" : "border-red-400"
                    }`}
                  />
                </div>

                <div className="min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Tipo de reporte
                  </label>
                  <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-700 text-sm select-none">
                    Tasa de Aprobacion
                  </div>
                </div>

                {/* Select de cuota - mostrar cuando se seleccione Solvencia de Pagos */}
                {nombreReporte === "Solvencia de Pagos" && (
                  <div className="min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Cuota
                    </label>
                    <Select
                      {...selectCommonProps}
                      options={cuotaOptions}
                      value={cuotaOptions.find(
                        (opt) => opt.value === cuotaSeleccionada
                      )}
                      onChange={(selected) => {
                        setCuotaSeleccionada(selected?.value || "2");
                        setCuotaTouched(true);
                      }}
                      placeholder="Cuota"
                      classNamePrefix="react-select"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!canExportFinal) {
                      toast.error(
                        "Aún no hay datos para exportar. Espera a que se genere el informe."
                      );
                      return;
                    }
                    handleExportExcel();
                  }}
                  title={
                    canExportFinal
                      ? "Exportar a Excel"
                      : "Seleccione filtros antes de exportar"
                  }
                  disabled={!canExportFinal}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700 ${
                    !canExportFinal
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-sm"
                  }`}
                >
                  <FaFileExcel className="text-emerald-500" />
                  <span className="text-sm">Exportar</span>
                </button>

                <button
                  onClick={() => {
                    if (!canExportFinal) {
                      toast.error(
                        "Aún no hay datos para exportar. Espera a que se genere el informe."
                      );
                      return;
                    }
                    handleExportPDF();
                  }}
                  title={
                    canExportFinal
                      ? "Exportar a PDF"
                      : "Seleccione filtros antes de exportar"
                  }
                  disabled={!canExportFinal}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-white ${
                    !canExportFinal
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <FaFilePdf />
                  <span className="text-sm">PDF</span>
                </button>

                {/* Botón de "Generar Informe" removido: ahora se autogenera con el ciclo actual */}
              </div>
            </div>

            <div className="flex-1">
              {" "}
              {/* Main content area */}
              {/* ...existing content for the main area... */}
              {/* Right pane: report viewer (full height) */}
              <main className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col overflow-hidden min-h-0">
                {/*DESCOMENTAR -- 24/08/2025 23:15 -- */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Vista previa del Reporte
                    </h3>
                    <p className="text-sm text-gray-500">
                      {nombreReporte} · {cicloActual || "Ciclo no seleccionado"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Input de búsqueda para la tabla principal */}
                    {reporteGenerado &&
                      canShowPreview &&
                      displayedData.length > 0 && (
                        <div className="relative w-64">
                          <input
                            type="text"
                            placeholder="Buscar por materia, docente o grupo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-1.5 pl-8 pr-8 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <svg
                              className="h-3 w-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="absolute inset-y-0 right-0 pr-2 flex items-center"
                            >
                              <svg
                                className="h-3 w-3 text-gray-400 hover:text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-bold text-gray-900">
                      {filteredDisplayedData.length || 0}
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto rounded-lg border border-gray-100 min-h-0 max-h-[50vh]">
                  {reporteGenerado ? (
                    !canShowPreview ? (
                      <div className="p-6 text-yellow-800">
                        Por favor seleccione {missingSelections.join(" y ")}{" "}
                        antes de generar el informe.
                      </div>
                    ) : decanoLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <ImSpinner9 className="animate-spin text-indigo-500 text-4xl" />
                      </div>
                    ) : decanoError ? (
                      <div className="p-6 text-rose-700">{decanoError}</div>
                    ) : displayedData.length === 0 ? (
                      <div className="p-6 text-yellow-800">
                        No hay estudiantes en el ciclo seleccionado.
                      </div>
                    ) : (
                      <div className="min-w-full overflow-auto">
                        <table className="w-full table-auto border-collapse text-xs">
                          <thead className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left font-semibold">
                                ID Grupo
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Nombre de Grupo
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Docente
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Aula
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Grupo
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Inscritos
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Aprobados
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Reprobados
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Tasa Aprob.
                              </th>
                              <th className="px-2 py-1 text-right font-semibold">
                                Tasa Reprob.
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDisplayedData.map((r, i) => (
                              <tr
                                key={r.IDGrupo + "-" + i}
                                className={`border-b cursor-pointer hover:bg-blue-50 ${
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                                onClick={() => handleRowClick(r)}
                              >
                                <td className="px-2 py-1">{r.IDGrupo}</td>
                                <td className="px-2 py-1">{r.NombreMateria}</td>
                                <td className="px-2 py-1">{r.NombreDocente}</td>
                                <td className="px-2 py-1">{r.Aula}</td>
                                <td className="px-2 py-1">{r.Grupo}</td>

                                <td className="px-2 py-1 text-right">
                                  {r.Inscritos}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {r.Aprobados}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {r.Reprobados}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {formatPercent(r.t_aprobados)}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {formatPercent(r.t_reprobados)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="mx-auto h-12 w-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500">
                          Selecciona los filtros y genera el informe para ver
                          los datos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar detalles del grupo */}
      <AnimatePresence>
        {isModalOpen && selectedRow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full mx-auto max-h-[90vh] overflow-y-auto relative"
            >
              <div className="grid grid-cols-3 items-center p-4 border-b bg-white sticky top-0 z-20">
                {/* Espacio vacío izquierdo */}
                <div></div>

                {/* Título centrado */}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Detalles del Grupo
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedRow.NombreMateria} - Grupo {selectedRow.Grupo}
                  </p>
                </div>

                {/* Búsqueda y botón cerrar a la derecha */}
                <div className="flex items-center gap-3 justify-end">
                  {/* Botones de exportación para la modal */}
                  {filteredGrupoData && filteredGrupoData.length > 0 && (
                    <>
                      <button
                        onClick={handleExportModalExcel}
                        title="Exportar estudiantes a Excel"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:shadow-sm text-xs"
                      >
                        <FaFileExcel className="text-emerald-500 text-sm" />
                        <span>Excel</span>
                      </button>

                      <button
                        onClick={handleExportModalPDF}
                        title="Exportar estudiantes a PDF"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 text-xs"
                      >
                        <FaFilePdf className="text-sm" />
                        <span>PDF</span>
                      </button>
                    </>
                  )}

                  {/* Search input for modal */}
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Buscar estudiantes..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-7 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        className="h-3 w-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    {modalSearchTerm && (
                      <button
                        onClick={() => setModalSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center"
                      >
                        <svg
                          className="h-3 w-3 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Mostrar datos del grupo si están disponibles */}
                {isDecano &&
                nombreReporte === "Tasa de Aprobacion" &&
                selectedRow.IDGrupo ? (
                  <>
                    {/* Información básica del grupo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg sticky top-16 z-10">
                      <div className="text-sm font-medium text-gray-600">
                        ID Grupo:{" "}
                        <span className="text-sm text-gray-900 text-start">
                          {selectedRow.IDGrupo}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-gray-600 text-center">
                        Docente:{" "}
                        <span className="text-sm text-gray-900">
                          {selectedRow.NombreDocente}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-gray-600 text-end">
                        Inscritos:{" "}
                        <span className="text-sm text-gray-900">
                          {selectedRow.Inscritos}
                        </span>
                      </div>
                    </div>

                    {/* Loading state */}
                    {grupoLoading && (
                      <div className="flex items-center justify-center py-8">
                        <ImSpinner9 className="animate-spin text-indigo-500 text-4xl mr-3" />
                        <span className="text-gray-600">
                          Cargando datos del grupo...
                        </span>
                      </div>
                    )}

                    {/* Error state */}
                    {grupoError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-red-700">{grupoError}</p>
                      </div>
                    )}

                    {/* Tabla de estudiantes */}
                    {filteredGrupoData && filteredGrupoData.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse text-[10px]">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                ID Insc
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                ID Pensum
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                ID Grupo
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                Código
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                P1
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                P2
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                L1
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                L2
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                L3
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                NP
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                P3
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                ER
                              </th>
                              <th className="px-2 py-1 text-center font-semibold border whitespace-nowrap">
                                NF
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                1er Apellido
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                2do Apellido
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                1er Nombre
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                2do Nombre
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                Plan
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                ID Carrera
                              </th>
                              <th className="px-2 py-1 text-left font-semibold border whitespace-nowrap">
                                Nombre de Carrera
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredGrupoData.map((estudiante, index) => (
                              <tr
                                key={estudiante.IDInscripcion || index}
                                className={`border-b ${
                                  estudiante.NF < 6
                                    ? "bg-red-400 hover:bg-red-300"
                                    : index % 2 === 0
                                    ? "bg-white hover:bg-gray-50"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                <td className="px-2 py-1 border text-gray-700 whitespace-nowrap">
                                  {estudiante.IDInscripcion}
                                </td>
                                <td className="px-2 py-1 border text-gray-800 whitespace-nowrap">
                                  {estudiante.IDPensum}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.IDGrupo}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.CodigoEstudiante}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.p1 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.p2 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.l1 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.l2 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.l3 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.np || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.p3 || 0}
                                </td>
                                <td className="px-2 py-1 border text-center text-gray-700 whitespace-nowrap">
                                  {estudiante.er || 0}
                                </td>
                                <td className="px-2 py-1 border text-center font-semibold text-gray-900 whitespace-nowrap">
                                  {estudiante.NF || 0}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.PrimerApellido}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.SegundoApellido}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.PrimerNombre}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.SegundoNombre}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.PlanVersion}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.IdCarrera}
                                </td>
                                <td className="px-2 py-1 border text-gray-600 whitespace-nowrap">
                                  {estudiante.NombreCarrera}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Mensaje cuando no hay datos */}
                    {filteredGrupoData &&
                      filteredGrupoData.length === 0 &&
                      !grupoLoading &&
                      !grupoError && (
                        <div className="text-center py-8 text-gray-500">
                          {modalSearchTerm.trim()
                            ? `No se encontraron estudiantes que coincidan con "${modalSearchTerm}".`
                            : "No hay estudiantes inscritos en este grupo."}
                        </div>
                      )}
                  </>
                ) : (
                  /* Vista por defecto para otros casos */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedRow).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <div className="text-sm font-medium text-gray-600 capitalize">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          {value !== null && value !== undefined
                            ? String(value)
                            : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
