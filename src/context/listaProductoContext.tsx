import { obtenerProductos } from "@/service/producto";
import { createContext, useContext, useEffect, useState } from "react";
import { useEmpresa } from "./empresaContext";
const ListaProductoContext = createContext(null);
export function ListaProductoProvider({ children }) {
  const [listaProducto, setlistaProducto] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { empresa } = useEmpresa();
  const fetchProducts = async () => {
    if (!empresa || !empresa.id_empresa) {
      return; // Si no hay empresa, frenamos acá
    }
    setCargando(true);
    try {
      const data = await obtenerProductos(empresa.id_empresa);
      setlistaProducto(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, [empresa]);
  return (
    <ListaProductoContext.Provider
      value={{ listaProducto, setlistaProducto, cargando, fetchProducts }}
    >
      {children}
    </ListaProductoContext.Provider>
  );
}
export function useListaProducto() {
  const context = useContext(ListaProductoContext);
  if (!context) {
    throw new Error(
      "ListaProducto debe ser usado dentro de un ListaProductoProvider",
    );
  }
  return context;
}
