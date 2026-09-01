import { useListaVenta } from "@/context/listaVentaContext";
import { Stack } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Venta() {
  const { listaVenta, cargando } = useListaVenta();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_venta.toString(),
    [],
  );
  const renderItem = useCallback(({ item }: { item: any }) => {
    const fechaFormateada = new Date(item.fecha_venta).toLocaleDateString(
      "es-AR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );
    return (
      <Pressable
        style={({ pressed }) => [
          styles.fila,
          pressed && { backgroundColor: "#f8fafc" },
        ]}
        onPress={() => console.log("Abrir detalle de venta:", item.id_venta)}
      >
        <View style={[styles.celda, { width: 60 }]}>
          <Text style={styles.textoSecundario}>#{item.id_venta}</Text>
        </View>

        {/* Fecha */}
        <View style={[styles.celda, { width: 140 }]}>
          <Text style={styles.textoPrincipal} numberOfLines={1}>
            {fechaFormateada}
          </Text>
        </View>

        {/* Cliente */}
        <View style={[styles.celda, { flex: 1, minWidth: 150 }]}>
          <Text
            style={[styles.textoPrincipal, { fontSize: 14 }]}
            numberOfLines={1}
          >
            {item.cliente || "Cliente"}
          </Text>
        </View>
        {/* Usuario */}
        <View style={[styles.celda, { flex: 1, minWidth: 120 }]}>
          <Text style={styles.textoSecundario} numberOfLines={1}>
            {item.usuario.nombre_usuario}
          </Text>
        </View>

        {/* Total */}
        <View style={[styles.celda, { width: 120 }]}>
          <Text
            style={[
              styles.textoPrincipal,
              { fontWeight: "bold", fontSize: 15 },
            ]}
          >
            $ {Number(item.total || 0).toFixed(2)}
          </Text>
        </View>

        {/* Estado (Badge) */}
        <View style={[styles.celda, { width: 120, alignItems: "flex-start" }]}>
          <Text style={styles.textoPrincipal} numberOfLines={2}>
            {item.estado || "Desconocido"}
          </Text>
        </View>
      </Pressable>
    );
  }, []);
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Stack.Screen options={{ title: "Historial de Ventas" }} />
      <Text style={styles.titulo}>Historial de ventas</Text>
      {cargando ? (
        <Text style={styles.textoMensaje}>Cargando...</Text>
      ) : listaVenta.length === 0 ? (
        <Text style={styles.textoMensaje}>No hay ventas registradas.</Text>
      ) : (
        <View style={styles.contenedorTabla}>
          <ScrollView horizontal={true} style={{ flex: 1 }}>
            <View style={{ minWidth: 800, width: "100%" }}>
              <View style={styles.encabezadoRow}>
                <Text style={[styles.celdaEncabezado, { width: 60 }]}>#</Text>
                <Text style={[styles.celdaEncabezado, { width: 140 }]}>
                  Fecha
                </Text>
                <Text
                  style={[styles.celdaEncabezado, { flex: 1, minWidth: 150 }]}
                >
                  Cliente
                </Text>
                <Text
                  style={[styles.celdaEncabezado, { flex: 1, minWidth: 120 }]}
                >
                  Realizada por
                </Text>
                <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                  Total
                </Text>
                <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                  Estado
                </Text>
              </View>
              <FlatList
                // flatList ya viene con scroll view y podes limitar las columnas con num columns
                // es el arreglo que va a recorrer
                data={listaVenta}
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
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  titulo: {
    fontSize: 40,
    fontWeight: "600",
    textAlign: "left",
    color: "#1e293b",
    marginBottom: 10,
  },
  contenedorTabla: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: "hidden",
  },
  encabezadoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  celdaEncabezado: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    paddingHorizontal: 5,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 18,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  celda: { paddingHorizontal: 5, justifyContent: "center" },
  textoPrincipal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  textoSecundario: { fontSize: 13, color: "#94a3b8" },
  textoMensaje: { fontSize: 15, color: "#64748b", marginTop: 20 },
  textoEnlace: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb", // Azul similar al de la imagen
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
});
