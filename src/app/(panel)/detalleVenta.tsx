import { imprimirPresupuesto } from "@/components/pdf/presupuesto";
import { useEmpresa } from "@/context/empresaContext";
import { obtenerDetallesPorVenta } from "@/service/detalle_venta";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function VentaDetalle({
  idProp,
  ticketProp,
}: {
  idProp?: number;
  ticketProp?: string;
}) {
  const params = useLocalSearchParams();
  const id = idProp || params.id;
  const ticket = ticketProp || params.ticket;
  const { empresa } = useEmpresa();
  const [listaDetalle, setListaDetalle] = useState([]);
  const [cargando, setCargando] = useState(true);
  const total = listaDetalle.length > 0 ? listaDetalle[0].venta.total : 0;
  const descuento =
    listaDetalle.length > 0 ? listaDetalle[0].descuento_admin : 0;
  useEffect(() => {
    const buscarDetalle = async () => {
      if (!id || !empresa?.id_empresa) return;
      setCargando(true);
      const resultados = await obtenerDetallesPorVenta(
        Number(id),
        empresa.id_empresa,
      );
      setListaDetalle(resultados || []);
      setCargando(false);
    };
    buscarDetalle();
  }, [id, empresa]);
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_detalle.toString(),
    [],
  );
  const imprimirListaPDF = async () => {
    const cliente =
      listaDetalle.length > 0 && listaDetalle[0].venta.cliente
        ? listaDetalle[0].venta.cliente
        : "Consumidor Final";
    await imprimirPresupuesto(listaDetalle, empresa, cliente, total, descuento);
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <View style={styles.fila}>
        {/* Producto */}
        <View style={{ flex: 4 }}>
          <Text style={styles.textoPrincipal}>
            {item.producto.nombre_producto}
          </Text>
        </View>
        {/* Cantidad */}
        <View style={{ flex: 1 }}>
          <Text style={styles.textoNormal} numberOfLines={1}>
            {item.cantidad}
          </Text>
        </View>
        {/* Paquete cerrado */}
        <View style={{ flex: 1.5 }}>
          <Text style={styles.textoNormal} numberOfLines={1}>
            {item.producto.medida.nombre_tipo}
          </Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={styles.textoNormal} numberOfLines={1}>
            {item.es_paquete_cerrado ? "Paquete cerrado" : "Suelto"}
          </Text>
        </View>
        {/* Precio */}
        <View style={{ flex: 2 }}>
          <Text style={styles.textoNormal}>
            ${Number(item.precio_unitario || 0).toFixed(2)}
          </Text>
        </View>

        {/* subtotal */}
        <View style={{ flex: 2 }}>
          <Text
            style={[styles.textoPrincipal, { color: "#15803d" }]}
            numberOfLines={2}
          >
            ${item.subtotal || "Desconocido"}
          </Text>
        </View>
      </View>
    );
  }, []);
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f8fafc" }}>
      <Stack.Screen
        options={{ title: `Detalle del Ticket #${ticket || id}` }}
      />
      <Text style={styles.titulo}>Detalle de la venta numero {ticket}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.botonImprimir,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => imprimirListaPDF()}
      >
        <Text style={styles.textoBoton}>Imprimir Detalle</Text>
      </Pressable>
      <View style={styles.contenedorTabla}>
        <View style={styles.encabezadoRow}>
          <Text style={[styles.celdaEncabezado, { flex: 4 }]}>Producto</Text>
          <Text style={[styles.celdaEncabezado, { flex: 1 }]}>Cant.</Text>
          <Text style={[styles.celdaEncabezado, { flex: 1.5 }]}>Tipo</Text>
          <Text style={[styles.celdaEncabezado, { flex: 1.5 }]}>Paquete</Text>
          <Text style={[styles.celdaEncabezado, { flex: 2 }]}>Precio</Text>
          <Text style={[styles.celdaEncabezado, { flex: 2 }]}>Subtotal</Text>
        </View>
        {cargando ? (
          <Text style={styles.textoMensaje}>Cargando productos...</Text>
        ) : listaDetalle.length === 0 ? (
          <Text style={styles.textoMensaje}>
            No hay productos registrados para esta venta.
          </Text>
        ) : (
          <View>
            <FlatList
              // flatList ya viene con scroll view y podes limitar las columnas con num columns
              // es el arreglo que va a recorrer
              data={listaDetalle}
              // sirve para saber cual es la clave de cada fila tiene que ser string lo que se pasa en key extractor
              keyExtractor={memoizedKeyExtractor}
              // se le muestra como muestra el item desestructurandolo
              renderItem={renderItem}
              // Optimizaciones extra para FlatList con muchos datos:
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
            <View style={styles.contenedorTotales}>
              <View style={styles.filaTotalColumna}>
                <View style={{ flex: 8 }} />
                <View style={{ flex: 2 }}>
                  <Text style={styles.etiquetaTotalColumna}>
                    descuento por dueño:
                  </Text>
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.valorDescuentoColumna}>{descuento}%</Text>
                </View>
              </View>
              <View style={styles.filaTotalColumna}>
                <View style={{ flex: 8 }} />
                <View style={{ flex: 2 }}>
                  <Text style={styles.etiquetaTotalFinalColumna}>
                    Total Final:{" "}
                  </Text>
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.valorTotalFinalColumna}>
                    ${Number(total || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#1e293b",
  },
  contenedorTabla: {
    flex: 1,
  },
  encabezadoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 10,
    marginBottom: 5,
  },
  celdaEncabezado: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748b",
  },
  fila: {
    flexDirection: "row", // Acomoda todo horizontalmente
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  textoPrincipal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  textoNormal: {
    fontSize: 14,
    color: "#475569",
  },
  textoMensaje: {
    padding: 20,
    fontSize: 15,
    color: "#64748b",
  },
  botonImprimir: {
    width: 80,
    backgroundColor: "#2563eb",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  textoBoton: {
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  contenedorTotales: {
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
    marginTop: 5,
  },
  filaTotalColumna: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15, // Importante: Usa el mismo padding que styles.fila para que no se desfase
    marginBottom: 10,
  },
  etiquetaTotalColumna: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "bold",
  },
  valorDescuentoColumna: {
    fontSize: 14,
    color: "#dc2626", // Rojo
    fontWeight: "bold",
  },
  etiquetaTotalFinalColumna: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "bold",
  },
  valorTotalFinalColumna: {
    fontSize: 16,
    color: "#15803d", // Verde
    fontWeight: "bold",
  },
});
