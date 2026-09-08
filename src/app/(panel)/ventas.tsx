import { useListaVenta } from "@/context/listaVentaContext";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function Venta() {
  const { width } = useWindowDimensions();
  const { listaVenta, cargando } = useListaVenta();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_venta.toString(),
    [],
  );
  const [listaFiltrada, setListaFiltrada] = useState(listaVenta);
  const [cliente, setCliente] = useState("Todos");
  const [usuario, setUsuario] = useState("Todos");
  const listaCliente = [
    { label: "Todos los clientes", value: "Todos" },
    ...Array.from(new Set(listaVenta.map((v) => v.cliente)))
      .filter(
        (cliente) =>
          cliente !== null && cliente !== undefined && cliente !== "",
      )
      .map((c) => ({
        label: c,
        value: c,
      })),
  ];
  const listaUsuarios = [
    { label: "Todos los usuarios", value: "Todos" },
    ...Array.from(new Set(listaVenta.map((v) => v.usuario?.nombre_usuario)))
      .filter(
        (usuario) =>
          usuario !== null && usuario !== undefined && usuario !== "",
      )
      .map((u) => ({
        label: u,
        value: u,
      })),
  ];
  useEffect(() => {
    let resultado = listaVenta;
    if (cliente != "Todos") {
      resultado = resultado.filter((v) => v.cliente === cliente);
    }
    if (usuario != "Todos") {
      resultado = resultado.filter(
        (v) => v.usuario?.nombre_usuario === usuario,
      );
    }
    setListaFiltrada(resultado);
  }, [listaVenta, cliente, usuario]);
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
        onPress={() => {
          router.push({
            pathname: "/detalleVenta",
            params: { id: item.id_venta, ticket: item.numero_ticket },
          });
        }}
      >
        <View style={[styles.celda, { width: 60 }]}>
          <Text style={styles.textoSecundario}>{item.numero_ticket}</Text>
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
      ) : listaFiltrada.length === 0 ? (
        <Text style={styles.textoMensaje}>No hay ventas registradas.</Text>
      ) : (
        <View style={styles.contenedorTabla}>
          <View
            style={[
              styles.contenedorFiltros,
              { flexDirection: width < 768 ? "column" : "row" },
            ]}
          >
            <Dropdown
              style={[styles.dropdown, width >= 768 && { flex: 1 }]}
              data={listaCliente}
              search={true}
              searchPlaceholder="Escribi el nombre del cliente..."
              labelField="label"
              valueField="value"
              placeholder="seleccionar cliente"
              value={cliente}
              onChange={(item) => {
                setCliente(item.value);
              }}
            />
            <Dropdown
              style={[styles.dropdown, width >= 768 && { flex: 1 }]}
              data={listaUsuarios}
              search={true}
              searchPlaceholder="Escribi el nombre del usuario..."
              labelField="label"
              valueField="value"
              placeholder="seleccionar usuario"
              value={usuario}
              onChange={(item) => {
                setUsuario(item.value);
              }}
            />
          </View>
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
                data={listaFiltrada}
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
  contenedorFiltros: {
    gap: 15,
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dropdown: {
    height: 45,
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
});
