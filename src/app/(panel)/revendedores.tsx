import {
  obtenerRevendedoresYStock,
  procesarDevolucion,
  procesarVentaTotal,
} from "@/service/stock_revendedor";
import { StockRevendedor, Usuario } from "@/types/types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function StockRevendedorScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stock, setStock] = useState<StockRevendedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modales Originales
  const [modalDevolucionVisible, setModalDevolucionVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] =
    useState<StockRevendedor | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");

  // ESTADOS NUEVOS MODALES
  const [modalNuevoRevVisible, setModalNuevoRevVisible] = useState(false);
  const [nuevoRevNombre, setNuevoRevNombre] = useState("");
  const [nuevoRevRol, setNuevoRevRol] = useState("Revendedor");
  const [nuevoRevDescuento, setNuevoRevDescuento] = useState("");
  const [nuevoRevBonificacion, setNuevoRevBonificacion] = useState("");

  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [asignarCantidad, setAsignarCantidad] = useState("");
  const [asignarEstado, setAsignarEstado] = useState("En poder");

  const ID_EMPRESA_ACTUAL = 1;

  const cargarDatos = async () => {
    setLoading(true);
    const data = await obtenerRevendedoresYStock(ID_EMPRESA_ACTUAL);
    setUsuarios(data.usuarios);
    setStock(data.stock);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones originales
  const handleVendido = (item: StockRevendedor) => {
    Alert.alert(
      "Confirmar",
      `¿Marcar las ${item.cantidad} unidades como vendidas?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vendido",
          onPress: async () => {
            const exito = await procesarVentaTotal(item, ID_EMPRESA_ACTUAL);
            if (exito) cargarDatos();
            else Alert.alert("Error", "No se pudo registrar la venta.");
          },
        },
      ],
    );
  };

  const handleDevolver = (item: StockRevendedor) => {
    setItemSeleccionado(item);
    setCantidadInput(item.cantidad.toString());
    setModalDevolucionVisible(true);
  };

  const confirmarDevolucion = async () => {
    const cant = parseFloat(cantidadInput);
    if (
      !itemSeleccionado ||
      isNaN(cant) ||
      cant <= 0 ||
      cant > itemSeleccionado.cantidad
    ) {
      Alert.alert("Error", "Cantidad inválida.");
      return;
    }
    setModalDevolucionVisible(false);
    const exito = await procesarDevolucion(
      itemSeleccionado,
      cant,
      ID_EMPRESA_ACTUAL,
    );
    if (exito) cargarDatos();
    else Alert.alert("Error", "No se pudo procesar la devolución.");
  };

  // Funciones visuales
  const crearNuevoRevendedor = () => {
    Alert.alert(
      "Aviso",
      `Crear: ${nuevoRevNombre}\nRol: ${nuevoRevRol}\nDescuento: ${nuevoRevDescuento || 0}%\nBonificación: ${nuevoRevBonificacion || 0}%`,
    );
    setModalNuevoRevVisible(false);
  };

  const confirmarAsignacion = () => {
    Alert.alert(
      "Aviso",
      `Asignar ${asignarCantidad} uds | Estado: ${asignarEstado}`,
    );
    setModalAsignarVisible(false);
  };

  const renderStock = ({ item }: { item: StockRevendedor }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockTitle}>
          {(item as any).producto?.nombre_producto}
        </Text>
        <Text style={styles.stockSubtitle}>En poder: {item.cantidad}</Text>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.btnVendido}
          onPress={() => handleVendido(item)}
        >
          <Text style={styles.txtVendido}>Vendido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnDevolver}
          onPress={() => handleDevolver(item)}
        >
          <Text style={styles.txtDevolver}>Devolver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsuario = ({ item: usuario }: { item: Usuario }) => {
    const descuento = (usuario as any).descuento || 0;
    const bonificacion =
      usuario.rol === "camioneta" ? 0 : usuario.bonificacion || 0;

    const stockAsignado = stock.filter(
      (s) => s.id_usuario === usuario.id_usuario && s.estado === "En poder",
    );

    const textoBeneficio =
      descuento > 0
        ? `Descuento: ${descuento}%`
        : bonificacion > 0
          ? `Bonificación: ${bonificacion}%`
          : `Sin beneficios`;

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{usuario.nombre_usuario}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleBadge}>{usuario.rol}</Text>
            <Text style={styles.discountTxt}>{textoBeneficio}</Text>
          </View>
        </View>

        {stockAsignado.length === 0 ? (
          <Text style={styles.emptyTxt}>Sin stock en poder actualmente.</Text>
        ) : (
          <FlatList
            data={stockAsignado}
            keyExtractor={(s) => s.id_registro.toString()}
            renderItem={renderStock}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  // --- HISTORIAL CON DATOS REALES (SIEMPRE VISIBLE) ---
  const renderHistorial = () => {
    return (
      <View style={styles.historyCard}>
        <Text style={styles.historyMainTitle}>Historial de Asignaciones</Text>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableCol, styles.tableHeadTxt, { flex: 1 }]}>
            Fecha
          </Text>
          <Text style={[styles.tableCol, styles.tableHeadTxt, { flex: 1.5 }]}>
            Revendedor
          </Text>
          <Text style={[styles.tableCol, styles.tableHeadTxt, { flex: 2 }]}>
            Producto
          </Text>
          <Text
            style={[
              styles.tableCol,
              styles.tableHeadTxt,
              { flex: 0.8, textAlign: "center" },
            ]}
          >
            Cantidad
          </Text>
          <Text
            style={[
              styles.tableCol,
              styles.tableHeadTxt,
              { flex: 1, textAlign: "center" },
            ]}
          >
            Estado
          </Text>
        </View>

        {stock.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#94a3b8",
              paddingVertical: 20,
              fontStyle: "italic",
            }}
          >
            No hay movimientos registrados todavía.
          </Text>
        ) : (
          stock.map((fila, index) => {
            const revendedorObj = usuarios.find(
              (u) => u.id_usuario === fila.id_usuario,
            );
            const nombreRevendedor = revendedorObj
              ? revendedorObj.nombre_usuario
              : "Desconocido";

            const nombreProducto =
              (fila as any).producto?.nombre_producto || "Sin nombre";
            const codigoProducto = (fila as any).producto?.codigo_barras || "-";

            const fechaStr = (fila as any).created_at
              ? new Date((fila as any).created_at).toLocaleDateString("es-AR")
              : "Reciente";

            let badgeStyle = styles.badgeDefault;
            let badgeTxtStyle = styles.badgeTxtDefault;
            if (fila.estado === "En poder") {
              badgeStyle = styles.badgeEnPoder;
              badgeTxtStyle = styles.badgeTxtEnPoder;
            }
            if (fila.estado === "Vendido") {
              badgeStyle = styles.badgeVendido;
              badgeTxtStyle = styles.badgeTxtVendido;
            }
            if (fila.estado === "Devuelto") {
              badgeStyle = styles.badgeDevuelto;
              badgeTxtStyle = styles.badgeTxtDevuelto;
            }

            return (
              <View
                key={fila.id_registro}
                style={[
                  styles.tableRow,
                  index === stock.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text
                  style={[styles.tableCol, styles.tableRowTxt, { flex: 1 }]}
                >
                  {fechaStr}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableRowTxt,
                    { flex: 1.5, fontWeight: "bold" },
                  ]}
                >
                  {nombreRevendedor}
                </Text>
                <View style={[styles.tableCol, { flex: 2 }]}>
                  <Text style={styles.tableRowTxt}>{nombreProducto}</Text>
                  <Text style={styles.tableRowCode}>{codigoProducto}</Text>
                </View>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableRowTxt,
                    { flex: 0.8, textAlign: "center", fontWeight: "bold" },
                  ]}
                >
                  {fila.cantidad}
                </Text>
                <View
                  style={[styles.tableCol, { flex: 1, alignItems: "center" }]}
                >
                  <View style={badgeStyle}>
                    <Text style={badgeTxtStyle}>{fila.estado}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.mainTitle}>Revendedores</Text>
          <Text style={styles.mainSubtitle}>
            {usuarios.length} clientes especiales registrados
          </Text>
        </View>
        <View style={styles.headerActionBtns}>
          <TouchableOpacity
            style={styles.btnHeaderPrimary}
            onPress={() => setModalAsignarVisible(true)}
          >
            <Text style={styles.txtHeaderPrimary}>+ Asignar Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnHeaderSecondary}
            onPress={() => setModalNuevoRevVisible(true)}
          >
            <Text style={styles.txtHeaderSecondary}>+ Nuevo Revendedor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(u) => u.id_usuario.toString()}
          renderItem={renderUsuario}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListFooterComponent={renderHistorial}
        />
      )}

      {/* MODALES */}
      <Modal
        visible={modalDevolucionVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Registrar Devolución</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={cantidadInput}
              onChangeText={setCantidadInput}
              placeholder="Cantidad a devolver"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalDevolucionVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={confirmarDevolucion}
              >
                <Text style={styles.modalTxtConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalNuevoRevVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo Revendedor / Socio</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.modalInputText}
              placeholder="Nombre completo"
              value={nuevoRevNombre}
              onChangeText={setNuevoRevNombre}
            />

            <Text style={styles.label}>Rol</Text>
            <View style={styles.roleSelectionGroup}>
              <TouchableOpacity
                style={
                  nuevoRevRol === "Revendedor"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setNuevoRevRol("Revendedor")}
              >
                <Text
                  style={
                    nuevoRevRol === "Revendedor"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Revendedor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  nuevoRevRol === "Socio"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setNuevoRevRol("Socio")}
              >
                <Text
                  style={
                    nuevoRevRol === "Socio"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Socio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  nuevoRevRol === "Camioneta"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setNuevoRevRol("Camioneta")}
              >
                <Text
                  style={
                    nuevoRevRol === "Camioneta"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Camioneta
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Descuento (%)</Text>
                <TextInput
                  style={styles.modalInputText}
                  keyboardType="numeric"
                  placeholder="Ej: 10"
                  value={nuevoRevDescuento}
                  onChangeText={(texto) => {
                    setNuevoRevDescuento(texto);
                    if (texto.length > 0) setNuevoRevBonificacion("");
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bonificación (%)</Text>
                <TextInput
                  style={styles.modalInputText}
                  keyboardType="numeric"
                  placeholder="Ej: 15"
                  value={nuevoRevBonificacion}
                  onChangeText={(texto) => {
                    setNuevoRevBonificacion(texto);
                    if (texto.length > 0) setNuevoRevDescuento("");
                  }}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalNuevoRevVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={crearNuevoRevendedor}
              >
                <Text style={styles.modalTxtConfirm}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalAsignarVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Asignar Stock a Revendedor</Text>

            <Text style={styles.label}>Revendedor *</Text>
            <TouchableOpacity style={styles.mockDropdown}>
              <Text style={styles.mockDropdownTxt}>Seleccionar...</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Producto *</Text>
            <TouchableOpacity style={styles.mockDropdown}>
              <Text style={styles.mockDropdownTxt}>Seleccionar...</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput
              style={styles.modalInputText}
              keyboardType="numeric"
              placeholder="0"
              value={asignarCantidad}
              onChangeText={setAsignarCantidad}
            />

            <Text style={styles.label}>Estado de entrega</Text>
            <View style={styles.stateSelectionGroup}>
              <TouchableOpacity
                style={
                  asignarEstado === "En poder"
                    ? styles.stateBtnActive
                    : styles.stateBtnInactive
                }
                onPress={() => setAsignarEstado("En poder")}
              >
                <Text
                  style={
                    asignarEstado === "En poder"
                      ? styles.stateTxtActive
                      : styles.stateTxtInactive
                  }
                >
                  📦 En poder
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  asignarEstado === "Vendido"
                    ? styles.stateBtnActive
                    : styles.stateBtnInactive
                }
                onPress={() => setAsignarEstado("Vendido")}
              >
                <Text
                  style={
                    asignarEstado === "Vendido"
                      ? styles.stateTxtActive
                      : styles.stateTxtInactive
                  }
                >
                  ✓ Vendido
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  asignarEstado === "Devuelto"
                    ? styles.stateBtnActive
                    : styles.stateBtnInactive
                }
                onPress={() => setAsignarEstado("Devuelto")}
              >
                <Text
                  style={
                    asignarEstado === "Devuelto"
                      ? styles.stateTxtActive
                      : styles.stateTxtInactive
                  }
                >
                  ↩ Devuelto
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalAsignarVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={confirmarAsignacion}
              >
                <Text style={styles.modalTxtConfirm}>Asignar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// === ESTILOS ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  mainTitle: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  mainSubtitle: { fontSize: 14, color: "#64748b", marginTop: 2 },
  headerActionBtns: { flexDirection: "row", gap: 10 },
  btnHeaderPrimary: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  txtHeaderPrimary: { color: "#fff", fontWeight: "bold" },
  btnHeaderSecondary: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  txtHeaderSecondary: { color: "#334155", fontWeight: "bold" },

  userCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  userName: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  roleBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  discountTxt: { color: "#475569", fontSize: 14, fontWeight: "500" },
  emptyTxt: {
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
    paddingVertical: 10,
  },

  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stockInfo: { flex: 1, marginRight: 8 },
  stockTitle: { fontWeight: "600", color: "#334155", fontSize: 15 },
  stockSubtitle: { fontSize: 14, color: "#64748b", marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8 },
  btnVendido: {
    backgroundColor: "#dcfce3",
    borderWidth: 1,
    borderColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtVendido: { color: "#15803d", fontWeight: "bold", fontSize: 13 },
  btnDevolver: {
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtDevolver: { color: "#c2410c", fontWeight: "bold", fontSize: 13 },

  historyCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  historyMainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 14,
  },
  tableCol: { justifyContent: "center", paddingRight: 10 },
  tableHeadTxt: { color: "#64748b", fontSize: 13, fontWeight: "600" },
  tableRowTxt: { color: "#334155", fontSize: 14 },
  tableRowCode: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

  badgeDefault: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  badgeTxtDefault: { color: "#64748b", fontWeight: "bold", fontSize: 12 },
  badgeEnPoder: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
  },
  badgeTxtEnPoder: { color: "#b45309", fontWeight: "bold", fontSize: 12 },
  badgeVendido: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
  },
  badgeTxtVendido: { color: "#047857", fontWeight: "bold", fontSize: 12 },
  badgeDevuelto: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  badgeTxtDevuelto: { color: "#64748b", fontWeight: "bold", fontSize: 12 },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 16,
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
  modalInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: "#f8fafc",
    textAlign: "center",
    marginBottom: 16,
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
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  mockDropdownTxt: { color: "#475569", fontSize: 16 },

  roleSelectionGroup: { flexDirection: "row", gap: 8, marginBottom: 8 },
  roleBtnActive: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  roleBtnInactive: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  roleTxtActive: { color: "#fff", fontWeight: "bold" },
  roleTxtInactive: { color: "#475569", fontWeight: "bold" },

  stateSelectionGroup: { flexDirection: "row", gap: 8, marginBottom: 16 },
  stateBtnActive: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  stateBtnInactive: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  stateTxtActive: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  stateTxtInactive: { color: "#64748b", fontWeight: "bold", fontSize: 13 },

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
    backgroundColor: "#93c5fd",
  },
  modalTxtConfirm: { color: "#1e3a8a", fontWeight: "bold" },
});
