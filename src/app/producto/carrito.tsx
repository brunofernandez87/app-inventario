import { useListaCarrito } from "@/context/carritoContext";
import { BlurView } from "expo-blur";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import VentanaConfirmacion from "../ventanaConfirmacion";

export default function Carrito() {
  const { width } = useWindowDimensions();
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(false);
  const { listaCarrito, setListaCarrito, vaciarCarrito } = useListaCarrito();
  const celular = width < 768;
  const totalCompra = listaCarrito.reduce((acumulador, item) => {
    const cantidad = item.cantidad || 1;
    return acumulador + item.precio_venta * cantidad;
  }, 0);
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const renderItem = useCallback(({ item }: { item: any }) => {
    const cantidad = item.cantidad || 1;
    const subtotal = item.precio_venta * cantidad;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.fila,
          pressed && { backgroundColor: "#fee2e2" }, // Efecto visual al mantener apretado
        ]}
        onLongPress={() => eliminar(item)}
      >
        <View style={[styles.celda, { flex: 1.2 }]}>
          <Text style={styles.textoPrincipal} numberOfLines={1}>
            {item.codigo_alfanumerico}
          </Text>
          <Text style={styles.textoSecundario} numberOfLines={1}>
            {item.codigo_barras}
          </Text>
        </View>

        {/* Producto */}
        <View style={[styles.celda, { flex: 2 }]}>
          <Text
            style={[styles.textoPrincipal, { fontSize: 15 }]}
            numberOfLines={1}
          >
            {item.nombre_producto}
          </Text>
          <Text style={styles.textoSecundario} numberOfLines={1}>
            {item.marca} • unidad
          </Text>
        </View>
        {/* Precio */}
        <View style={[styles.celda, { flex: 1 }]}>
          <Text style={[styles.textoPrincipal, { fontSize: 15 }]}>
            ${item.precio_venta}
          </Text>
        </View>
        {/* Cantidad (Con los botones + y -) */}
        <View
          style={[
            styles.celda,
            {
              width: 90,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 2,
            },
          ]}
        >
          <Pressable
            onPress={() => cambiarCantidad(item.id_producto, "restar")}
            style={styles.botonCantidad}
          >
            <Text style={styles.textoBotonCantidad}>-</Text>
          </Pressable>

          <Text
            style={[styles.textoPrincipal, { fontSize: 15, marginBottom: 0 }]}
          >
            {cantidad}
          </Text>

          <Pressable
            onPress={() => cambiarCantidad(item.id_producto, "sumar")}
            style={styles.botonCantidad}
          >
            <Text style={styles.textoBotonCantidad}>+</Text>
          </Pressable>
        </View>
        {/* Subtotal */}
        <View style={[styles.celda, { flex: 1.2, alignItems: "flex-end" }]}>
          <Text
            style={[styles.textoPrincipal, { fontSize: 14, color: "#15803d" }]}
          >
            ${subtotal.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={() => eliminar(item)}
          style={{ padding: 5, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#ef4444", fontWeight: "bold", fontSize: 16 }}>
            X
          </Text>
        </Pressable>
      </Pressable>
    );
  }, []);
  const cambiarCantidad = (id_producto, operacion) => {
    setListaCarrito((carritoAnterior) =>
      carritoAnterior.map((item) => {
        if (item.id_producto === id_producto) {
          const cantidadActual = item.cantidad || 1;
          let nuevaCantidad =
            operacion === "sumar" ? cantidadActual + 1 : cantidadActual - 1;
          // Evitamos que baje de 1. Si quiere eliminarlo, que mantenga apretado.
          if (nuevaCantidad < 1) {
            nuevaCantidad = 1;
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      }),
    );
  };
  const eliminar = (producto) => {
    setProductoAEditar(producto);
    setModalEliminar(true);
  };
  const eliminacionProducto = (producto) => {
    setListaCarrito((carritoAnterior) =>
      carritoAnterior.filter(
        (item) => item.id_producto !== producto.id_producto,
      ),
    );
    setModalEliminar(false);
  };
  const comprar = () => {
    vaciarCarrito();
    alert("compra realizada");
    //utilizar mas adelante el service de venta
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={styles.tituloHeader}>Carrito</Text>
      <View style={{ flex: 1 }}>
        {listaCarrito.length === 0 ? (
          <Text style={styles.textoVacio}>No hay productos en el carrito</Text>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView horizontal={true} style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <View style={styles.encabezadoRow}>
                  <Text style={[styles.celdaEncabezado, { flex: 1.2 }]}>
                    Código
                  </Text>
                  <Text style={[styles.celdaEncabezado, { flex: 2 }]}>
                    Producto
                  </Text>
                  <Text style={[styles.celdaEncabezado, { flex: 1 }]}>
                    Precio
                  </Text>
                  <Text
                    style={[
                      styles.celdaEncabezado,
                      { width: 90, textAlign: "center" },
                    ]}
                  >
                    Cantidad
                  </Text>
                  <Text
                    style={[
                      styles.celdaEncabezado,
                      { flex: 1.2, textAlign: "right" },
                    ]}
                  >
                    Subtotal
                  </Text>
                </View>
                <FlatList
                  // flatList ya viene con scroll view y podes limitar las columnas con num columns
                  // es el arreglo que va a recorrer
                  data={listaCarrito}
                  // sirve para saber cual es la clave de cada fila tiene que ser string lo que se pasa en key extractor
                  keyExtractor={memoizedKeyExtractor}
                  // se le muestra como muestra el item desestructurandolo
                  renderItem={renderItem}
                  // Optimizaciones extra para FlatList con muchos datos:
                  initialNumToRender={15}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              </View>
            </ScrollView>
            <View style={styles.footerContainer}>
              <Text style={styles.textoTotal}>
                Total: {totalCompra.toFixed(2)}
              </Text>
            </View>
            <View>
              <Pressable onPress={comprar} style={styles.botonComprar}>
                <Text style={styles.textoBotonComprar}>Comprar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <Modal
        animationType="fade"
        transparent={true} // Permite ver el fondo oscuro
        visible={modalEliminar}
        onRequestClose={() => setModalEliminar(false)} // Permite cerrar con el botón "Atrás" de Android
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[styles.modalVentana, celular && styles.modalVentanaCelular]}
          >
            {productoAEditar && (
              <VentanaConfirmacion
                onClose={() => setModalEliminar(false)}
                texto={"que desea eliminar este producto del carrito"}
                onConfirm={() => eliminacionProducto(productoAEditar)}
              />
            )}
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  tituloHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  textoVacio: { fontSize: 14, color: "#64748b", marginTop: 20 },
  encabezadoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  celdaEncabezado: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    paddingHorizontal: 5,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  celda: { paddingHorizontal: 2, justifyContent: "center" },
  textoPrincipal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  textoSecundario: { fontSize: 12, color: "#94a3b8" },
  modalVentana: {
    width: "100%",
    maxWidth: 400, // Limita el ancho en la PC
    maxHeight: "90%", // Evita que se salga de la pantalla si es muy largo
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden", // Para que el ScrollView interno no tape los bordes redondos
  },
  modalVentanaCelular: {
    padding: 5,
  },
  botonCantidad: {
    backgroundColor: "#f1f5f9",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textoBotonCantidad: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    lineHeight: 18,
  },
  modalFondo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  /* Estilos para que el footer */
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 15,
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  botonComprar: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoBotonComprar: {
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});
