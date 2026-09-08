import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Empresa } from "../types/types";
import { obtenerEmpresa } from "../service/empresa";
import { useAuth } from "./authContext"; // Traemos el contexto de auth para saber quién entró

interface EmpresaContextType {
  empresa: Empresa | null;
  cargandoEmpresa: boolean;
  actualizarEmpresaLocal: (datosNuevos: Empresa) => void; // Por si el dueño edita el nombre de su local
}

const EmpresaContext = createContext<EmpresaContextType | null>(null);

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const { usuario } = useAuth(); // Leemos el usuario logueado
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false);

  useEffect(() => {
    // Si hay un usuario logueado, buscamos los datos de SU empresa
    const cargarDatosEmpresa = async () => {
      if (usuario?.id_empresa) {
        setCargandoEmpresa(true);
        const datos = await obtenerEmpresa(usuario.id_empresa);
        setEmpresa(datos);
        setCargandoEmpresa(false);
      } else {
        // Si nadie inició sesión, vaciamos la empresa
        setEmpresa(null);
      }
    };

    cargarDatosEmpresa();
  }, [usuario]); // Este useEffect se ejecuta cada vez que el "usuario" cambia (ej: al iniciar o cerrar sesión)

  // Función por si el día de mañana se hace una pantalla para editar el nombre de la empresa
  const actualizarEmpresaLocal = (datosNuevos: Empresa) => {
    setEmpresa(datosNuevos);
  };

  return (
    <EmpresaContext.Provider value={{ empresa, cargandoEmpresa, actualizarEmpresaLocal }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error("useEmpresa debe usarse dentro de un EmpresaProvider");
  }
  return context;
};