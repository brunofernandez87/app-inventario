import { obtenerHistorialMovimientos } from "@/service/movimiento_stock";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MovimientosScreen() {
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const opcionesFiltro = ["Todos", "Entrada", "Salida", "Devuelto"];

  const ID_EMPRESA_ACTUAL = 1;

  useFocusEffect(
    useCallback(() => {
      const cargarDatos = async () => {
        setLoading(true);
        const data = await obtenerHistorialMovimientos(ID_EMPRESA_ACTUAL);
        setMovimientos(data);
        setLoading(false);
      };
      cargarDatos();
    }, []),
  );

  const movimientosFiltrados = movimientos.filter((mov) => {
    const nombreProd = mov.producto?.nombre_producto?.toLowerCase() || "";
    const codigoProd = mov.producto?.codigo_barras?.toLowerCase() || "";
    const motivo = mov.motivo?.toLowerCase() || "";
    const tipo = mov.tipo_movimiento?.toUpperCase() || "";

    const coincideBusqueda =
      nombreProd.includes(busqueda.toLowerCase()) ||
      codigoProd.includes(busqueda.toLowerCase()) ||
      motivo.includes(busqueda.toLowerCase());

    let coincideTipo = true;
    if (filtroTipo === "Entrada") {
      coincideTipo = tipo === "ENTRADA" && !motivo.includes("devolución");
    } else if (filtroTipo === "Salida") {
      coincideTipo = tipo === "SALIDA";
    } else if (filtroTipo === "Devuelto") {
      coincideTipo =
        tipo === "DEVOLUCION" ||
        motivo.includes("devolución") ||
        motivo.includes("devuelto");
    }

    return coincideBusqueda && coincideTipo;
  });

  const BadgeTipo = ({ tipo, motivo }: { tipo: string; motivo: string }) => {
    let bg = "#f1f5f9",
      color = "#64748b",
      label = tipo;

    if (tipo === "ENTRADA" || tipo === "Entrada") {
      if (motivo?.toLowerCase().includes("devolu")) {
        bg = "#eff6ff";
        color = "#2563eb";
        label = "Devolución";
      } else {
        bg = "#dcfce3";
        color = "#15803d";
        label = "Entrada";
      }
    } else if (tipo === "SALIDA" || tipo === "Salida") {
      bg = "#fee2e2";
      color = "#b91c1c";
      label = "Salida";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeTxt, { color: color }]}>{label}</Text>
      </View>
    );
  };

  const formatearFecha = (fechaIso: string) => {
    const d = new Date(fechaIso);
    return {
      fecha: d.toLocaleDateString("es-AR"),
      hora: d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const renderItem = ({ item }: { item: any }) => {
    const { fecha, hora } = formatearFecha(item.fecha_movimiento);
    const nombreProducto =
      item.producto?.nombre_producto || "Producto Eliminado";
    const codigoProducto = item.producto?.codigo_barras || "S/C";
    const cantidadFormateada =
      item.tipo_movimiento === "SALIDA"
        ? `- ${item.cantidad}`
        : `+ ${item.cantidad}`;
    const colorCantidad =
      item.tipo_movimiento === "SALIDA" ? "#b91c1c" : "#15803d";
    if (Platform.OS !== "web") {
      return (
        <View style={styles.cardMobile}>
          <View style={styles.cardRowMobile}>
            <Text style={styles.dateMobile}>
              {fecha} • {hora}
            </Text>
            <BadgeTipo tipo={item.tipo_movimiento} motivo={item.motivo} />
          </View>
          <Text style={styles.productNameMobile}>{nombreProducto}</Text>
          <Text style={styles.productCodeMobile}>{codigoProducto}</Text>
          <View style={styles.cardRowMobile}>
            <Text style={[styles.quantityMobile, { color: colorCantidad }]}>
              {cantidadFormateada} uds.
            </Text>
            <Text style={styles.reasonMobile} numberOfLines={1}>
              {item.motivo}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { flex: 1 }]}>
          <Text style={styles.rowTxtBase}>{fecha}</Text>
          <Text style={styles.rowTxtSub}>{hora}</Text>
        </View>
        <View style={[styles.tableCol, { flex: 2.5 }]}>
          <Text style={[styles.rowTxtBase, { fontWeight: "bold" }]}>
            {nombreProducto}
          </Text>
          <Text style={styles.rowTxtSub}>{codigoProducto}</Text>
        </View>
        <View style={[styles.tableCol, { flex: 1, alignItems: "center" }]}>
          <BadgeTipo tipo={item.tipo_movimiento} motivo={item.motivo} />
        </View>
        <View style={[styles.tableCol, { flex: 1, alignItems: "center" }]}>
          <Text
            style={[
              styles.rowTxtBase,
              { fontWeight: "bold", color: colorCantidad },
            ]}
          >
            {cantidadFormateada}
          </Text>
        </View>
        <View style={[styles.tableCol, { flex: 2.5 }]}>
          <Text style={styles.rowTxtBase} numberOfLines={2}>
            {item.motivo}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER Y FILTROS */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.tituloPrincipal}>Movimientos de Stock</Text>
          <Text style={styles.subtitulo}>
            {movimientosFiltrados.length} registros encontrados
          </Text>
        </View>

        {/* Desplegable de Filtro */}
        <View style={styles.filterContainer}>
          <Text style={styles.labelFiltro}>Mostrar:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setModalFiltroVisible(true)}
          >
            <Text style={styles.dropdownButtonTxt}>{filtroTipo} ▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por producto, código o motivo..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2563eb"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {/* Encabezados de Tabla (SOLO WEB) */}
            {Platform.OS === "web" && (
              <View style={styles.tableHead}>
                <Text style={[styles.colHead, { flex: 1 }]}>Fecha</Text>
                <Text style={[styles.colHead, { flex: 2.5 }]}>Producto</Text>
                <Text
                  style={[styles.colHead, { flex: 1, textAlign: "center" }]}
                >
                  Tipo
                </Text>
                <Text
                  style={[styles.colHead, { flex: 1, textAlign: "center" }]}
                >
                  Cantidad
                </Text>
                <Text style={[styles.colHead, { flex: 2.5 }]}>Motivo</Text>
              </View>
            )}

            <FlatList
              data={movimientosFiltrados}
              keyExtractor={(item, index) =>
                item.id_registro?.toString() || index.toString()
              }
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.emptyTxt}>
                  No se encontraron movimientos.
                </Text>
              }
            />
          </>
        )}
      </View>

      {/* MODAL DEL DESPLEGABLE */}
      <Modal
        visible={modalFiltroVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalFiltroVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Filtrar por tipo</Text>
            {opcionesFiltro.map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[
                  styles.selectorItem,
                  filtroTipo === opcion && { backgroundColor: "#eff6ff" },
                ]}
                onPress={() => {
                  setFiltroTipo(opcion);
                  setModalFiltroVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.selectorItemTxt,
                    filtroTipo === opcion && {
                      color: "#2563eb",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {opcion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8", padding: 16 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 16,
  },
  tituloPrincipal: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  subtitulo: { fontSize: 14, color: "#64748b", marginTop: 4 },
  filterContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  labelFiltro: { fontSize: 14, color: "#475569", fontWeight: "600" },
  dropdownButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 140,
  },
  dropdownButtonTxt: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "space-between",
  },

  searchContainer: { marginBottom: 20 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#334155",
  },

  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: Platform.OS === "web" ? 20 : 10,
    overflow: "hidden",
  },

  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 8,
  },
  colHead: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  tableCol: { justifyContent: "center", paddingRight: 10 },
  rowTxtBase: { fontSize: 15, color: "#334155" },
  rowTxtSub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },

  cardMobile: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRowMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateMobile: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  productNameMobile: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  productCodeMobile: { fontSize: 13, color: "#94a3b8", marginBottom: 12 },
  quantityMobile: { fontSize: 16, fontWeight: "bold" },
  reasonMobile: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTxt: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },

  emptyTxt: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    padding: 16,
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 300,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  selectorItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  selectorItemTxt: { fontSize: 16, color: "#475569" },
});
