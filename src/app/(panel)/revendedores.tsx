import {
  asignarStockARevendedor,
  crearNuevoRevendedor,
  obtenerProductosParaAsignar,
  obtenerRevendedoresYStock,
  procesarDevolucion,
  procesarVentaTotal,
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
  const [itemSeleccionado, setItemSeleccionado] =
    useState<StockRevendedor | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");

  const [modalNuevoRevVisible, setModalNuevoRevVisible] = useState(false);
  const [nuevoRevNombre, setNuevoRevNombre] = useState("");
  const [nuevoRevRol, setNuevoRevRol] = useState("Revendedor");
  const [nuevoRevDescuento, setNuevoRevDescuento] = useState("");
  const [nuevoRevBonificacion, setNuevoRevBonificacion] = useState("");
  const [nuevoRevPermiteDevolucion, setNuevoRevPermiteDevolucion] =
    useState(false);

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

  // === ESTADOS PARA EL MODAL DE IMPRIMIR ===
  const [modalImprimirVisible, setModalImprimirVisible] = useState(false);
  const [opcionImprimir, setOpcionImprimir] = useState<"todos" | number>(
    "todos",
  );

  // Fechas por defecto (Primer día del mes y Hoy)
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

  const handleVendido = (item: StockRevendedor) => {
    const confirmarYVender = async () => {
      setLoading(true);
      const exito = await procesarVentaTotal(item, ID_EMPRESA_ACTUAL);
      if (exito) {
        await cargarDatos();
      } else {
        Alert.alert("Error", "No se pudo registrar la venta.");
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      const seguro = window.confirm(
        `¿Marcar las ${item.cantidad} unidades como vendidas?`,
      );
      if (seguro) confirmarYVender();
    } else {
      Alert.alert(
        "Confirmar",
        `¿Marcar las ${item.cantidad} unidades como vendidas?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Vendido", onPress: confirmarYVender },
        ],
      );
    }
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

  const handleCrearNuevoRevendedor = async () => {
    if (nuevoRevNombre.trim() === "")
      return Alert.alert("Atención", "Tenés que escribir el nombre.");

    const valorDesc = parseFloat(nuevoRevDescuento) || 0;
    const valorBonif = parseFloat(nuevoRevBonificacion) || 0;
    const valorFinal = valorDesc > 0 ? valorDesc : valorBonif;

    setLoading(true);
    const exito = await crearNuevoRevendedor(
      nuevoRevNombre,
      nuevoRevRol as any,
      valorFinal,
      ID_EMPRESA_ACTUAL,
      nuevoRevPermiteDevolucion,
    );

    if (exito) {
      setModalNuevoRevVisible(false);
      setNuevoRevNombre("");
      setNuevoRevDescuento("");
      setNuevoRevBonificacion("");
      setNuevoRevRol("Revendedor");
      setNuevoRevPermiteDevolucion(false);
      await cargarDatos();
    } else {
      Alert.alert("Error", "No se pudo crear. Revisá la conexión.");
      setLoading(false);
    }
  };

  const handleConfirmarAsignacion = async () => {
    const cantidadFinal = parseFloat(asignarCantidad);
    if (!asignarIdUsuario)
      return Alert.alert("Atención", "Seleccioná un revendedor.");
    if (!asignarIdProducto)
      return Alert.alert("Atención", "Seleccioná un producto.");
    if (isNaN(cantidadFinal) || cantidadFinal <= 0)
      return Alert.alert("Atención", "Ingresá una cantidad válida mayor a 0.");

    setLoading(true);
    const exito = await asignarStockARevendedor(
      asignarIdUsuario,
      asignarIdProducto,
      cantidadFinal,
      asignarEstado as any,
      ID_EMPRESA_ACTUAL,
    );

    if (exito) {
      setModalAsignarVisible(false);
      setAsignarIdUsuario(null);
      setAsignarIdProducto(null);
      setAsignarCantidad("");
      setAsignarEstado("En poder");
      await cargarDatos();
    } else {
      Alert.alert("Error", "Hubo un problema al asignar el stock.");
      setLoading(false);
    }
  };

  const getNombreUsuarioSeleccionado = () => {
    if (!asignarIdUsuario) return "Seleccionar...";
    return (
      usuarios.find((u) => u.id_usuario === asignarIdUsuario)?.nombre_usuario ||
      "Desconocido"
    );
  };
  const getNombreProductoSeleccionado = () => {
    if (!asignarIdProducto) return "Seleccionar...";
    return (
      productos.find((p) => p.id_producto === asignarIdProducto)
        ?.nombre_producto || "Desconocido"
    );
  };

  const usuariosFiltrados = usuarios.filter((u) => u.rol !== "Admin");

  // === MAGIA: GENERACIÓN DE PDF MEJORADA ===
  const generarPDF = async () => {
    try {
      setLoading(true);

      // Parseamos las fechas ingresadas manualmente (DD/MM/YYYY)
      const parseDate = (str: string) => {
        const partes = str.split("/");
        if (partes.length === 3) {
          return new Date(
            parseInt(partes[2]),
            parseInt(partes[1]) - 1,
            parseInt(partes[0]),
          );
        }
        return new Date(2000, 0, 1); // Fecha muy vieja si escriben mal
      };

      const dateInicio = parseDate(fechaInicio);
      const dateFin = parseDate(fechaFin);
      dateFin.setHours(23, 59, 59, 999); // Para incluir todo el día de fin

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
              .usuario-box p { margin: 5px 0 0 0; font-size: 14px; color: #475569; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 13px; }
              th { background-color: #ffffff; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              .row-venta td { background-color: #f4fdf8; }
              .total-box { background-color: #1e293b; color: white; text-align: right; padding: 12px 15px; border-radius: 8px; font-size: 16px; font-weight: bold; margin-bottom: 40px; }
              .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
              .poder { background-color: #fef3c7; color: #b45309; }
              .vendido { background-color: #d1fae5; color: #047857; }
              .devuelto { background-color: #f1f5f9; color: #64748b; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <h1>Reporte de Ventas y Movimientos</h1>
            <div class="fecha">Generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div class="rango">📅 Período: ${fechaInicio} al ${fechaFin}</div>
      `;

      const usuariosAImprimir =
        opcionImprimir === "todos"
          ? usuariosFiltrados
          : usuariosFiltrados.filter((u) => u.id_usuario === opcionImprimir);

      usuariosAImprimir.forEach((usuario) => {
        // Filtramos el stock por el usuario Y por las fechas seleccionadas
        const stockFiltrado = stock.filter((s) => {
          if (s.id_usuario !== usuario.id_usuario) return false;
          if (!(s as any).created_at) return true; // Si por algún motivo no tiene fecha, lo metemos

          const fechaMov = new Date((s as any).created_at);
          return fechaMov >= dateInicio && fechaMov <= dateFin;
        });

        htmlContent += `
          <div class="usuario-box">
            <h2>👤 ${usuario.nombre_usuario}</h2>
            <p><strong>Rol:</strong> ${usuario.rol}</p>
          </div>
        `;

        if (stockFiltrado.length === 0) {
          htmlContent += `<p style="color: #94a3b8; font-style: italic; margin-bottom: 40px;">Sin movimientos en este período.</p>`;
        } else {
          htmlContent += `
            <table>
              <thead>
                <tr>
                  <th style="width: 12%;">Fecha</th>
                  <th style="width: 20%;">Revendedor</th>
                  <th style="width: 28%;">Producto</th>
                  <th style="width: 10%; text-align: center;">Estado</th>
                  <th style="width: 10%; text-align: center;">Cant.</th>
                  <th style="width: 10%; text-align: right;">Precio</th>
                  <th style="width: 10%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
          `;

          let totalVentasRevendedor = 0;

          stockFiltrado.forEach((s) => {
            const nombreProd =
              (s as any).producto?.nombre_producto || "Producto Desconocido";
            const precioVenta = (s as any).producto?.precio_venta || 0;
            const subtotal = s.cantidad * precioVenta;

            const fechaStr = (s as any).created_at
              ? new Date((s as any).created_at).toLocaleDateString("es-AR")
              : "-";

            let claseEstado = "devuelto";
            let filaVenta = "";

            if (s.estado === "En poder") claseEstado = "poder";
            if (s.estado === "Vendido") {
              claseEstado = "vendido";
              filaVenta = "row-venta";
              totalVentasRevendedor += subtotal; // Sumamos a la ganancia solo si está vendido
            }

            htmlContent += `
              <tr class="${filaVenta}">
                <td>${fechaStr}</td>
                <td>${usuario.nombre_usuario}</td>
                <td style="font-weight: bold; color: #0f172a;">${nombreProd}</td>
                <td style="text-align: center;"><span class="badge ${claseEstado}">${s.estado}</span></td>
                <td style="text-align: center;">${s.cantidad}</td>
                <td style="text-align: right;">$${precioVenta.toLocaleString("es-AR")}</td>
                <td style="text-align: right; font-weight: bold; color: ${s.estado === "Vendido" ? "#047857" : "#94a3b8"};">
                  $${subtotal.toLocaleString("es-AR")}
                </td>
              </tr>
            `;
          });

          htmlContent += `
              </tbody>
            </table>
            <div class="total-box">
              TOTAL VENTAS CONCRETADAS: $ ${totalVentasRevendedor.toLocaleString("es-AR")}
            </div>
          `;
        }
      });

      htmlContent += `
            <div class="footer">Documento generado automáticamente por el Sistema de Inventario.</div>
          </body>
        </html>
      `;

      if (Platform.OS === "web") {
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte",
        });
      }

      setModalImprimirVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el documento PDF.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderUsuario = ({ item: usuario }: { item: Usuario }) => {
    const descuento = (usuario as any).descuento || 0;
    const bonificacion =
      usuario.rol === "Camioneta" ? 0 : usuario.bonificacion || 0;
    const permiteDevolver =
      (usuario as any).permite_devolucion === true ||
      usuario.rol === "Camioneta";

    const stockAsignado = stock.filter(
      (s) => s.id_usuario === usuario.id_usuario && s.estado === "En poder",
    );
    const textoBeneficio =
      descuento > 0
        ? `Descuento: ${descuento}%`
        : bonificacion > 0
          ? `Bonificación: ${bonificacion}%`
          : `Sin beneficios`;

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
            onPress={() => handleVendido(item)}
          >
            <Text style={styles.txtVendido}>Vendido</Text>
          </TouchableOpacity>
          {permiteDevolver && (
            <TouchableOpacity
              style={styles.btnDevolver}
              onPress={() => handleDevolver(item)}
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
          <Text style={styles.userName}>{usuario.nombre_usuario}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleBadge}>{usuario.rol}</Text>
            <Text style={styles.discountTxt}>{textoBeneficio}</Text>
            {permiteDevolver && usuario.rol !== "Camioneta" && (
              <Text style={styles.badgePermiso}> Habilitado a devolver</Text>
            )}
          </View>
        </View>

        {stockAsignado.length === 0 ? (
          <Text style={styles.emptyTxt}>Sin stock en poder actualmente.</Text>
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
    const TablaHistorial = (
      <View style={{ minWidth: isWeb ? "100%" : 600, paddingBottom: 10 }}>
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
            Cant.
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

        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 350 }}>
          {stock.length === 0 ? (
            <Text
              style={{
                textAlign: "center",
                color: "#94a3b8",
                paddingVertical: 20,
                fontStyle: "italic",
              }}
            >
              No hay movimientos.
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
                  <Text
                    style={[styles.tableCol, styles.tableRowTxt, { flex: 2 }]}
                  >
                    {nombreProducto}
                  </Text>
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
        </ScrollView>
      </View>
    );

    return (
      <View style={styles.historyCard}>
        <Text style={styles.historyMainTitle}>Historial de Asignaciones</Text>
        {isWeb ? (
          TablaHistorial
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {TablaHistorial}
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
            {usuariosFiltrados.length} clientes especiales registrados
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
          data={usuariosFiltrados}
          keyExtractor={(u) => u.id_usuario.toString()}
          renderItem={renderUsuario}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListFooterComponent={renderHistorial}
        />
      )}

      {/* === MODAL DE IMPRESIÓN (AHORA CON FECHAS) === */}
      <Modal
        visible={modalImprimirVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Imprimir Reporte</Text>

            <Text style={styles.label}>¿Qué querés imprimir?</Text>
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
              <>
                <Text style={styles.label}>Seleccionar Revendedor:</Text>
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
                            opcionImprimir === u.id_usuario
                              ? "#eff6ff"
                              : "#fff",
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
                              opcionImprimir === u.id_usuario
                                ? "bold"
                                : "normal",
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
              </>
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
                onPress={() => {
                  setNuevoRevRol("Camioneta");
                  setNuevoRevDescuento("");
                  setNuevoRevBonificacion("");
                }}
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

            {nuevoRevRol !== "Camioneta" && (
              <>
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

                <View style={styles.switchContainer}>
                  <Text style={styles.labelSwitch}>
                    ¿Permitir devoluciones de mercadería?
                  </Text>
                  <Switch
                    value={nuevoRevPermiteDevolucion}
                    onValueChange={setNuevoRevPermiteDevolucion}
                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                    thumbColor={
                      nuevoRevPermiteDevolucion ? "#2563eb" : "#f1f5f9"
                    }
                  />
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalNuevoRevVisible(false)}
              >
                <Text style={styles.modalTxtCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleCrearNuevoRevendedor}
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
                  Devuelto
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
                    if (tipoSelector === "producto")
                      setAsignarIdProducto(item.id_producto);
                    setModalSelectorVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemTxt}>
                    {tipoSelector === "usuario"
                      ? item.nombre_usuario
                      : `${item.nombre_producto} (Stock: ${item.stock_unidades || 0})`}
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
    justifyContent: "center",
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
    justifyContent: "center",
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
    justifyContent: "center",
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
