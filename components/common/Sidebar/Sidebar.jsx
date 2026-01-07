import React, { useState } from "react";
import NavItem from "./NavItem";
import {
  FiHome,
  FiFolder,
  FiLogIn,
  FiTool,
  FiBarChart2,
  FiMenu,
  FiMail,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im"; // NUEVO: Ícono para el spinner
import { CiLogout } from "react-icons/ci";
import { useRouter } from "next/router";
import { useUser, UserProvider } from "@/context/contextUser";

export default () => (
  <UserProvider>
    <Sidebar />
  </UserProvider>
);

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Inicia cerrado
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isReportesOpen, setIsReportesOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  // No mostrar Sidebar en la página de login
  if (router.pathname === "/") return null;

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsLoggingOut(true);
    try {
      const NEXT_PUBLIC_LOGOUT = process.env.NEXT_PUBLIC_LOGOUT;
      const res = await fetch(NEXT_PUBLIC_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/");
      } else {
        console.error("Error al cerrar sesión");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoggingOut(false);
    }
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  // Define el color de fondo activo para el sidebar
  const activeSidebarBgColor = "bg-blue-700";

  // Aseguramos de que sea un arreglo
  const roles = Array.isArray(user?.sistemaasignacionroles)
    ? user.sistemaasignacionroles
    : [];

  const isDocente = roles.some((rol) => rol.IDRol === 10);
  const isRol2 = roles.some((rol) => rol.IDRol === 2);

  const shouldShowMantenimientos = (isDocente && isRol2) || isRol2;

  return (
    <>
      <aside
        className={`sticky top-0 h-screen bg-blue-700 text-white flex flex-col items-center p-5 transition-all duration-300 ${
          isOpen ? "w-52" : "w-20"
        } ${
          router.pathname === "/dashboard" ||
          router.pathname === "/grupos" ||
          router.pathname === "/evaluaciones" ||
          router.pathname === "/mantenimientos" ||
          router.pathname === "/reportes" ||
          router.pathname === "/solicitudes" || // CAMBIAR
          router.pathname === "/perfil"
            ? activeSidebarBgColor
            : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button // mb-8 antes
          className="mb-14 text-white focus:outline-none flex items-end justify-end"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiMenu size={24} />
        </button>
        <nav className="space-y-6 flex flex-col w-full">
          {" "}
          <NavItem
            label="Inicio"
            href="/dashboard"
            icon={<FiHome size={24} />}
            isOpen={isOpen}
            isActive={router.pathname === "/dashboard"}
          />
          <NavItem
            label="Grupos"
            href="/grupos"
            icon={<FiFolder size={24} />}
            isOpen={isOpen}
            isActive={router.pathname === "/grupos"}
          />
          <NavItem
            label="Evaluaciones"
            href="/evaluaciones"
            icon={<FiLogIn size={24} />}
            isOpen={isOpen}
            isActive={router.pathname === "/evaluaciones"}
          />
          {shouldShowMantenimientos && (
            <NavItem
              label="Mantenimientos"
              href="/mantenimientos"
              icon={<FiTool size={24} />}
              isOpen={isOpen}
              isActive={router.pathname === "/mantenimientos"}
            />
          )}
          <>
            <div
              onClick={() => setIsReportesOpen((s) => !s)}
              className={`relative flex items-center p-2 rounded group overflow-hidden transition-colors duration-200 ${
                router.pathname.startsWith("/reportes")
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-500/20"
              }`}
            >
              <span
                className={`min-w-[24px] mr-2 flex-shrink-0 ${
                  isOpen ? "justify-start" : "justify-center"
                } transition-opacity duration-200 ${
                  router.pathname.startsWith("/reportes")
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-100"
                }`}
              >
                <FiBarChart2 size={24} />
              </span>
              <span className="overflow-hidden">
                <span
                  className={`whitespace-nowrap transition-opacity duration-300 ${
                    isOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-[-10px]"
                  } ${
                    router.pathname.startsWith("/reportes") ? "text-white" : ""
                  }`}
                >
                  Reportes
                </span>
              </span>
              {!isOpen && (
                <span className="absolute left-full ml-3 min-w-max bg-gray-800 text-gray-100 text-xs rounded shadow-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Reportes
                </span>
              )}
              <span
                className={`ml-auto mr-0 transform transition-transform duration-200 ${
                  isReportesOpen ? "rotate-180" : "rotate-0"
                } ${isOpen ? "ml-2" : "hidden"}`}
              >
                <FiChevronDown size={16} />
              </span>
            </div>

            {isReportesOpen && isOpen && (
              <div className="-mt-8 space-y-2">
                <NavItem
                  label="Lista Reportes"
                  href="/reportes"
                  icon={<FiBarChart2 size={18} />}
                  isOpen={isOpen}
                  isActive={router.pathname === "/reportes"}
                />

                {isRol2 && (
                  <NavItem
                    label="Tasa Aprobación"
                    href="/reportes/tasa-aprobacion"
                    icon={<FiBarChart2 size={18} />}
                    isOpen={isOpen}
                    isActive={router.pathname === "/reportes/tasa-aprobacion"}
                  />
                )}
              </div>
            )}
          </>
          <NavItem
            label="Solicitudes"
            href="/solicitudes"
            icon={<FiMail size={24} />}
            isOpen={isOpen}
            isActive={router.pathname === "/solicitudes"}
          />
        </nav>
        <div className="flex-grow" />
        <hr className="border-t border-white opacity-25 my-4 w-full" />
        <div className="w-full space-y-6">
          <NavItem
            label="Perfil"
            href="/perfil"
            icon={<FiUser size={24} />}
            isOpen={isOpen}
            isActive={router.pathname === "/perfil"}
          />
          {/* Ítem de Cerrar Sesión */}
          <NavItem
            label="Cerrar Sesión"
            href="#"
            icon={<CiLogout size={24} />}
            isOpen={isOpen}
            isActive={false}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* Cierre de sesión */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <ImSpinner9 className="animate-spin h-8 w-8 text-blue-600" />
            <p className="mt-4 text-gray-800 font-medium">Cerrando sesión...</p>
          </div>
        </div>
      )}
    </>
  );
}
