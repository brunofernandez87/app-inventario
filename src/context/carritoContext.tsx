import { createContext, useContext, useState } from "react";
const ListaCarritoContext = createContext(null);
export function ListaCarritoProvider({ children }) {
  const [listaCarrito, setListaCarrito] = useState([]);
  const agregarAlCarrito = (producto) => {
    setListaCarrito((carritoAnterior) => [...carritoAnterior, producto]);
  };
  const vaciarCarrito = () => {
    setListaCarrito([]);
  };
  return (
    <ListaCarritoContext.Provider
      value={{ listaCarrito, setListaCarrito, agregarAlCarrito, vaciarCarrito }}
    >
      {children}
    </ListaCarritoContext.Provider>
  );
}
export function useListaCarrito() {
  const context = useContext(ListaCarritoContext);
  if (!context) {
    throw new Error(
      "ListaCarrito debe ser usado dentro de un ListaCarritoProvider",
    );
  }
  return context;
}
