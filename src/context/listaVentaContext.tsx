import { obtenerVentas } from "@/service/venta";
import { createContext, useContext, useEffect, useState } from "react";
import { useEmpresa } from "./empresaContext";
const ListaVentaContext = createContext(null);
export function ListaVentaProvider({ children }) {
  const [listaVenta, setListaVenta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { empresa } = useEmpresa();
  const fetchVenta = async () => {
    if (!empresa || !empresa.id_empresa) {
      return; // Si no hay empresa, frenamos acá
    }
    setCargando(true);
    try {
      const data = await obtenerVentas(empresa.id_empresa);
      setListaVenta(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    fetchVenta();
  }, [empresa]);
  return (
    <ListaVentaContext.Provider
      value={{ listaVenta, setListaVenta, cargando, fetchVenta }}
    >
      {children}
    </ListaVentaContext.Provider>
  );
}
export function useListaVenta() {
  const context = useContext(ListaVentaContext);
  if (!context) {
    throw new Error(
      "ListaVenta debe ser usado dentro de un ListaVentaProvider",
    );
  }
  return context;
}
