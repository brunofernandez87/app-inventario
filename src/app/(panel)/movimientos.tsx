import {
  obtenerHistorialMovimientos,
  registrarMovimientoManual,
} from "@/service/movimiento_stock";
import { obtenerProductosParaAsignar } from "@/service/stock_revendedor";
import { BlurView } from "expo-blur";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const opcionesFiltro = ["Todos", "Entrada", "Salida", "Devuelto"];
  const [modalRegistroVisible, setModalRegistroVisible] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<"ENTRADA" | "SALIDA">(
    "ENTRADA",
  );
  const [regIdProducto, setRegIdProducto] = useState<number | null>(null);
  const [regCantidad, setRegCantidad] = useState("");
  const [regMotivo, setRegMotivo] = useState("");
  const [modalSelectorVisible, setModalSelectorVisible] = useState(false);

  const ID_EMPRESA_ACTUAL = 1;

  const cargarDatos = async () => {
    setLoading(true);
    const [dataMovs, dataProds] = await Promise.all([
      obtenerHistorialMovimientos(ID_EMPRESA_ACTUAL),
      obtenerProductosParaAsignar(ID_EMPRESA_ACTUAL),
    ]);
    setMovimientos(dataMovs);
    setProductos(dataProds);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  const abrirModalRegistro = (tipo: "ENTRADA" | "SALIDA") => {
    setTipoRegistro(tipo);
    setRegIdProducto(null);
    setRegCantidad("");
    setRegMotivo("");
    setModalRegistroVisible(true);
  };

  const confirmarRegistro = async () => {
    const cant = parseFloat(regCantidad);
    if (!regIdProducto)
      return Alert.alert("Atención", "Seleccioná un producto.");
    if (isNaN(cant) || cant <= 0)
      return Alert.alert("Atención", "Ingresá una cantidad válida mayor a 0.");
    if (regMotivo.trim() === "")
      return Alert.alert(
        "Atención",
        "Por favor ingresá un motivo (ej: Remito #123, Ajuste, etc).",
      );

    setLoading(true);
    const resultado = await registrarMovimientoManual(
      ID_EMPRESA_ACTUAL,
      regIdProducto,
      tipoRegistro,
      cant,
      regMotivo,
    );

    if (resultado.exito) {
      setModalRegistroVisible(false);
      await cargarDatos();
    } else {
      Alert.alert("Error", resultado.error);
      setLoading(false);
    }
  };

  const getNombreProductoSeleccionado = () => {
    if (!regIdProducto) return "Seleccionar...";
    return (
      productos.find((p) => p.id_producto === regIdProducto)?.nombre_producto ||
      "Desconocido"
    );
  };

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
    if (filtroTipo === "Entrada")
      coincideTipo =
        tipo === "ENTRADA" &&
        !motivo.includes("devolución") &&
        !motivo.includes("automática");
    else if (filtroTipo === "Salida") coincideTipo = tipo === "SALIDA";
    else if (filtroTipo === "Devuelto")
      coincideTipo =
        tipo === "DEVOLUCION" ||
        motivo.includes("devolución") ||
        motivo.includes("automática");

    return coincideBusqueda && coincideTipo;
  });

  const BadgeTipo = ({ tipo, motivo }: { tipo: string; motivo: string }) => {
    let bg = "#f1f5f9",
      color = "#64748b",
      label = tipo;

    if (tipo === "ENTRADA" || tipo === "Entrada") {
      if (
        motivo?.toLowerCase().includes("devolu") ||
        motivo?.toLowerCase().includes("automática")
      ) {
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
    const isWeb = Platform.OS === "web";

    return (
      <View
        style={[
          styles.cardMobile,
          isWeb && {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            width: "100%",
          },
        ]}
      >
        {isWeb ? (
          <>
            <View
              style={{ flex: 1, paddingRight: 10, justifyContent: "center" }}
            >
              <Text
                style={[styles.dateMobile, { marginTop: 0, fontWeight: "600" }]}
              >
                {fecha}
              </Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {hora}
              </Text>
            </View>
            <View
              style={{
                flex: 1.5,
                paddingHorizontal: 10,
                justifyContent: "center",
              }}
            >
              <Text
                style={[
                  styles.productNameMobile,
                  { marginTop: 0, marginBottom: 2 },
                ]}
              >
                {nombreProducto}
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8" }}>
                {codigoProducto}
              </Text>
            </View>
            <View
              style={{
                flex: 2,
                paddingHorizontal: 10,
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 14, color: "#475569" }}
                numberOfLines={2}
              >
                {item.motivo}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: "flex-end",
                justifyContent: "center",
                paddingHorizontal: 10,
              }}
            >
              <Text style={[styles.quantityMobile, { color: colorCantidad }]}>
                {cantidadFormateada} uds.
              </Text>
            </View>
            <View
              style={{
                flex: 0.8,
                alignItems: "flex-end",
                justifyContent: "center",
                paddingLeft: 10,
              }}
            >
              <BadgeTipo tipo={item.tipo_movimiento} motivo={item.motivo} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardRowMobile}>
              <Text style={styles.dateMobile}>
                {fecha} • {hora}
              </Text>
              <BadgeTipo tipo={item.tipo_movimiento} motivo={item.motivo} />
            </View>
            <Text style={styles.productNameMobile}>{nombreProducto}</Text>
            <Text style={styles.productCodeMobile}>{codigoProducto}</Text>
            <View style={[styles.cardRowMobile, { alignItems: "flex-start" }]}>
              <Text
                style={[
                  styles.quantityMobile,
                  { color: colorCantidad, marginTop: 2 },
                ]}
              >
                {cantidadFormateada} uds.
              </Text>
              <Text style={styles.reasonMobile}>{item.motivo}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.tituloPrincipal}>Movimientos</Text>
          <Text style={styles.subtitulo}>
            {movimientosFiltrados.length} registros en el historial
          </Text>
        </View>

        <View style={styles.headerActionBtns}>
          <TouchableOpacity
            style={[styles.btnHeaderAccion, { backgroundColor: "#15803d" }]}
            onPress={() => abrirModalRegistro("ENTRADA")}
          >
            <Text style={styles.txtBtnAccion}>+ Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnHeaderAccion, { backgroundColor: "#b91c1c" }]}
            onPress={() => abrirModalRegistro("SALIDA")}
          >
            <Text style={styles.txtBtnAccion}>- Salida</Text>
          </TouchableOpacity>

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
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por producto, código o motivo..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2563eb"
            style={{ marginTop: 40 }}
          />
        ) : (
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
        )}
      </View>

      <Modal
        visible={modalFiltroVisible}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={30} tint="dark" style={styles.modalOverlayLigero}>
          <TouchableOpacity
            style={{
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
            activeOpacity={1}
            onPress={() => setModalFiltroVisible(false)}
          >
            <View style={[styles.modalBoxFiltro, { paddingVertical: 20 }]}>
              <Text style={[styles.modalTitle, { paddingHorizontal: 24 }]}>
                Filtrar por tipo
              </Text>
              {opcionesFiltro.map((opcion) => (
                <TouchableOpacity
                  key={opcion}
                  style={[
                    styles.selectorItem,
                    { paddingHorizontal: 24 },
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
        </BlurView>
      </Modal>

      <Modal
        visible={modalRegistroVisible}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={30} tint="dark" style={styles.modalOverlayOscuro}>
          <View style={styles.modalBox}>
            <Text
              style={[
                styles.modalTitle,
                { color: tipoRegistro === "ENTRADA" ? "#15803d" : "#b91c1c" },
              ]}
            >
              {tipoRegistro === "ENTRADA"
                ? "Ingresar Mercadería"
                : "Retirar Mercadería"}
            </Text>

            <Text style={styles.label}>Producto *</Text>
            <TouchableOpacity
              style={styles.mockDropdown}
              onPress={() => setModalSelectorVisible(true)}
            >
              <Text style={styles.mockDropdownTxt}>
                {getNombreProductoSeleccionado()}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput
              style={styles.modalInputText}
              keyboardType="numeric"
              placeholder="Ej: 50"
              value={regCantidad}
              onChangeText={setRegCantidad}
            />

            <Text style={styles.label}>Motivo *</Text>
            <TextInput
              style={styles.modalInputText}
              placeholder="Ej: Remito de compra #4512"
              value={regMotivo}
              onChangeText={setRegMotivo}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalRegistroVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  {
                    backgroundColor:
                      tipoRegistro === "ENTRADA" ? "#15803d" : "#b91c1c",
                  },
                ]}
                onPress={confirmarRegistro}
              >
                <Text style={styles.modalTxtConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        visible={modalSelectorVisible}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={30} tint="dark" style={styles.modalOverlayOscuro}>
          <View style={[styles.modalBox, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
            <FlatList
              data={productos}
              keyExtractor={(item) => item.id_producto.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectorItem}
                  onPress={() => {
                    setRegIdProducto(item.id_producto);
                    setModalSelectorVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemTxt}>
                    {item.nombre_producto} (Stock actual:{" "}
                    {item.stock_unidades || 0})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalBtnCancel, { marginTop: 16 }]}
              onPress={() => setModalSelectorVisible(false)}
            >
              <Text style={[styles.modalTxtCancel, { textAlign: "center" }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
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

  headerActionBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  btnHeaderAccion: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  txtBtnAccion: { color: "#fff", fontWeight: "bold" },

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
  dropdownButtonTxt: { color: "#0f172a", fontSize: 15, fontWeight: "600" },

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

  cardMobile: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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

  modalOverlayLigero: {
    flex: 1,
  },
  modalOverlayOscuro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBoxFiltro: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 300,
    overflow: "hidden",
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 450,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
  },
  modalInputText: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  mockDropdown: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#f8fafc",
    marginBottom: 4,
  },
  mockDropdownTxt: { color: "#0f172a", fontSize: 16, fontWeight: "500" },
  selectorItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  selectorItemTxt: { fontSize: 16, color: "#334155" },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalBtnCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  modalTxtCancel: { color: "#475569", fontWeight: "bold" },
  modalBtnConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalTxtConfirm: { color: "#fff", fontWeight: "bold" },
});
