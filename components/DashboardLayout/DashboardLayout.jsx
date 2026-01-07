import Header from "../common/Hearder/Header";
import { NotificacionesProvider } from "../../context/contextNotificaciones";

export default function Layout({ children }) {
  return (
    <NotificacionesProvider>
      <div className="flex min-h-screen">
        <div className="flex-1">
          <Header />
          {children}
        </div>
      </div>
    </NotificacionesProvider>
  );
}
