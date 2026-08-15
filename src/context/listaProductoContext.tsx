import { createContext, useContext, useEffect, useState } from "react";
import { obtenerProductos } from "@/service/producto";
const ListaProductoContext = createContext(null);
export function ListaProductoProvider({ children }) {
  const [listaProducto, setlistaProducto] = useState([]);
  const [cargando, setCargando] = useState(true);
  const fetchProducts = async () => {
    setCargando(true);
    try {
      const data = await obtenerProductos();
      setlistaProducto(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);
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
