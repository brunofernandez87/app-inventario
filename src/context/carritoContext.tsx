import { createContext, useContext, useState } from "react";
const ListaCarritoContext = createContext(null);
export function ListaCarritoProvider({ children }) {
  const [listaCarrito, setListaCarrito] = useState([]);
  const agregarAlCarrito = (producto) => {
    setListaCarrito((carritoAnterior) => {
      const productoExistente = carritoAnterior.find(
        (item) => item.id_producto === producto.id_producto,
      );
      if (productoExistente) {
        return carritoAnterior.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: (item.cantidad || 1) + 1 }
            : item,
        );
      } else {
        return [...carritoAnterior, { ...producto, cantidad: 1 }];
      }
    });
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
