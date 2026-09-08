import { useAuth } from "@/context/authContext";
import { useListaCarrito } from "@/context/carritoContext";
import { useEmpresa } from "@/context/empresaContext";
import { crearDetalleVenta } from "@/service/detalle_venta";
import { getMedidas } from "@/service/medida";
import { crearVenta } from "@/service/venta";
import { Venta } from "@/types/types";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";

export default function Carrito() {
  const { width } = useWindowDimensions();
  const [listaMedida, setListamedida] = useState([]);
  const [descuento, setDescuento] = useState("0");
  const [porcentaje, setPorcentaje] = useState(false);
  const { listaCarrito, setListaCarrito, vaciarCarrito } = useListaCarrito();
  const celular = width < 768;
  const totalCompra = listaCarrito.reduce((acumulador, item) => {
    const cantidad = item.cantidad || 1;
    return acumulador + item.precio_venta * cantidad;
  }, 0);
  const { usuario } = useAuth();
  const { empresa } = useEmpresa();
  useEffect(() => {
    const buscarMedidas = async () => {
      if (!empresa?.id_empresa) return;
      const medidas = await getMedidas(empresa?.id_empresa);
      setListamedida(medidas);
    };
    buscarMedidas();
  }, [empresa]);
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const medida = listaMedida.find((m) => m.id_medida === item.id_medida);
      const cantidad = item.cantidad || 1;
      const subtotal = item.precio_venta * cantidad;
      return (
        <Pressable style={({ pressed }) => [styles.fila]}>
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
              {item.marca} • {medida?.nombre_tipo}
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
              style={[
                styles.textoPrincipal,
                { fontSize: 14, color: "#15803d" },
              ]}
            >
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          <Pressable
            onPress={() => eliminacionProducto(item)}
            style={{
              padding: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#ef4444", fontWeight: "bold", fontSize: 16 }}
            >
              X
            </Text>
          </Pressable>
        </Pressable>
      );
    },
    [listaMedida],
  );
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
  const eliminacionProducto = (producto) => {
    setListaCarrito((carritoAnterior) =>
      carritoAnterior.filter(
        (item) => item.id_producto !== producto.id_producto,
      ),
    );
  };
  const total = () => {
    if (Number(descuento) != 0) {
      if (porcentaje == true) {
        const porcentajeDescuento = Number(descuento);
        const totalDescuento = totalCompra * (porcentajeDescuento / 100);
        const total = totalCompra - totalDescuento;
        return total;
      } else {
        const total = totalCompra - Number(descuento);
        return total;
      }
    } else {
      return totalCompra;
    }
  };
  const comprar = async () => {
    const totalDescuento = total();
    const nuevaVenta: Omit<Venta, "id_venta" | "fecha_venta"> = {
      id_empresa: Number(empresa?.id_empresa),
      id_usuario: Number(usuario?.id_usuario),
      total: Number(totalDescuento),
      estado: "finalizado",
      cliente: "juan",
    };
    const venta = await crearVenta(nuevaVenta);
    if (!venta) {
      return alert("Error al registrar la venta");
    }
    const nuevoDetalle = listaCarrito.map((p) => {
      let paquete_cerrado = false;
      if (p.cantidad == p.unidades_por_paquete) {
        paquete_cerrado = true;
      } else {
        paquete_cerrado = false;
      }
      return {
        id_venta: venta.id_venta,
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        es_paquete_cerrado: paquete_cerrado,
        precio_unitario: p.precio_venta,
        subtotal: p.precio_venta * p.cantidad,
      };
    });
    const detalle = await crearDetalleVenta(nuevoDetalle);
    if (detalle) {
      alert("Venta realizada con exito");
      vaciarCarrito();
    } else {
      return alert("Error al registrar la venta");
    }
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
              <Text style={styles.textoTotal}>Descuento opcional:</Text>
              <TextInput
                value={descuento}
                onChangeText={(texto) => {
                  const limpio = texto.replace(/[^0-9.]/g, "");
                  setDescuento(limpio);
                }}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Pressable
                onPress={() => setPorcentaje(!porcentaje)}
                style={[
                  {
                    backgroundColor: porcentaje ? "#2563eb" : "#e5e7eb",
                    padding: 10,
                    borderRadius: 5,
                    marginVertical: 5,
                  },
                ]}
              >
                <Text style={[{ color: porcentaje ? "white" : "black" }]}>
                  {porcentaje ? "☑ Porcentaje" : "☐ Porcentaje"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.footerContainer}>
              <Text style={styles.textoTotal}>Total: {total().toFixed(2)}</Text>
            </View>

            <View>
              <Pressable onPress={comprar} style={styles.botonComprar}>
                <Text style={styles.textoBotonComprar}>Comprar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
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
