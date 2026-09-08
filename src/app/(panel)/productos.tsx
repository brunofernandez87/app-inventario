import { useListaCarrito } from "@/context/carritoContext";
import { useEmpresa } from "@/context/empresaContext";
import { useListaProducto } from "@/context/listaProductoContext";
import { getMedidas } from "@/service/medida";
import { notificaciones } from "@/service/notificaciones";
import {
  eliminarProducto,
  obtenerAlertaProyeccion,
  obtenerStockBajo,
} from "@/service/producto";
import { Producto } from "@/types/types";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { imprimirPDF } from "../../utils/impresora";
import EscanerModal from "../escaner/escanerModal";
import GestionarMedidas from "../medida/medida";
import Carrito from "../producto/carrito";
import CodigoProducto from "../producto/codigoProducto";
import CreacionProducto from "../producto/crearProducto";
import EditarProducto from "../producto/editarProducto";
import VentanaConfirmacion from "../ventanaConfirmacion";

export default function ListaProductos() {
  const { width } = useWindowDimensions();
  const celular = width < 768;
  const [modalEdicionVisible, setModalEdicionVisible] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [opcionesVisible, setOpcionesVisible] = useState(false);
  const [modalMedidasVisible, setModalMedidasVisible] = useState(false);

  const [listaMedida, setListamedida] = useState([]);
  const { listaProducto, cargando, fetchProducts } = useListaProducto();
  const [modalElminar, setModalEliminar] = useState(false);
  const { agregarAlCarrito } = useListaCarrito();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const [lista, setLista] = useState(listaProducto);
  const { empresa } = useEmpresa();

  useEffect(() => {
    const buscarMedidas = async () => {
      if (!empresa?.id_empresa) return;
      const medidas = await getMedidas(empresa?.id_empresa);
      setListamedida(medidas);
    };
    buscarMedidas();
  }, [empresa, modalMedidasVisible]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const medida = listaMedida.find(
        (m: any) => m.id_medida === item.id_medida,
      );
      const filaConAlerta = item.alerta_proyeccion
        ? { backgroundColor: "#fee2e2" }
        : {};
      const margen =
        item.costo_compra > 0
          ? Math.round(
              ((item.precio_venta - item.costo_compra) / item.costo_compra) *
                100,
            )
          : 0;
      return (
        <Pressable
          onPress={() => agregarAlCarrito(item)}
          onLongPress={() => abrirOpciones(item)}
          style={({ pressed }) => [
            styles.fila,
            filaConAlerta,
            pressed && { opacity: 0.6 },
          ]}
        >
          <View style={[styles.celda, { width: 140 }]}>
            <Text style={styles.textoPrincipal} numberOfLines={1}>
              {item.codigo_alfanumerico}
            </Text>
            <Text style={styles.textoSecundario} numberOfLines={1}>
              {item.codigo_barras}
            </Text>
          </View>

          <View style={[styles.celda, { width: 250 }]}>
            <Text
              style={[styles.textoPrincipal, { fontSize: 15 }]}
              numberOfLines={1}
            >
              {item.nombre_producto}
            </Text>
            <Text style={styles.textoSecundario} numberOfLines={1}>
              {item.marca} • {(medida as any)?.nombre_tipo}
            </Text>
          </View>

          <View
            style={[styles.celda, { width: 120, alignItems: "flex-start" }]}
          >
            <View style={styles.badgeUbicacion}>
              <Text style={styles.textoBadge}>{item.ubicacion || "-"}</Text>
            </View>
          </View>

          <View style={[styles.celda, { width: 100 }]}>
            <Text style={styles.textoNormal}>${item.costo_compra}</Text>
          </View>

          <View style={[styles.celda, { width: 100 }]}>
            <Text style={[styles.textoPrincipal, { fontSize: 15 }]}>
              ${item.precio_venta}
            </Text>
          </View>

          <View style={[styles.celda, { width: 90 }]}>
            <Text style={styles.textoVerde}>+{margen}%</Text>
          </View>

          <View style={[styles.celda, { width: 100, alignItems: "center" }]}>
            <Text style={[styles.textoPrincipal, { fontSize: 15 }]}>
              {item.stock_unidades}
            </Text>
            <Text style={styles.textoSecundario}>
              {item.stock_paquetes} paq.
            </Text>
          </View>
        </Pressable>
      );
    },
    [agregarAlCarrito, listaMedida],
  );

  const [modalCodigo, setModalCodigo] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  const procesarCodigoLeido = (codigo: string) => {
    setMostrarEscaner(false);
    const productoEncontrado = listaProducto.find(
      (item: Producto) =>
        item.codigo_barras === codigo || item.codigo_alfanumerico === codigo,
    );

    if (productoEncontrado) {
      abrirOpciones(productoEncontrado);
    } else {
      notificaciones.error(
        "problema producto",
        "Producto no encontrado en el inventario.",
      );
    }
  };

  const [filterStockBajo, setFilterStockBajo] = useState(false);
  const [filterAlerta, setFilterAlerta] = useState(false);
  const stockBajo = async () => {
    setFilterAlerta(false);
    const nuevoEstado = !filterStockBajo;
    setFilterStockBajo(nuevoEstado);
    if (nuevoEstado == true) {
      const productoFiltrado = await obtenerStockBajo(empresa.id_empresa);
      setLista(productoFiltrado);
    } else {
      setLista(listaProducto);
    }
  };
  const alerta_proyeccion = async () => {
    const nuevoEstado = !filterAlerta;
    setFilterStockBajo(false);
    setFilterAlerta(nuevoEstado);
    if (nuevoEstado == true) {
      const productoFiltrados = await obtenerAlertaProyeccion(
        empresa.id_empresa,
      );
      setLista(productoFiltrados);
    }
  };
  const abrirOpciones = (producto_seleccionado: any) => {
    setProductoAEditar(producto_seleccionado);
    setOpcionesVisible(true);
  };
  const eliminacionProducto = async (producto: any) => {
    const respuesta = await eliminarProducto(
      producto.id_producto,
      empresa?.id_empresa,
    );
    if (respuesta == true) {
      await fetchProducts();
      notificaciones.exito("eliminacion producto", "producto eliminado");
      setModalEliminar(false);
    }
  };
  useEffect(() => {
    if (!filterStockBajo && !filterAlerta) {
      setLista(listaProducto);
    }
  }, [listaProducto, filterStockBajo, filterAlerta]);

  const imprimirListaPDF = async () => {
    const filasHTML = lista
      .map((item) => {
        const precio = Number(item.precio_venta) || 0;
        const unidades = Number(item.unidades_por_paquete) || 0;
        const porcentajeDescuento = Number(item.bonificacion_paquete) || 0;
        const subtotal = precio * unidades;
        const totalBonificado =
          subtotal - subtotal * (porcentajeDescuento / 100);
        return `
          <tr>
      <td>${item.nombre_producto || "-"}</td>
      <td>${item.marca || "-"}</td>
  <td>$${precio.toFixed(2)}</td>
        <td>${unidades}</td>
        <td>$${totalBonificado.toFixed(2)}</td>
    </tr>
  `;
      })
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: auto; margin: 10mm; } 
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e293b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background-color: #2563eb; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>Inventario de Productos</h1>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Precio por unidad</th>
              <th>unidad por paquete cerrado</th>
              <th>Bonificacion pack cerrado</th>
            </tr>
          </thead>
          <tbody>
            ${filasHTML}
          </tbody>
        </table>
      </body>
    </html>
  `;
    await imprimirPDF(htmlContent);
  };

  return (
    <View style={{ flex: 1, padding: celular ? 10 : 20 }}>
      <Stack.Screen options={{ title: "Lista de productos" }} />
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.botonToolbar}
        >
          <Text style={styles.textoBotonToolbar}>Crear Producto +</Text>
        </Pressable>
        <Pressable
          onPress={() => setModalMedidasVisible(true)}
          style={styles.botonToolbar}
        >
          <Text style={styles.textoBotonToolbar}>Medidas</Text>
        </Pressable>

        <Pressable style={styles.botonToolbar} onPress={imprimirListaPDF}>
          <Text style={styles.textoBotonToolbar}>Imprimir lista</Text>
        </Pressable>
        <Pressable
          onPress={stockBajo}
          style={[
            styles.botonToolbar,
            {
              backgroundColor: filterStockBajo ? "#2563eb" : "#e5e7eb",
              padding: 10,
              borderRadius: 5,
              marginVertical: 5,
            },
          ]}
        >
          <Text style={[{ color: filterStockBajo ? "white" : "black" }]}>
            {filterStockBajo ? "☑ Solo stock bajo" : "☐ Solo stock bajo"}
          </Text>
        </Pressable>
        <Pressable
          onPress={alerta_proyeccion}
          style={{
            backgroundColor: filterAlerta ? "#2563eb" : "#e5e7eb",
            padding: 10,
            borderRadius: 5,
            marginVertical: 5,
          }}
        >
          <Text
            style={{
              color: filterAlerta ? "white" : "#444",
              fontWeight: "600",
            }}
          >
            {filterAlerta
              ? "☑ Solo productos con alerta"
              : "☐ Solo productos con alerta"}
          </Text>
        </Pressable>
        {Platform.OS !== "web" && (
          <Pressable
            onPress={() => setMostrarEscaner(true)}
            style={[styles.botonToolbar, { backgroundColor: "#3b82f6" }]}
          >
            <Text style={[styles.textoBotonToolbar, { color: "white" }]}>
              📷 Escanear
            </Text>
          </Pressable>
        )}
      </View>
      {cargando ? (
        <Text>Cargando...</Text>
      ) : !lista || lista.length === 0 ? (
        <Text>
          {filterAlerta
            ? "No hay ningún producto con alerta de proyección."
            : filterStockBajo
              ? "No tenés ningún producto con stock bajo."
              : "No hay productos cargados en tu inventario."}{" "}
        </Text>
      ) : (
        <View style={{ flex: 1 }}>
          {celular ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20, gap: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.contenedorTabla, { height: 450 }]}>
                <ScrollView horizontal={true} style={{ flex: 1 }}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.encabezadoRow}>
                      <Text style={[styles.celdaEncabezado, { width: 140 }]}>
                        Código
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 250 }]}>
                        Producto
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                        Ubicacion
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 100 }]}>
                        Costo
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 100 }]}>
                        Precio
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 90 }]}>
                        Margen
                      </Text>
                      <Text
                        style={[
                          styles.celdaEncabezado,
                          { width: 100, textAlign: "center" },
                        ]}
                      >
                        Stock
                      </Text>
                    </View>
                    <FlatList
                      data={lista}
                      keyExtractor={memoizedKeyExtractor}
                      renderItem={renderItem}
                      initialNumToRender={15}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                      nestedScrollEnabled={true}
                    />
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.contenedorTabla, { minHeight: 400 }]}>
                <Carrito />
              </View>
            </ScrollView>
          ) : (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={{ flex: 1, flexDirection: "row", gap: 20 }}>
                <ScrollView horizontal={true} style={{ flex: 1 }}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.encabezadoRow}>
                      <Text style={[styles.celdaEncabezado, { width: 140 }]}>
                        Código
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 250 }]}>
                        Producto
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 120 }]}>
                        Ubicacion
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 100 }]}>
                        Costo
                      </Text>

                      <Text style={[styles.celdaEncabezado, { width: 100 }]}>
                        Precio
                      </Text>
                      <Text style={[styles.celdaEncabezado, { width: 90 }]}>
                        Margen
                      </Text>
                      <Text
                        style={[
                          styles.celdaEncabezado,
                          { width: 100, textAlign: "center" },
                        ]}
                      >
                        Stock
                      </Text>
                    </View>
                    <FlatList
                      data={lista}
                      keyExtractor={memoizedKeyExtractor}
                      renderItem={renderItem}
                      initialNumToRender={15}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                    />
                  </View>
                </ScrollView>
              </View>
              <View style={[styles.contenedorTabla, { flex: 1 }]}>
                <Carrito />
              </View>
            </View>
          )}
        </View>
      )}

      {/* MODAL GESTIONAR MEDIDAS */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalMedidasVisible}
        onRequestClose={() => setModalMedidasVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[
              styles.modalVentana,
              { maxWidth: 500 },
              celular && styles.modalVentanaCelular,
            ]}
          >
            <GestionarMedidas onClose={() => setModalMedidasVisible(false)} />
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[styles.modalVentana, celular && styles.modalVentanaCelular]}
          >
            <CreacionProducto onClose={() => setModalVisible(false)} />
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalEdicionVisible}
        onRequestClose={() => setModalEdicionVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[styles.modalVentana, celular && styles.modalVentanaCelular]}
          >
            {productoAEditar && (
              <EditarProducto
                onClose={() => setModalEdicionVisible(false)}
                producto={productoAEditar}
              />
            )}
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={opcionesVisible}
        onRequestClose={() => setOpcionesVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View style={styles.tarjetaOpciones}>
            <Text style={styles.tituloOpciones}>
              Opciones: {(productoAEditar as any)?.nombre_producto}
            </Text>

            <Pressable
              style={styles.botonOpcion}
              onPress={() => {
                setOpcionesVisible(false);
                setModalEdicionVisible(true);
              }}
            >
              <Text style={styles.textoBotonOpcion}>Editar producto</Text>
            </Pressable>

            <Pressable
              style={styles.botonOpcion}
              onPress={() => {
                setOpcionesVisible(false);
                setModalCodigo(true);
              }}
            >
              <Text style={styles.textoBotonOpcion}>
                Ver códigos (QR / Barras)
              </Text>
            </Pressable>

            <Pressable
              style={[styles.botonOpcion, styles.botonOpcionEliminar]}
              onPress={() => {
                setOpcionesVisible(false);
                setModalEliminar(true);
              }}
            >
              <Text style={styles.textoBotonEliminar}>Eliminar producto</Text>
            </Pressable>

            <Pressable
              style={styles.botonCancelarOpciones}
              onPress={() => setOpcionesVisible(false)}
            >
              <Text style={styles.textoCancelarOpciones}>Cancelar</Text>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalCodigo}
        onRequestClose={() => setModalCodigo(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[styles.modalVentana, celular && styles.modalVentanaCelular]}
          >
            {productoAEditar && (
              <CodigoProducto
                onClose={() => setModalCodigo(false)}
                producto={productoAEditar}
              />
            )}
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalElminar}
        onRequestClose={() => setModalEliminar(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalFondo}>
          <View
            style={[styles.modalVentana, celular && styles.modalVentanaCelular]}
          >
            {productoAEditar && (
              <VentanaConfirmacion
                onClose={() => setModalEliminar(false)}
                texto={"que desea eliminar este producto"}
                onConfirm={() => eliminacionProducto(productoAEditar)}
              />
            )}
          </View>
        </BlurView>
      </Modal>
      <EscanerModal
        visible={mostrarEscaner}
        alCerrar={() => setMostrarEscaner(false)}
        alEscanear={procesarCodigoLeido}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorTabla: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  modalFondo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalVentana: {
    width: "100%",
    maxWidth: 700,
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalVentanaCelular: {
    maxHeight: "95%",
    padding: 5,
  },
  encabezadoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  celdaEncabezado: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    paddingHorizontal: 5,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  celda: {
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  textoPrincipal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  textoSecundario: {
    fontSize: 13,
    color: "#94a3b8",
  },
  textoNormal: {
    fontSize: 14,
    color: "#475569",
  },
  textoVerde: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#10b981",
  },
  badgeUbicacion: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  botonToolbar: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBotonToolbar: {
    color: "#444",
    fontWeight: "bold",
  },
  tarjetaOpciones: {
    backgroundColor: "white",
    width: "80%",
    maxWidth: 400,
    borderRadius: 15,
    padding: 20,
    alignItems: "stretch",
  },
  tituloOpciones: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  botonOpcion: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  textoBotonOpcion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  botonOpcionEliminar: {
    backgroundColor: "#fee2e2",
  },
  textoBotonEliminar: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  botonCancelarOpciones: {
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  textoCancelarOpciones: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },
});
