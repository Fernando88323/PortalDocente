import "../styles/globals.css";
import Sidebar from "../components/common/Sidebar/Sidebar";
import { useRouter } from "next/router";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import Mantenimientos from "./mantenimientos";
import { NotificacionesProvider } from "../context/contextNotificaciones";
import { UserProvider } from "../context/contextUser";
import { CicloActualProvider } from "../context/contextCicloActual";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const hideSidebarRoutes = ["/"];
  const excludeMaintenanceRoutes = ["/", "/login"];

  const [maintenanceMsg, setMaintenanceMsg] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (excludeMaintenanceRoutes.includes(router.pathname)) {
      setChecking(false);
      return;
    }

    const fetchMantenimientos = async () => {
      try {
        const MANTENIMIENTOS_URL = process.env.NEXT_PUBLIC_MANTENIMIENTOS;
        const res = await fetch(MANTENIMIENTOS_URL);

        if (res.status === 503) {
          const data = await res.json();
          setMaintenanceMsg(data.message);
        } else {
          setMaintenanceMsg(null);
        }
      } catch (error) {
        console.error("Error al verificar mantenimiento:", error);
      } finally {
        setChecking(false);
      }
    };

    fetchMantenimientos();
  }, [router.pathname]);

  if (checking) return null;

  return (
    <UserProvider>
      <CicloActualProvider>
        <Head>
          <title>Portal Docente USO</title>
          <link
            rel="icon"
            href="https://website.usonsonate.edu.sv/SeguimientoAcademico/assets/img/logoTransparente.png"
          />
        </Head>
        <NotificacionesProvider>
          <div className="flex">
            {!hideSidebarRoutes.includes(router.pathname) && <Sidebar />}
            <div className="flex-1 bg-white">
              {maintenanceMsg ? (
                <Mantenimientos message={maintenanceMsg} />
              ) : (
                <Component {...pageProps} />
              )}
              <Toaster position="bottom-left" />
            </div>
          </div>
        </NotificacionesProvider>
      </CicloActualProvider>
    </UserProvider>
  );
}

export default MyApp;
