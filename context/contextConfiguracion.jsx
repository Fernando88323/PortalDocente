import { createContext, useContext, useState, useEffect } from "react";

const ConfiguracionContext = createContext();

export function ConfiguracionProvider({ children }) {
  const [enableNotes, setEnableNotes] = useState(false);

  // Cargar el valor inicial desde el backend al montar
  useEffect(() => {
    fetch("http://localhost:4000/configuracion/notas", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEnableNotes(!!data.habilitada))
      .catch(() => setEnableNotes(false));
  }, []);

  return (
    <ConfiguracionContext.Provider
      value={{
        enableNotes,
        setEnableNotes,
      }}
    >
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion() {
  return useContext(ConfiguracionContext);
}
