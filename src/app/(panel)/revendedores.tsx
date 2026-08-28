import {
  asignarStockARevendedor,
  crearNuevoRevendedor,
  editarRevendedor,
  eliminarRevendedor,
  obtenerProductosParaAsignar,
  obtenerRevendedoresYStock,
  procesarDevolucion,
  procesarVenta,
} from "@/service/stock_revendedor";
import { StockRevendedor, Usuario } from "@/types/types";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function StockRevendedorScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stock, setStock] = useState<StockRevendedor[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDevolucionVisible, setModalDevolucionVisible] = useState(false);
  const [modalVentaVisible, setModalVentaVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] =
    useState<StockRevendedor | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");
  const [modalNuevoRevVisible, setModalNuevoRevVisible] = useState(false);
  const [modalEditarRevVisible, setModalEditarRevVisible] = useState(false);
  const [revId, setRevId] = useState<number | null>(null);
  const [revNombre, setRevNombre] = useState("");
  const [revRol, setRevRol] = useState("Revendedor");
  const [revDescuento, setRevDescuento] = useState("");
  const [revBonificacion, setRevBonificacion] = useState("");
  const [revPermiteDevolucion, setRevPermiteDevolucion] = useState(false);

  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [asignarIdUsuario, setAsignarIdUsuario] = useState<number | null>(null);
  const [asignarIdProducto, setAsignarIdProducto] = useState<number | null>(
    null,
  );
  const [asignarCantidad, setAsignarCantidad] = useState("");
  const [asignarEstado, setAsignarEstado] = useState("En poder");

  const [modalSelectorVisible, setModalSelectorVisible] = useState(false);
  const [tipoSelector, setTipoSelector] = useState<"usuario" | "producto">(
    "usuario",
  );
  const [modalImprimirVisible, setModalImprimirVisible] = useState(false);
  const [opcionImprimir, setOpcionImprimir] = useState<"todos" | number>(
    "todos",
  );
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const formatearFecha = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  const [fechaInicio, setFechaInicio] = useState(formatearFecha(primerDia));
  const [fechaFin, setFechaFin] = useState(formatearFecha(hoy));

  const ID_EMPRESA_ACTUAL = 1;

  const cargarDatos = async () => {
    setLoading(true);
    const data = await obtenerRevendedoresYStock(ID_EMPRESA_ACTUAL);
    const prods = await obtenerProductosParaAsignar(ID_EMPRESA_ACTUAL);
    setUsuarios(data.usuarios);
    setStock(data.stock);
    setProductos(prods);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAbrirVenta = (item: StockRevendedor) => {
    setItemSeleccionado(item);
    setCantidadInput(item.cantidad.toString());
    setModalVentaVisible(true);
  };

  const confirmarVenta = async () => {
    const cant = parseFloat(cantidadInput);
    if (
      !itemSeleccionado ||
      isNaN(cant) ||
      cant <= 0 ||
      cant > itemSeleccionado.cantidad
    ) {
      return Alert.alert("Error", "Cantidad inválida.");
    }
    setModalVentaVisible(false);
    setLoading(true);
    const exito = await procesarVenta(
      itemSeleccionado,
      cant,
      ID_EMPRESA_ACTUAL,
    );
    if (exito) await cargarDatos();
    else {
      Alert.alert("Error", "No se pudo registrar la venta.");
      setLoading(false);
    }
  };

  const handleAbrirDevolucion = (item: StockRevendedor) => {
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
      return Alert.alert("Error", "Cantidad inválida.");
    }
    setModalDevolucionVisible(false);
    setLoading(true);
    const exito = await procesarDevolucion(
      itemSeleccionado,
      cant,
      ID_EMPRESA_ACTUAL,
    );
    if (exito) await cargarDatos();
    else {
      Alert.alert("Error", "No se pudo procesar la devolución.");
      setLoading(false);
    }
  };

  const limpiarFormRevendedor = () => {
    setRevId(null);
    setRevNombre("");
    setRevRol("Revendedor");
    setRevDescuento("");
    setRevBonificacion("");
    setRevPermiteDevolucion(false);
  };

  const guardarRevendedor = async (esEdicion: boolean) => {
    if (revNombre.trim() === "")
      return Alert.alert("Atención", "Tenés que escribir el nombre.");
    const valorDesc = parseFloat(revDescuento) || 0;
    const valorBonif = parseFloat(revBonificacion) || 0;
    const valorFinal = valorDesc > 0 ? valorDesc : valorBonif;

    setLoading(true);
    let exito = false;
    if (esEdicion && revId) {
      exito = await editarRevendedor(
        revId,
        revNombre,
        revRol,
        valorFinal,
        revPermiteDevolucion,
      );
    } else {
      exito = await crearNuevoRevendedor(
        revNombre,
        revRol as any,
        valorFinal,
        ID_EMPRESA_ACTUAL,
        revPermiteDevolucion,
      );
    }

    if (exito) {
      setModalNuevoRevVisible(false);
      setModalEditarRevVisible(false);
      limpiarFormRevendedor();
      await cargarDatos();
    } else {
      Alert.alert("Error", "No se pudo guardar.");
      setLoading(false);
    }
  };
  const handleEliminarRevendedor = (id: number, nombre: string) => {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          `¿Seguro que querés eliminar a ${nombre}?\nTodo el stock que tenga en su poder se devolverá automáticamente al inventario.`,
        )
      ) {
        setLoading(true);
        eliminarRevendedor(id, ID_EMPRESA_ACTUAL).then(() => cargarDatos());
      }
    } else {
      Alert.alert(
        "Eliminar Cuenta",
        `¿Seguro que querés eliminar a ${nombre}?\nTodo su stock se devolverá automáticamente al inventario.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar y Devolver",
            style: "destructive",
            onPress: () => {
              setLoading(true);
              eliminarRevendedor(id, ID_EMPRESA_ACTUAL).then(() =>
                cargarDatos(),
              );
            },
          },
        ],
      );
    }
  };
  const handleConfirmarAsignacion = async () => {
    const cantidadFinal = parseFloat(asignarCantidad);
    if (!asignarIdUsuario)
      return Alert.alert("Atención", "Seleccioná un revendedor.");
    if (!asignarIdProducto)
      return Alert.alert("Atención", "Seleccioná un producto.");
    if (isNaN(cantidadFinal) || cantidadFinal <= 0)
      return Alert.alert("Atención", "Ingresá una cantidad válida.");

    setLoading(true);
    const resultado = await asignarStockARevendedor(
      asignarIdUsuario,
      asignarIdProducto,
      cantidadFinal,
      asignarEstado as any,
      ID_EMPRESA_ACTUAL,
    );

    if (resultado.exito) {
      setModalAsignarVisible(false);
      setAsignarIdUsuario(null);
      setAsignarIdProducto(null);
      setAsignarCantidad("");
      setAsignarEstado("En poder");
      await cargarDatos();
    } else {
      Alert.alert("No se pudo asignar", resultado.error);
      setLoading(false);
    }
  };

  const getNombreUsuarioSeleccionado = () =>
    asignarIdUsuario
      ? usuarios.find((u) => u.id_usuario === asignarIdUsuario)?.nombre_usuario
      : "Seleccionar...";
  const getNombreProductoSeleccionado = () =>
    asignarIdProducto
      ? productos.find((p) => p.id_producto === asignarIdProducto)
          ?.nombre_producto
      : "Seleccionar...";

  const usuariosFiltrados = usuarios.filter((u) => u.rol !== "Admin");

  const generarPDF = async () => {
    try {
      const parseDate = (str: string) => {
        const p = str.split("/");
        return p.length === 3
          ? new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]))
          : new Date(NaN);
      };

      const dateInicio = parseDate(fechaInicio);
      const dateFin = parseDate(fechaFin);
      const hoyReal = new Date();
      hoyReal.setHours(23, 59, 59, 999);

      if (isNaN(dateInicio.getTime()) || isNaN(dateFin.getTime()))
        return Alert.alert(
          "Error",
          "Las fechas no son válidas. Usá DD/MM/YYYY",
        );
      if (dateInicio > hoyReal || dateFin > hoyReal)
        return Alert.alert("Error", "No podés poner fechas del futuro.");
      if (dateInicio > dateFin)
        return Alert.alert(
          "Error",
          "La fecha de inicio no puede ser mayor a la de fin.",
        );

      dateFin.setHours(23, 59, 59, 999);
      setLoading(true);

      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
              h1 { color: #0f172a; text-align: center; margin-bottom: 5px; }
              .fecha { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 30px; }
              .rango { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 40px; color: #2563eb; background: #eff6ff; padding: 10px; border-radius: 8px;}
              .usuario-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
              .usuario-box h2 { margin: 0; color: #1e293b; font-size: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 13px; }
              th { background-color: #ffffff; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              .row-venta td { background-color: #f4fdf8; }
              .total-box { background-color: #1e293b; color: white; text-align: right; padding: 12px 15px; border-radius: 8px; font-size: 16px; font-weight: bold; margin-bottom: 40px; }
              .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
              .poder { background-color: #fef3c7; color: #b45309; }
              .vendido { background-color: #d1fae5; color: #047857; }
              .devuelto { background-color: #f1f5f9; color: #64748b; }
            </style>
          </head>
          <body>
            <h1>Reporte de Ventas y Movimientos</h1>
            <div class="fecha">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
            <div class="rango">📅 Período: ${fechaInicio} al ${fechaFin}</div>
      `;

      const usuariosAImprimir =
        opcionImprimir === "todos"
          ? usuariosFiltrados
          : usuariosFiltrados.filter((u) => u.id_usuario === opcionImprimir);

      usuariosAImprimir.forEach((usuario) => {
        const stockFiltrado = stock.filter((s) => {
          if (s.id_usuario !== usuario.id_usuario) return false;
          if (!(s as any).created_at) return true;
          const fechaMov = new Date((s as any).created_at);
          return fechaMov >= dateInicio && fechaMov <= dateFin;
        });

        htmlContent += `<div class="usuario-box"><h2>👤 ${usuario.nombre_usuario}</h2><p><strong>Rol:</strong> ${usuario.rol}</p></div>`;

        if (stockFiltrado.length === 0) {
          htmlContent += `<p style="color: #94a3b8; font-style: italic; margin-bottom: 40px;">Sin movimientos en este período.</p>`;
        } else {
          htmlContent += `
            <table>
              <thead><tr><th>Fecha</th><th>Producto</th><th style="text-align:center;">Estado</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">Precio</th><th style="text-align:right;">Total</th></tr></thead>
              <tbody>
          `;
          let totalVentasRevendedor = 0;
          stockFiltrado.forEach((s) => {
            const nombreProd = (s as any).producto?.nombre_producto || "S/C";
            const precioVenta = (s as any).producto?.precio_venta || 0;
            const subtotal = s.cantidad * precioVenta;
            const fechaStr = (s as any).created_at
              ? new Date((s as any).created_at).toLocaleDateString("es-AR")
              : "-";

            let claseEstado = "devuelto",
              filaVenta = "";
            if (s.estado === "En poder") claseEstado = "poder";
            if (s.estado === "Vendido") {
              claseEstado = "vendido";
              filaVenta = "row-venta";
              totalVentasRevendedor += subtotal;
            }

            htmlContent += `
              <tr class="${filaVenta}">
                <td>${fechaStr}</td><td><b>${nombreProd}</b></td>
                <td style="text-align:center;"><span class="badge ${claseEstado}">${s.estado}</span></td>
                <td style="text-align:center;">${s.cantidad}</td>
                <td style="text-align:right;">$${precioVenta.toLocaleString("es-AR")}</td>
                <td style="text-align:right; font-weight:bold;">$${subtotal.toLocaleString("es-AR")}</td>
              </tr>
            `;
          });
          htmlContent += `</tbody></table><div class="total-box">TOTAL VENTAS CONCRETADAS: $ ${totalVentasRevendedor.toLocaleString("es-AR")}</div>`;
        }
      });
      htmlContent += `</body></html>`;

      if (Platform.OS === "web") await Print.printAsync({ html: htmlContent });
      else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Reporte",
        });
      }
      setModalImprimirVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el documento PDF.");
    } finally {
      setLoading(false);
    }
  };

  const renderUsuario = ({ item: usuario }: { item: Usuario }) => {
    const permiteDevolver =
      (usuario as any).permite_devolucion === true ||
      usuario.rol === "Camioneta";
    const stockAsignado = stock.filter(
      (s) => s.id_usuario === usuario.id_usuario && s.estado === "En poder",
    );

    const renderStockEnLinea = ({ item }: { item: StockRevendedor }) => (
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
            onPress={() => handleAbrirVenta(item)}
          >
            <Text style={styles.txtVendido}>Vender</Text>
          </TouchableOpacity>
          {permiteDevolver && (
            <TouchableOpacity
              style={styles.btnDevolver}
              onPress={() => handleAbrirDevolucion(item)}
            >
              <Text style={styles.txtDevolver}>Devolver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{usuario.nombre_usuario}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.roleBadge}>{usuario.rol}</Text>
              {permiteDevolver && usuario.rol !== "Camioneta" && (
                <Text style={styles.badgePermiso}>
                  ↩️ Habilitado a devolver
                </Text>
              )}
            </View>
          </View>
          {/* BOTONES DE EDITAR Y ELIMINAR */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setRevId(usuario.id_usuario);
                setRevNombre(usuario.nombre_usuario);
                setRevRol(usuario.rol);
                setRevBonificacion(usuario.bonificacion?.toString() || "");
                setRevDescuento((usuario as any).descuento?.toString() || "");
                setRevPermiteDevolucion(
                  (usuario as any).permite_devolucion || false,
                );
                setModalEditarRevVisible(true);
              }}
            >
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                handleEliminarRevendedor(
                  usuario.id_usuario,
                  usuario.nombre_usuario,
                )
              }
            >
              <Text style={{ fontSize: 18 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {stockAsignado.length === 0 ? (
          <Text style={styles.emptyTxt}>Sin stock en poder.</Text>
        ) : (
          <FlatList
            data={stockAsignado}
            keyExtractor={(s) => s.id_registro.toString()}
            renderItem={renderStockEnLinea}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  const renderHistorial = () => {
    const isWeb = Platform.OS === "web";
    return (
      <View style={styles.historyCard}>
        <Text style={styles.historyMainTitle}>Historial de Asignaciones</Text>

        {stock.length === 0 ? (
          <Text style={styles.emptyTxt}>No hay movimientos.</Text>
        ) : (
          <ScrollView
            nestedScrollEnabled={true}
            style={{ maxHeight: isWeb ? 500 : undefined }}
          >
            <View style={{ paddingTop: 10, width: "100%" }}>
              {stock.map((fila) => {
                const rev = usuarios.find(
                  (u) => u.id_usuario === fila.id_usuario,
                );
                let bStyle = styles.badgeDefault,
                  bTxtStyle = styles.badgeTxtDefault;
                if (fila.estado === "En poder") {
                  bStyle = styles.badgeEnPoder;
                  bTxtStyle = styles.badgeTxtEnPoder;
                }
                if (fila.estado === "Vendido") {
                  bStyle = styles.badgeVendido;
                  bTxtStyle = styles.badgeTxtVendido;
                }

                const fechaStr = (fila as any).created_at
                  ? new Date((fila as any).created_at).toLocaleDateString(
                      "es-AR",
                    )
                  : "Reciente";
                const nombreRev = rev ? rev.nombre_usuario : "S/C";
                const nombreProd =
                  (fila as any).producto?.nombre_producto || "S/C";

                return (
                  <View
                    key={fila.id_registro}
                    style={[
                      styles.cardMobile,
                      isWeb && {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                      },
                    ]}
                  >
                    {isWeb ? (
                      <>
                        <View
                          style={{
                            flex: 1,
                            paddingRight: 10,
                            justifyContent: "center",
                          }}
                        >
                          <Text style={[styles.dateMobile, { marginTop: 0 }]}>
                            {fechaStr} •{" "}
                            <Text style={{ fontWeight: "bold" }}>
                              Rev: {nombreRev}
                            </Text>
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
                            style={[styles.productNameMobile, { marginTop: 0 }]}
                          >
                            {nombreProd}
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
                          <Text style={styles.quantityMobile}>
                            Cantidad: {fila.cantidad} uds.
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
                          <View style={bStyle}>
                            <Text style={bTxtStyle}>{fila.estado}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.cardRowMobile}>
                          <Text style={styles.dateMobile}>
                            {fechaStr} •{" "}
                            <Text style={{ fontWeight: "bold" }}>
                              Rev: {nombreRev}
                            </Text>
                          </Text>
                          <View style={bStyle}>
                            <Text style={bTxtStyle}>{fila.estado}</Text>
                          </View>
                        </View>
                        <Text style={styles.productNameMobile}>
                          {nombreProd}
                        </Text>
                        <View
                          style={[
                            styles.cardRowMobile,
                            { marginTop: 8, marginBottom: 0 },
                          ]}
                        >
                          <Text style={styles.quantityMobile}>
                            Cantidad: {fila.cantidad} uds.
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
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
            {usuariosFiltrados.length} clientes registrados
          </Text>
        </View>
        <View style={styles.headerActionBtns}>
          <TouchableOpacity
            style={styles.btnHeaderPrint}
            onPress={() => {
              setOpcionImprimir("todos");
              setModalImprimirVisible(true);
            }}
          >
            <Text style={styles.txtHeaderPrint}>🖨️ Imprimir PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnHeaderPrimary}
            onPress={() => setModalAsignarVisible(true)}
          >
            <Text style={styles.txtHeaderPrimary}>+ Asignar Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnHeaderSecondary}
            onPress={() => {
              limpiarFormRevendedor();
              setModalNuevoRevVisible(true);
            }}
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
          data={usuariosFiltrados}
          keyExtractor={(u) => u.id_usuario.toString()}
          renderItem={renderUsuario}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListFooterComponent={renderHistorial}
        />
      )}

      {/* MODAL VENTA PARCIAL */}
      <Modal
        visible={modalVentaVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Registrar Venta</Text>
            <Text style={styles.label}>Unidades a marcar como vendidas:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={cantidadInput}
              onChangeText={setCantidadInput}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalVentaVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: "#22c55e" }]}
                onPress={confirmarVenta}
              >
                <Text style={styles.modalTxtConfirm}>Vender</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DEVOLVER */}
      <Modal
        visible={modalDevolucionVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Registrar Devolución</Text>
            <Text style={styles.label}>
              Unidades que vuelven al inventario:
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={cantidadInput}
              onChangeText={setCantidadInput}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalDevolucionVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: "#f97316" }]}
                onPress={confirmarDevolucion}
              >
                <Text style={[styles.modalTxtConfirm, { color: "#fff" }]}>
                  Devolver
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CREAR / EDITAR REVENDEDOR */}
      <Modal
        visible={modalNuevoRevVisible || modalEditarRevVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modalEditarRevVisible ? "Editar Revendedor" : "Nuevo Revendedor"}
            </Text>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.modalInputText}
              placeholder="Nombre completo"
              value={revNombre}
              onChangeText={setRevNombre}
            />
            <Text style={styles.label}>Rol</Text>
            <View style={styles.roleSelectionGroup}>
              <TouchableOpacity
                style={
                  revRol === "Revendedor"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setRevRol("Revendedor")}
              >
                <Text
                  style={
                    revRol === "Revendedor"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Revendedor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  revRol === "Socio"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setRevRol("Socio")}
              >
                <Text
                  style={
                    revRol === "Socio"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Socio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  revRol === "Camioneta"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => {
                  setRevRol("Camioneta");
                  setRevDescuento("");
                  setRevBonificacion("");
                }}
              >
                <Text
                  style={
                    revRol === "Camioneta"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Camioneta
                </Text>
              </TouchableOpacity>
            </View>
            {revRol !== "Camioneta" && (
              <>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Descuento (%)</Text>
                    <TextInput
                      style={styles.modalInputText}
                      keyboardType="numeric"
                      placeholder="Ej: 10"
                      value={revDescuento}
                      onChangeText={(texto) => {
                        setRevDescuento(texto);
                        if (texto.length > 0) setRevBonificacion("");
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Bonificación (%)</Text>
                    <TextInput
                      style={styles.modalInputText}
                      keyboardType="numeric"
                      placeholder="Ej: 15"
                      value={revBonificacion}
                      onChangeText={(texto) => {
                        setRevBonificacion(texto);
                        if (texto.length > 0) setRevDescuento("");
                      }}
                    />
                  </View>
                </View>
                <View style={styles.switchContainer}>
                  <Text style={styles.labelSwitch}>
                    ¿Permitir devoluciones?
                  </Text>
                  <Switch
                    value={revPermiteDevolucion}
                    onValueChange={setRevPermiteDevolucion}
                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                    thumbColor={revPermiteDevolucion ? "#2563eb" : "#f1f5f9"}
                  />
                </View>
              </>
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setModalNuevoRevVisible(false);
                  setModalEditarRevVisible(false);
                }}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={() => guardarRevendedor(modalEditarRevVisible)}
              >
                <Text style={styles.modalTxtConfirm}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ASIGNAR STOCK */}
      <Modal
        visible={modalAsignarVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Asignar Stock</Text>
            <Text style={styles.label}>Revendedor *</Text>
            <TouchableOpacity
              style={styles.mockDropdown}
              onPress={() => {
                setTipoSelector("usuario");
                setModalSelectorVisible(true);
              }}
            >
              <Text style={styles.mockDropdownTxt}>
                {getNombreUsuarioSeleccionado()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>Producto *</Text>
            <TouchableOpacity
              style={styles.mockDropdown}
              onPress={() => {
                setTipoSelector("producto");
                setModalSelectorVisible(true);
              }}
            >
              <Text style={styles.mockDropdownTxt}>
                {getNombreProductoSeleccionado()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>Cantidad *</Text>
            <TextInput
              style={styles.modalInputText}
              keyboardType="numeric"
              value={asignarCantidad}
              onChangeText={setAsignarCantidad}
            />
            <Text style={styles.label}>Estado inicial</Text>
            <View style={styles.roleSelectionGroup}>
              <TouchableOpacity
                style={
                  asignarEstado === "En poder"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setAsignarEstado("En poder")}
              >
                <Text
                  style={
                    asignarEstado === "En poder"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  📦 En poder
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  asignarEstado === "Vendido"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setAsignarEstado("Vendido")}
              >
                <Text
                  style={
                    asignarEstado === "Vendido"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  ✓ Vendido
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
                onPress={handleConfirmarAsignacion}
              >
                <Text style={styles.modalTxtConfirm}>Asignar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SELECTOR */}
      <Modal
        visible={modalSelectorVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>
              Seleccionar{" "}
              {tipoSelector === "usuario" ? "Revendedor" : "Producto"}
            </Text>
            <FlatList
              data={tipoSelector === "usuario" ? usuariosFiltrados : productos}
              keyExtractor={(item) =>
                tipoSelector === "usuario"
                  ? item.id_usuario.toString()
                  : item.id_producto.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectorItem}
                  onPress={() => {
                    if (tipoSelector === "usuario")
                      setAsignarIdUsuario(item.id_usuario);
                    else setAsignarIdProducto(item.id_producto);
                    setModalSelectorVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemTxt}>
                    {tipoSelector === "usuario"
                      ? item.nombre_usuario
                      : `${item.nombre_producto} (Quedan: ${item.stock_unidades || 0})`}
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
        </View>
      </Modal>

      {/* IMPRIMIR */}
      <Modal
        visible={modalImprimirVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Imprimir Reporte</Text>
            <View style={styles.roleSelectionGroup}>
              <TouchableOpacity
                style={
                  opcionImprimir === "todos"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() => setOpcionImprimir("todos")}
              >
                <Text
                  style={
                    opcionImprimir === "todos"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  opcionImprimir !== "todos"
                    ? styles.roleBtnActive
                    : styles.roleBtnInactive
                }
                onPress={() =>
                  setOpcionImprimir(
                    usuariosFiltrados.length > 0
                      ? usuariosFiltrados[0].id_usuario
                      : -1,
                  )
                }
              >
                <Text
                  style={
                    opcionImprimir !== "todos"
                      ? styles.roleTxtActive
                      : styles.roleTxtInactive
                  }
                >
                  Individual
                </Text>
              </TouchableOpacity>
            </View>
            {opcionImprimir !== "todos" && (
              <ScrollView
                style={{
                  maxHeight: 120,
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 8,
                  marginTop: 4,
                  marginBottom: 10,
                }}
              >
                {usuariosFiltrados.map((u) => (
                  <TouchableOpacity
                    key={u.id_usuario}
                    style={[
                      styles.selectorItem,
                      {
                        backgroundColor:
                          opcionImprimir === u.id_usuario ? "#eff6ff" : "#fff",
                        paddingHorizontal: 12,
                      },
                    ]}
                    onPress={() => setOpcionImprimir(u.id_usuario)}
                  >
                    <Text
                      style={[
                        styles.selectorItemTxt,
                        {
                          fontWeight:
                            opcionImprimir === u.id_usuario ? "bold" : "normal",
                          color:
                            opcionImprimir === u.id_usuario
                              ? "#1e40af"
                              : "#334155",
                        },
                      ]}
                    >
                      👤 {u.nombre_usuario}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fecha Inicio</Text>
                <TextInput
                  style={styles.modalInputText}
                  placeholder="DD/MM/YYYY"
                  value={fechaInicio}
                  onChangeText={setFechaInicio}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fecha Fin</Text>
                <TextInput
                  style={styles.modalInputText}
                  placeholder="DD/MM/YYYY"
                  value={fechaFin}
                  onChangeText={setFechaFin}
                />
              </View>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalImprimirVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: "#16a34a" }]}
                onPress={generarPDF}
              >
                <Text style={[styles.modalTxtConfirm, { color: "#fff" }]}>
                  Generar PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  headerActionBtns: {
    flexDirection: "row",
    gap: 10,
    flexWrap: Platform.OS === "web" ? "nowrap" : "wrap",
    width: Platform.OS === "web" ? "auto" : "100%",
  },
  btnHeaderPrimary: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: Platform.OS === "web" ? undefined : 1,
    alignItems: "center",
  },
  txtHeaderPrimary: { color: "#fff", fontWeight: "bold" },
  btnHeaderSecondary: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    flex: Platform.OS === "web" ? undefined : 1,
    alignItems: "center",
  },
  txtHeaderSecondary: { color: "#334155", fontWeight: "bold" },
  btnHeaderPrint: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    flex: Platform.OS === "web" ? undefined : 1,
    alignItems: "center",
  },
  txtHeaderPrint: { color: "#475569", fontWeight: "bold" },
  userCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  badgePermiso: { fontSize: 12, color: "#059669", fontWeight: "bold" },
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
  cardMobile: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardRowMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateMobile: { fontSize: 13, color: "#64748b", marginTop: 2 },
  productNameMobile: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 6,
  },
  quantityMobile: { fontSize: 14, fontWeight: "600", color: "#334155" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    backgroundColor: "#2563eb",
  },
  modalTxtConfirm: { color: "#fff", fontWeight: "bold" },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  labelSwitch: { fontSize: 14, fontWeight: "600", color: "#475569" },
});
