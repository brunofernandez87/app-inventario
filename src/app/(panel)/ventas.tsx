import { useEmpresa } from "@/context/empresaContext";
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
import VentaDetalle from "./detalleVenta";
export default function Venta() {
  const { width } = useWindowDimensions();
  const { empresa } = useEmpresa();
  const esPC = width >= 1024;
  const { listaVenta, cargando } = useListaVenta();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_venta.toString(),
    [],
  );
  const [listaFiltrada, setListaFiltrada] = useState(listaVenta);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<{
    id: number;
    ticket: string;
  } | null>(null);
  const [cliente, setCliente] = useState("Todos");
  const [usuario, setUsuario] = useState("Todos");
  const [ordenar, setOrdenar] = useState("fecha_venta");
  const [asc, setAsc] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );
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
    if (empresa?.fecha_creacion) {
      setFechaInicio(String(empresa.fecha_creacion).substring(0, 10));
    }
  }, [empresa]);
  useEffect(() => {
    let resultado = [...listaVenta];
    if (fechaInicio && fechaFin) {
      const inicio = new Date(`${fechaInicio}T00:00:00`).getTime();
      const fin = new Date(`${fechaFin}T23:59:59`).getTime();
      resultado = resultado.filter((v) => {
        const fechaVenta = new Date(v.fecha_venta).getTime();
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    }
    if (cliente != "Todos") {
      resultado = resultado.filter((v) => v.cliente === cliente);
    }
    if (usuario != "Todos") {
      resultado = resultado.filter(
        (v) => v.usuario?.nombre_usuario === usuario,
      );
    }
    resultado.sort((a, b) => {
      let valorA = a[ordenar];
      let valorB = b[ordenar];

      if (ordenar === "usuario") {
        valorA = a.usuario?.nombre_usuario || "";
        valorB = b.usuario?.nombre_usuario || "";
      }
      let resultado1 = valorA;
      let resultado2 = valorB;
      if (asc === false) {
        resultado1 = valorB;
        resultado2 = valorA;
      }
      if (ordenar === "fecha_venta") {
        return new Date(resultado1).getTime() - new Date(resultado2).getTime();
      }
      if (typeof valorA === "string") {
        return String(resultado1).localeCompare(String(resultado2));
      }
      return resultado2 - resultado1;
    });
    setListaFiltrada(resultado);
  }, [listaVenta, cliente, usuario, ordenar, asc, fechaInicio, fechaFin]);
  const manejarOrden = (columna: string) => {
    if (ordenar === columna) {
      setAsc(!asc);
    } else {
      setOrdenar(columna);
      setAsc(false);
    }
  };
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
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
            ventaSeleccionada?.id === item.id_venta && {
              backgroundColor: "#e2e8f0",
            },
          ]}
          onPress={() => {
            if (esPC) {
              setVentaSeleccionada({
                id: item.id_venta,
                ticket: item.numero_ticket,
              });
            } else {
              router.push({
                pathname: "/detalleVenta",
                params: { id: item.id_venta, ticket: item.numero_ticket },
              });
            }
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
          <View
            style={[styles.celda, { width: 120, alignItems: "flex-start" }]}
          >
            <Text style={styles.textoPrincipal} numberOfLines={2}>
              {item.estado || "Desconocido"}
            </Text>
          </View>
        </Pressable>
      );
    },
    [esPC, ventaSeleccionada],
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Stack.Screen options={{ title: "Historial de Ventas" }} />
      <Text style={styles.titulo}>Historial de ventas</Text>
      <View
        style={{ flex: 1, flexDirection: esPC ? "row" : "column", gap: 20 }}
      >
        <View style={{ flex: esPC ? 1.2 : 1 }}>
          {cargando ? (
            <Text style={styles.textoMensaje}>Cargando...</Text>
          ) : listaFiltrada.length === 0 ? (
            <Text style={styles.textoMensaje}>No hay ventas registradas.</Text>
          ) : (
            <View style={styles.contenedorTabla}>
              <View
                style={[
                  styles.contenedorFiltros,
                  {
                    flexDirection: width < 768 ? "column" : "row",
                    alignItems: "flex-end",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    flex: width >= 768 ? 1.5 : 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.textoFecha}>Fecha inicio</Text>
                    <input
                      style={{
                        height: 45,
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        padding: "0 12px",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                      placeholder="DD/MM/YYYY"
                      value={fechaInicio}
                      type="date"
                      onChange={(e) => {
                        setFechaInicio(e.target.value);
                      }}
                      maxLength={10}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.textoFecha}>Fecha fin</Text>
                    <input
                      style={{
                        height: 45,
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        padding: "0 12px",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                      placeholder="DD/MM/YYYY"
                      value={String(fechaFin)}
                      type="date"
                      onChange={(e) => {
                        const fecha = new Date(e.target.value);
                        setFechaFin(fecha);
                      }}
                      maxLength={10}
                    />
                  </View>
                </View>
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
                    <Text style={[styles.celdaEncabezado, { width: 60 }]}>
                      #
                    </Text>
                    <Pressable
                      onPress={() => {
                        manejarOrden("fecha_venta");
                      }}
                    >
                      <Text style={[styles.celdaEncabezado, { width: 140 }]}>
                        Fecha
                        {ordenar === "fecha_venta" ? (asc ? "↑" : "↓") : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        manejarOrden("cliente");
                      }}
                    >
                      <Text
                        style={[
                          styles.celdaEncabezado,
                          { flex: 1, minWidth: 150 },
                        ]}
                      >
                        Cliente {ordenar === "cliente" ? (asc ? "↑" : "↓") : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        manejarOrden("usuario");
                      }}
                    >
                      <Text
                        style={[
                          styles.celdaEncabezado,
                          { flex: 1, minWidth: 120 },
                        ]}
                      >
                        Realizada por{" "}
                        {ordenar === "usuario" ? (asc ? "↑" : "↓") : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        manejarOrden("total");
                      }}
                    >
                      <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                        Total {ordenar === "total" ? (asc ? "↑" : "↓") : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        manejarOrden("estado");
                      }}
                    >
                      <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                        Estado {ordenar === "estado" ? (asc ? "↑" : "↓") : ""}
                      </Text>
                    </Pressable>
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
        {esPC && (
          <View
            style={[
              styles.contenedorTabla,
              { flex: 0.8, backgroundColor: "#f8fafc" },
            ]}
          >
            {ventaSeleccionada ? (
              <VentaDetalle
                idProp={ventaSeleccionada.id}
                ticketProp={ventaSeleccionada.ticket}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={styles.textoMensaje}>
                  Seleccioná una venta para ver el detalle
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
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
  inputs: {
    height: 45,
    borderRadius: 8,
  },
  textoFecha: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 5,
  },
});
