import React, { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout/DashboardLayout";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import { ImSpinner9 } from "react-icons/im"; // NUEVO: Ícono para el spinner
import jsPDF from "jspdf";
import "jspdf-autotable";
import Select from "react-select";
import { toast } from "sonner";
import * as XLSX from "xlsx";
// import { AnimatePresence, motion } from "framer-motion";
import { GruposProvider, useGrupos } from "../context/contextGroups";
import {
  EstudiantesProvider,
  useEstudiantes,
} from "../context/contextEstudiantes";
import { useUser, UserProvider } from "../context/contextUser";
import {
  CicloActualProvider,
  useCicloActual,
} from "../context/contextCicloActual";

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
  const [nombreReporte, setNombreReporte] = useState(""); // Cambiado para que el valor inicial sea vacío
  const [grupoSeleccionado, setGrupoSeleccionadoState] = useState(""); // Cambiado para que el valor inicial sea vacío
  const [reporteGenerado, setReporteGenerado] = useState(false);
  // Estado para solvencia de pagos
  const [estudiantesSolventesData, setEstudiantesSolventesData] =
    useState(null);
  const [estudiantesSolventesLoading, setEstudiantesSolventesLoading] =
    useState(false);
  const [estudiantesSolventesError, setEstudiantesSolventesError] =
    useState(null);
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda para tabla principal
  // Estado para cuota (solo para decanos)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState("SEGUNDA CUOTA"); // Valor por defecto alineado a cuotaOptions
  const [cuotaTouched, setCuotaTouched] = useState(false);
  // Track whether the user explicitly selected filtro values (vs programmatic defaults)
  const [cicloTouched, setCicloTouched] = useState(false);
  const [reporteTouched, setReporteTouched] = useState(false);
  const [grupoTouched, setGrupoTouched] = useState(false);

  // Estado para validar el formato del ciclo (ej. 01/24)
  const [cicloValido, setCicloValido] = useState(true);

  const cicloRef = useRef(null);
  const tipoReporteRef = useRef(null);
  const grupoRef = useRef(null);

  const { user, loading: userLoading } = useUser();

  const { cicloActual, setCicloActual } = useCicloActual();
  // Entrada local para el campo de ciclo para no disparar recargas mientras se escribe
  const [cicloInput, setCicloInput] = useState("");
  useEffect(() => {
    // Sincronizar la entrada local cuando el contexto cambie (p.ej., carga inicial)
    setCicloInput(String(cicloActual || ""));
  }, [cicloActual]);

  // Obtener roles del usuario
  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];
  // Asegurar que IDRol pueda venir como string o número
  const isDecano = roles.some((rol) => Number(rol?.IDRol) === 2);
  const isDocente = roles.some((rol) => Number(rol?.IDRol) === 10);

  // Obtener grupos y el setter para sincronizar el contexto
  const {
    grupos,
    setGrupoSeleccionado,
    facultad,
    loading: gruposLoading,
    error: gruposError,
  } = useGrupos();
  const { estudiantesReporte, loadingReporte, errorMsg } = useEstudiantes();
  // console.log("facultad", facultad);
  // console.log("cicloActual en Reportes:", cicloActual);

  // El ciclo ahora es editable manualmente por el usuario. `cicloActual`
  // se sigue inicializando automáticamente desde el contexto/proveedor
  // (ver efecto que usa el primer grupo más abajo).

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

  // Mapa para convertir la etiqueta seleccionada en el número esperado por el backend
  const cuotaLabelToNumber = {
    MATRICULA: 0,
    "PRIMERA CUOTA": 1,
    "SEGUNDA CUOTA": 2,
    "TERCERA CUOTA": 3,
    "CUARTA CUOTA": 4,
    "QUINTA CUOTA": 5,
    "SEXTA CUOTA": 6,
    "SEPTIMA CUOTA": 7,
  };

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

  // Filtro opcional por tipo de grupo si la data lo trae
  const [tipoGrupoSeleccionado, setTipoGrupoSeleccionado] = useState("");
  const tipoGrupoOptions = useMemo(() => {
    const tipos = new Set();
    grupos.forEach((g) => {
      const t = g?.TipoGrupo ?? g?.Tipo ?? g?.TipoDeGrupo;
      if (t && String(t).trim()) tipos.add(String(t).trim());
    });
    return Array.from(tipos).map((t) => ({ value: t, label: t }));
  }, [grupos]);

  const filteredGrupos = useMemo(() => {
    if (!tipoGrupoSeleccionado) return grupos;
    return grupos.filter((g) => {
      const t = g?.TipoGrupo ?? g?.Tipo ?? g?.TipoDeGrupo;
      return String(t || "").trim() === String(tipoGrupoSeleccionado).trim();
    });
  }, [grupos, tipoGrupoSeleccionado]);

  const grupoOptions = filteredGrupos.map((g) => ({
    value: g.IDGrupo,
    label: `${g.Nombre} - ${g.Identificador}${
      g?.TipoGrupo || g?.Tipo ? ` - ${g?.TipoGrupo || g?.Tipo}` : ""
    }${g?.Horario ? ` - ${g.Horario}` : ""}`,
  }));

  // Definimos todas las opciones de reporte
  const allReportOptions = [
    { value: "Estudiantes Inscritos", label: "Estudiantes Inscritos" },
    { value: "Solvencia de Pagos", label: "Solvencia de Pagos" },
  ];

  // Filtramos las opciones de reporte basadas en los roles del usuario
  const reporteOptions = useMemo(() => {
    // Mientras se cargan los roles, mostrar todas las opciones para evitar "No options"
    if (userLoading) return [...allReportOptions];
    // Filtrando reportes para ambos roles
    if (isDecano && isDocente) {
      return [...allReportOptions];
    } else if (isDecano) {
      // Filtrando reporte solo para rol Decano
      return [
        ...allReportOptions.filter(
          (option) => option.value === "Estudiantes Inscritos"
        ),
      ];
    } else if (isDocente) {
      // Filtrando reporte solo para rol Docente
      return [
        ...allReportOptions.filter(
          (option) =>
            option.value === "Estudiantes Inscritos" ||
            option.value === "Solvencia de Pagos"
        ),
      ];
    }
    // Si no coincide con roles esperados, mostrar opciones por defecto para no dejar vacío
    return [...allReportOptions];
  }, [isDecano, isDocente, userLoading]);

  // Determinar si el usuario necesita seleccionar un grupo (solo docentes)
  const needsGroup = isDocente;
  // Mostrar selector de grupo si hay grupos disponibles, aunque no sea requerido (p.ej. otros roles)
  const showGroupSelect =
    isDocente || (Array.isArray(grupos) && grupos.length > 0);

  // Inicializar ciclo automáticamente al primer grupo
  useEffect(() => {
    if (grupos.length && cicloActual === "") {
      const firstGroup = grupos[0];
      setCicloActual(firstGroup.Ciclo.trim());
      // Consider the automatic initialization as a valid selection
      setCicloTouched(true);
    }
  }, [grupos]);

  // al generar el informe.
  useEffect(() => {
    if (cicloActual && !cicloTouched) {
      setCicloTouched(true);
    }
  }, [cicloActual, cicloTouched]);

  // Filtrar estudiantes según grupo y ciclo
  const estudiantesFiltrados = useMemo(() => {
    return estudiantesReporte.filter((e) => {
      const matchGrupo = grupoSeleccionado
        ? Number(e.IDGrupo) === Number(grupoSeleccionado)
        : true;
      const matchCiclo = cicloActual
        ? String(e.Ciclo).trim().toLowerCase() ===
          String(cicloActual).trim().toLowerCase()
        : true;
      return matchGrupo && matchCiclo;
    });
  }, [estudiantesReporte, grupoSeleccionado, cicloActual]);

  // If the user is decano and selected the special report, use decanoData
  const displayedData = useMemo(() => {
    if (nombreReporte === "Solvencia de Pagos") {
      return estudiantesSolventesData || [];
    }
    return estudiantesFiltrados;
  }, [nombreReporte, estudiantesFiltrados, estudiantesSolventesData]);

  // Filtrar datos de la tabla principal por búsqueda
  const filteredDisplayedData = useMemo(() => {
    if (!searchTerm.trim()) return displayedData;

    return displayedData.filter((item) => {
      const searchLower = searchTerm.toLowerCase();

      // Búsqueda específica para solvencia de pagos
      if (nombreReporte === "Solvencia de Pagos") {
        const codigo = (item.CodigoEstudiante || "").toLowerCase();
        const nombreCompleto = (item.NombreCompleto || "").toLowerCase();
        const carrera = (item.IdCarrera || "").toLowerCase();
        const materia = (item.NombreMateria || "").toLowerCase();
        const docente = (item.NombreDocente || "").toLowerCase();

        return (
          codigo.includes(searchLower) ||
          nombreCompleto.includes(searchLower) ||
          carrera.includes(searchLower) ||
          materia.includes(searchLower) ||
          docente.includes(searchLower)
        );
      }

      // Búsqueda por materia y docente para otros reportes
      const materia = (item.NombreMateria || item.Materia || "").toLowerCase();
      const docente = (item.NombreDocente || item.Docente || "").toLowerCase();

      return materia.includes(searchLower) || docente.includes(searchLower);
    });
  }, [displayedData, searchTerm, nombreReporte]);

  // Verificar que ciclo, grupo y tipo de reporte estén seleccionados
  // Para decano no se requiere grupo en los filtros
  const canExport =
    Boolean(reporteGenerado) &&
    (needsGroup
      ? Boolean(
          cicloTouched &&
            reporteTouched &&
            grupoTouched &&
            cicloActual &&
            nombreReporte &&
            grupoSeleccionado !== ""
        )
      : Boolean(
          cicloTouched && reporteTouched && cicloActual && nombreReporte
        )) &&
    // Validar cuota solo para usuarios docentes cuando seleccione Solvencia de Pagos
    (!(isDocente && nombreReporte === "Solvencia de Pagos") ||
      (cuotaTouched && cuotaSeleccionada));

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

    let headers = ["IDExpediente", "NombreEstudiante"];

    // Definir headers específicos según el tipo de reporte
    if (nombreReporte === "Solvencia de Pagos") {
      headers = [
        "IDExpediente",
        "CodigoEstudiante",
        "NombreCompleto",
        "IdCarrera",
        "NombreMateria",
        "NombreDocente",
        "Grupo",
        "CuotaPagos",
        "FechaIngreso",
      ];
    }

    const ws = XLSX.utils.json_to_sheet(displayedData, { header: headers });
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
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const innerWidth = pageWidth - margin * 2;

    if (!displayedData || displayedData.length === 0) {
      toast.error("No hay estudiantes para exportar.");
      return;
    }

    const nombreDocente = displayedData[0]?.Docente || "Docente desconocido";
    const cicloActual = displayedData[0]?.Ciclo || "Ciclo desconocido";
    const materiaReporte = displayedData[0]?.Materia || "Materia desconocida";
    const aulaReporte = displayedData[0]?.Aula || "Aula desconocida";
    const grupoReporte = displayedData[0]?.Identificador || "Grupo desconocido";
    const uvReporte = displayedData[0]?.UV || "UV desconocida";
    const horarioReporte = displayedData[0]?.Horario || "Horario desconocido";

    const Y0 = 10;
    doc.setFont("helvetica", "bold").setFontSize(14);
    doc.text("UNIVERSIDAD DE SONSONATE - USO", pageWidth / 2, Y0 + 8, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.text(`LISTA DE ASISTENCIA - ${cicloActual}`, pageWidth / 2, Y0 + 15, {
      align: "center",
    });

    const docente = String(nombreDocente || "Docente no especificado");
    const materia = String(materiaReporte || "Materia no especificada");
    const grupo = String(grupoReporte || "Grupo no especificado");
    const aula = String(aulaReporte || "Aula no especificada");
    const uv = String(uvReporte || "UV no especificada");
    const horario = String(horarioReporte || "Horario no especificado");

    const boxY = Y0 + 20; // Y donde inicia el cuadro de información
    const boxH = 26; // Altura del cuadro de información
    const fontSize = 9; // Tamaño de fuente para etiquetas
    const labelFont = "bold";
    const valueFont = "normal";

    doc.setFillColor(220);
    doc.roundedRect(margin, boxY, innerWidth, boxH, 3, 3, "F");

    doc.setFont("helvetica", labelFont).setFontSize(fontSize);
    doc.text("DOCENTE:", margin + 4, boxY + 6); // Etiqueta para docente
    doc.setFont("helvetica", valueFont);
    doc.text(docente, margin + 22, boxY + 6, { maxWidth: innerWidth - 30 }); // Valor para docente

    doc.setFont("helvetica", labelFont).setFontSize(fontSize);
    doc.text("MATERIA:", margin + 4, boxY + 12); // Etiqueta para materia
    doc.setFont("helvetica", valueFont);
    doc.text(materia, margin + 22, boxY + 12, { maxWidth: innerWidth - 30 }); // Valor para materia

    const rowY = boxY + 22;
    const campos = [
      { label: "GRUPO:", value: grupo, widthPercent: 0.2 },
      { label: "AULA:", value: aula, widthPercent: 0.2 },
      { label: "UV:", value: uv, widthPercent: 0.15 },
      { label: "HORARIO:", value: horario, widthPercent: 0.45 },
    ];

    const innerPadding = 4;
    const usableWidth = innerWidth - innerPadding * 2;
    let currentX = margin + innerPadding;

    campos.forEach((campo) => {
      const campoWidth = usableWidth * campo.widthPercent;

      doc.setFont("helvetica", labelFont).setFontSize(9); // Tamaño de fuente para etiquetas
      doc.text(campo.label, currentX, rowY);

      const labelWidth = doc.getTextWidth(campo.label);
      doc.setFont("helvetica", valueFont).setFontSize(9); // Tamaño de fuente para valores
      doc.text(campo.value, currentX + labelWidth + 1, rowY, {
        maxWidth: campoWidth - labelWidth - 3,
      });

      currentX += campoWidth;
    });

    const attendanceCols = 5;
    const columns = [
      { header: "No.", dataKey: "no" },
      { header: "CÓDIGO", dataKey: "code" },
      { header: "NOMBRE DE ESTUDIANTE", dataKey: "name" },
      ...Array.from({ length: attendanceCols }).map((_, i) => ({
        header: "",
        dataKey: `att${i}`,
      })),
    ];

    const headerHeight = 8; // Altura del encabezado
    const startTableY = boxY + boxH + 2; // Y donde inicia la tabla

    doc.setFillColor(235, 235, 235);
    doc.roundedRect(margin, startTableY, innerWidth, headerHeight, 2, 2, "F");

    doc.setFont("helvetica", "bold").setFontSize(9); // Tamaño de fuente para encabezados
    doc.setTextColor(0);

    const colWidths = {
      no: 10,
      code: 30,
      name: 70,
      attendance: (pageWidth - margin * 2 - 110) / attendanceCols,
    };

    let currentHeaderX = margin + 4;
    doc.text("No.", currentHeaderX, startTableY + 6);
    currentHeaderX += colWidths.no;

    doc.text("CÓDIGO", currentHeaderX + 4, startTableY + 6);
    currentHeaderX += colWidths.code;

    doc.text("NOMBRE DE ESTUDIANTE", currentHeaderX + 2, startTableY + 6);
    currentHeaderX += colWidths.name;

    for (let i = 0; i < attendanceCols; i++) {
      doc.text("", currentHeaderX + colWidths.attendance / 2, startTableY + 6, {
        align: "center",
      });
      currentHeaderX += colWidths.attendance;
    }

    // Agrupar estudiantes por carrera
    const byCareer = {};
    displayedData.forEach((e) => {
      const key = e.NombreCarrera || "OTROS";
      if (!byCareer[key]) byCareer[key] = [];
      byCareer[key].push(e);
    });

    let currentY = startTableY + headerHeight + 2;

    for (const [carrera, list] of Object.entries(byCareer)) {
      const idCarrera = list[0]?.IdCarrera || "Desconocido";
      const careerBlockHeight = 8; // Altura del bloque de carrera
      doc.setFillColor(235, 235, 235);
      doc.roundedRect(
        margin,
        currentY,
        innerWidth,
        careerBlockHeight,
        2,
        2,
        "F"
      );

      doc.setFont("helvetica", "bold").setFontSize(9); // Tamaño de fuente para carrera
      doc.setTextColor(0);
      doc.text(`CARRERA: ${idCarrera} -  ${carrera}`, margin + 4, currentY + 6);

      currentY += careerBlockHeight + 1;
      // Dibujar la tabla de estudiantes para esta carrera
      let counter = 1;
      const bodyStudents = list.map((e) => {
        const row = {
          no: counter++,
          code: e.CodigoEstudiante,
          name: e.FullNombreEstudiante,
        };
        for (let i = 0; i < attendanceCols; i++) {
          row[`att${i}`] = "";
        }
        return row;
      });
      // Ajustar el ancho de las columnas
      doc.autoTable({
        startY: currentY,
        margin: { left: margin, right: margin },
        columns,
        body: bodyStudents,
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 1,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: 0,
          fontStyle: "bold",
          halign: "center",
        },
        showHead: "never",
        columnStyles: {
          no: { halign: "center", cellWidth: colWidths.no },
          code: { halign: "center", cellWidth: colWidths.code },
          name: { halign: "left", cellWidth: colWidths.name },
          ...Object.fromEntries(
            Array.from({ length: attendanceCols }, (_, i) => [
              `att${i}`,
              { halign: "center", cellWidth: colWidths.attendance },
            ])
          ),
        },
        didParseCell: (data) => {
          const key = data.column.dataKey;
          if (key.startsWith("att")) {
            data.cell.styles.lineWidth = 0.1;
            data.cell.styles.lineColor = [180, 180, 180];
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 3;
    }

    // ✅ Mostrar total después de la última tabla
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.text(
      `Total estudiantes inscritos: ${displayedData.length}`,
      pageWidth - margin,
      currentY + 2,
      { align: "right" }
    );

    // ✅ Pie de página con email, fecha, hora, paginación
    const userEmail = user?.EmailKey || "Email no especificado";
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString("es-SV");
    const horaStr = fecha.toLocaleTimeString("es-SV", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const totalPagesExp = "{total_pages_count_string}";

    doc.autoTable({
      body: [],
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageNumber = doc.internal.getNumberOfPages();

        doc.setFontSize(8);
        doc.setTextColor(100);

        // IZQUIERDA: Fecha (arriba) y Hora (abajo)
        doc.text(`Fecha: ${fechaStr}`, margin, pageHeight - margin + 5); // izquierda arriba
        doc.text(`Hora: ${horaStr}`, margin, pageHeight - margin); // izquierda abajo

        // DERECHA: Paginación (arriba) y Email (abajo)
        doc.text(
          `Página ${pageNumber} de ${totalPagesExp}`,
          pageWidth - margin + 31, // posiciona paginacion a la derecha + 31
          pageHeight - margin,
          {
            align: "right",
          }
        );
        doc.text(`${userEmail}`, pageWidth - margin, pageHeight - margin + 5, {
          align: "right",
        });
      },
    });

    // Reemplazar total de páginas si está disponible
    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(totalPagesExp);
    }

    // Guardar el documento PDF
    doc.save("lista_asistencia.pdf");
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

    // Validar grupo (solo para docentes)
    if (
      needsGroup &&
      (grupoSeleccionado === "" || grupoSeleccionado == null || !grupoTouched)
    ) {
      missing.push("Grupo");
    }

    // Validar cuota (solo para usuarios con rol docente cuando seleccione Solvencia de Pagos)
    if (
      isDocente &&
      nombreReporte === "Solvencia de Pagos" &&
      (!cuotaSeleccionada || !cuotaTouched)
    ) {
      missing.push("Cuota");
    }

    return missing;
  }, [
    cicloActual,
    nombreReporte,
    isDecano,
    grupoSeleccionado,
    cicloTouched,
    reporteTouched,
    grupoTouched,
    cuotaSeleccionada,
    cuotaTouched,
  ]);

  // Mostrar vista previa solo si todos los filtros están seleccionados
  const canShowPreview = useMemo(() => {
    let baseValidation;
    if (needsGroup) {
      baseValidation =
        cicloActual &&
        nombreReporte &&
        grupoSeleccionado &&
        cicloTouched &&
        reporteTouched &&
        grupoTouched;
    } else {
      baseValidation =
        cicloActual && nombreReporte && cicloTouched && reporteTouched;
    }

    // Validar cuota para usuarios con rol docente cuando seleccione Solvencia de Pagos
    if (isDocente && nombreReporte === "Solvencia de Pagos") {
      return baseValidation && cuotaTouched && cuotaSeleccionada;
    }

    return baseValidation;
  }, [
    cicloActual,
    nombreReporte,
    grupoSeleccionado,
    needsGroup,
    cicloTouched,
    reporteTouched,
    grupoTouched,
    isDecano,
    cuotaTouched,
    cuotaSeleccionada,
  ]);

  const handleGenerarInforme = async (e) => {
    e.preventDefault();

    // Si el ciclo local es válido y diferente, aplicarlo al contexto antes de validar
    if (cicloValido && cicloInput && cicloInput !== cicloActual) {
      setCicloActual(cicloInput);
    }

    // Validar los campos faltantes y enfocar el primero que falte
    if (!(cicloInput || cicloActual) || !cicloTouched) {
      cicloRef.current?.focus();
      toast.error("Por favor selecciona un ciclo.");
      return;
    }

    if (needsGroup && (!grupoSeleccionado || !grupoTouched)) {
      grupoRef.current?.focus();
      toast.error("Por favor selecciona un grupo.");
      return;
    }

    // Validar cuota solo para usuarios docentes cuando seleccione Solvencia de Pagos
    if (
      isDocente &&
      nombreReporte === "Solvencia de Pagos" &&
      (!cuotaSeleccionada || !cuotaTouched)
    ) {
      toast.error("Por favor selecciona una cuota.");
      return;
    }

    if (!nombreReporte || !reporteTouched) {
      tipoReporteRef.current?.focus();
      toast.error("Por favor selecciona un tipo de reporte.");
      return;
    }

    // If user is decano and selects Tasa de Aprobacion, call POST endpoint
    if (
      isDecano &&
      nombreReporte === "Estudiantes Inscritos" &&
      !grupoSeleccionado
    ) {
      // Si es decano y no hay grupo seleccionado, usar lógica general de decano
      setDecanoLoading(true);
      setDecanoError(null);
      setReporteGenerado(true);
      try {
        const ESTUDIANTES_URL = process.env.NEXT_PUBLIC_ESTUDIANTES;
        const res = await fetch(ESTUDIANTES_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ciclo: cicloActual }),
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
      return;
      // ARREGLAR HACER PETICION AL BACK QUE NO ESTA CONF.
    } else if (
      isDecano &&
      nombreReporte === "Solvencia de Pagos" &&
      !grupoSeleccionado
    ) {
      // Si es decano y no hay grupo seleccionado, usar lógica general de decano
      setDecanoLoading(true);
      setDecanoError(null);
      setReporteGenerado(true);
      try {
        const SOLVENCIA_PAGOS_URL = process.env.NEXT_PUBLIC_SOLVENCIA_PAGOS;
        const res = await fetch(SOLVENCIA_PAGOS_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ciclo: cicloActual,
            idgrupo: 11096,
            cuota: cuotaLabelToNumber[cuotaSeleccionada] ?? 2,
          }),
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
      return;
    } else if (nombreReporte === "Solvencia de Pagos") {
      // Nuevo endpoint para solvencia de pagos
      setEstudiantesSolventesLoading(true);
      setEstudiantesSolventesError(null);
      setReporteGenerado(true);
      try {
        let requestBody;

        // Determinar el idgrupo a usar
        let idGrupoToUse;
        if (isDecano) {
          // Para decano, usar el grupo seleccionado o un valor por defecto
          idGrupoToUse = grupoSeleccionado || 11096;
        } else {
          // Para docente, usar el grupo seleccionado (obligatorio)
          idGrupoToUse = grupoSeleccionado;
        }

        // Construir el body con los campos obligatorios
        requestBody = {
          ciclo: cicloActual,
          idgrupo: idGrupoToUse,
          cuota: cuotaLabelToNumber[cuotaSeleccionada] ?? 2, // Mapear etiqueta a número para el backend
        };

        /* console.log("Enviando solicitud a solvencia-pagos:", {
          endpoint: "SOLVENCIA_PAGOS_URL",
          method: "POST",
          body: requestBody,
          isDecano,
          needsGroup,
          grupoSeleccionado,
          cicloActual,
        }); */

        const SOLVENCIA_PAGOS_URL = process.env.NEXT_PUBLIC_SOLVENCIA_PAGOS;
        const res = await fetch(SOLVENCIA_PAGOS_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        /* console.log("Respuesta del servidor:", {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        }); */

        if (!res.ok) {
          const text = await res.text();
          //console.error("Error del servidor:", text);
          throw new Error(text || `Error ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const payload = json && json.data ? json.data : json;
        setEstudiantesSolventesData(
          Array.isArray(payload) ? payload : [payload]
        );
      } catch (err) {
        setEstudiantesSolventesError(err.message || "Error al obtener datos");
        setEstudiantesSolventesData([]);
      } finally {
        setEstudiantesSolventesLoading(false);
      }
      return;
    }

    // Default behaviour for docentes/otros
    setReporteGenerado(true);
  };

  // Nota: evitamos bloquear toda la página durante la carga de grupos
  // para no interrumpir la escritura del ciclo. Mostramos estados inline.

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
                    value={cicloInput}
                    onChange={(e) => {
                      const rawDisplay = String(e.target.value || "");
                      const prevDisplay = String(cicloInput || "");
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

                      setCicloInput(formatted);
                      setCicloTouched(true);
                      setCicloValido(/^(01|02)\/\d{2}$/.test(formatted));
                    }}
                    onBlur={() => {
                      if (!cicloInput) return;
                      // Validar y, si es válido, aplicar al contexto (commit)
                      const valid = /^(01|02)\/\d{2}$/.test(
                        String(cicloInput).trim()
                      );
                      setCicloValido(valid);
                      if (valid && cicloInput !== cicloActual) {
                        setCicloActual(cicloInput);
                      }
                    }}
                    placeholder="Escribe un ciclo (ej. 01/25)"
                    className={`w-full px-3 py-2 border rounded-md ${
                      cicloValido ? "border-gray-200" : "border-red-400"
                    }`}
                  />
                </div>

                {showGroupSelect && (
                  <div className="min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Grupo
                    </label>
                    <Select
                      {...selectCommonProps}
                      ref={grupoRef}
                      options={grupoOptions}
                      isDisabled={grupoOptions.length === 0}
                      value={grupoOptions.find(
                        (opt) => opt.value === grupoSeleccionado
                      )}
                      onChange={(selected) => {
                        setGrupoSeleccionadoState(selected?.value || "");
                        setGrupoSeleccionado(selected?.value || "");
                        setGrupoTouched(true);
                      }}
                      placeholder="Selecciona un grupo"
                      classNamePrefix="react-select"
                    />
                    {tipoGrupoOptions.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Tipo de grupo
                        </label>
                        <Select
                          {...selectCommonProps}
                          options={tipoGrupoOptions}
                          value={tipoGrupoOptions.find(
                            (opt) => opt.value === tipoGrupoSeleccionado
                          )}
                          onChange={(selected) => {
                            const value = selected?.value || "";
                            setTipoGrupoSeleccionado(value);
                            // Si el grupo actual no pertenece al tipo, resetear selección
                            if (value) {
                              const matches = filteredGrupos.some(
                                (g) => g.IDGrupo === grupoSeleccionado
                              );
                              if (!matches) {
                                setGrupoSeleccionadoState("");
                                setGrupoSeleccionado("");
                                setGrupoTouched(false);
                              }
                            }
                          }}
                          placeholder="Selecciona tipo"
                          classNamePrefix="react-select"
                        />
                      </div>
                    )}
                    {grupoOptions.length === 0 && !gruposLoading && (
                      <p className="mt-1 text-[11px] text-amber-600">
                        No hay grupos para el ciclo seleccionado. Verifica el
                        ciclo o tus permisos.
                      </p>
                    )}
                  </div>
                )}

                <div className="min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Tipo de reporte
                  </label>
                  <Select
                    {...selectCommonProps}
                    ref={tipoReporteRef}
                    options={reporteOptions}
                    noOptionsMessage={() =>
                      userLoading
                        ? "Cargando..."
                        : "No hay opciones disponibles"
                    }
                    value={reporteOptions.find(
                      (opt) => opt.value === nombreReporte
                    )}
                    onChange={(selected) => {
                      setNombreReporte(selected?.value || "");
                      setReporteTouched(true);
                    }}
                    placeholder="Selecciona tipo de reporte"
                    classNamePrefix="react-select"
                  />
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
                        setCuotaSeleccionada(
                          selected?.value || "SEGUNDA CUOTA"
                        );
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
                        "Genere el informe primero usando el botón 'Generar Informe' y asegúrese de haber completado los filtros."
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
                        "Seleccione ciclo, tipo de reporte y grupo (si aplica) antes de exportar."
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

                <button
                  onClick={handleGenerarInforme}
                  disabled={!cicloValido}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-white ${
                    !cicloValido
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  Generar Informe
                </button>
              </div>
            </div>

            <div className="flex-1">
              {" "}
              <main className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col overflow-hidden min-h-0">
                {/*DESCOMENTAR -- 24/08/2025 23:15 -- */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Vista previa del Reporte
                    </h3>
                    <p className="text-sm text-gray-500">
                      {nombreReporte} · {cicloInput || "Ciclo no seleccionado"}
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
                            placeholder={
                              nombreReporte === "Solvencia de Pagos"
                                ? "Buscar por código, nombre, carrera, materia o docente..."
                                : nombreReporte === "Tasa de Aprobacion"
                                ? "Buscar por materia, docente o grupo..."
                                : "Buscar por materia o docente..."
                            }
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
                    ) : loadingReporte || estudiantesSolventesLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <ImSpinner9 className="animate-spin text-indigo-500 text-4xl" />
                      </div>
                    ) : errorMsg || estudiantesSolventesError ? (
                      <div className="p-6 text-rose-700">
                        {errorMsg || estudiantesSolventesError}
                      </div>
                    ) : displayedData.length === 0 ? (
                      <div className="p-6 text-yellow-800">
                        No hay estudiantes en el ciclo seleccionado.
                      </div>
                    ) : nombreReporte === "Solvencia de Pagos" ? (
                      <div className="min-w-full overflow-auto">
                        <table className="w-full table-auto border-collapse text-xs">
                          <thead className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left font-semibold">
                                Código Estudiante
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Nombre Completo
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Carrera
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Materia
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Docente
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Grupo
                              </th>
                              <th className="px-2 py-1 text-center font-semibold">
                                Cuota Pagos
                              </th>
                              <th className="px-2 py-1 text-left font-semibold">
                                Fecha Ingreso
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDisplayedData.map((estudiante, i) => (
                              <tr
                                key={estudiante.IDExpediente || i}
                                className={`border-b ${
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="px-2 py-1">
                                  {estudiante.CodigoEstudiante}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.NombreCompleto}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.IdCarrera}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.NombreMateria}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.NombreDocente}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.Grupo}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {estudiante.CuotaPagos}
                                </td>
                                <td className="px-2 py-1">
                                  {estudiante.FechaIngreso}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="min-w-full">
                        <table className="w-full table-fixed border-collapse text-xs">
                          <thead className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
                            <tr>
                              <th className="w-16 px-2 py-1 text-left text-xs font-semibold text-gray-600">
                                NO.
                              </th>
                              <th className="w-48 px-2 py-1 text-left text-xs font-semibold text-gray-600">
                                CÓDIGO
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">
                                NOMBRE DE ESTUDIANTE
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDisplayedData.map((e, index) => (
                              <tr
                                key={
                                  e.IDExpediente || e.CodigoEstudiante || index
                                }
                                className={`border-b ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="px-2 py-1 text-xs text-gray-700">
                                  {index + 1}
                                </td>
                                <td className="px-2 py-1 text-xs text-gray-700">
                                  {e.CodigoEstudiante || e.codigo || "-"}
                                </td>
                                <td className="px-2 py-1 text-xs text-gray-800">
                                  {e.FullNombreEstudiante ||
                                    e.nombre ||
                                    e.NombreEstudiante ||
                                    "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Presiona "Generar Informe" en la barra superior para
                      cargar datos.
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
