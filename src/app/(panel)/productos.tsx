import { useListaCarrito } from "@/context/carritoContext";
import { useEmpresa } from "@/context/empresaContext";
import { useListaProducto } from "@/context/listaProductoContext";
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
  useWindowDimensions
} from "react-native";
import { imprimirPDF } from "../../utils/impresora";
import EscanerModal from "../escaner/escanerModal";
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
  const { listaProducto, cargando, fetchProducts } = useListaProducto();
  const [modalElminar, setModalEliminar] = useState(false);
  const { agregarAlCarrito } = useListaCarrito();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const [lista, setLista] = useState(listaProducto);
  const { empresa } = useEmpresa();
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
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
            pressed && { opacity: 0.6 }, // Efecto visual al mantener apretado
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

          {/* Producto */}
          <View style={[styles.celda, { width: 250 }]}>
            <Text
              style={[styles.textoPrincipal, { fontSize: 15 }]}
              numberOfLines={1}
            >
              {item.nombre_producto}
            </Text>
            <Text style={styles.textoSecundario} numberOfLines={1}>
              {item.marca} • unidad
            </Text>
          </View>

          {/* Ubicación */}
          <View
            style={[styles.celda, { width: 120, alignItems: "flex-start" }]}
          >
            <View style={styles.badgeUbicacion}>
              <Text style={styles.textoBadge}>{item.ubicacion || "-"}</Text>
            </View>
          </View>

          {/* Costo */}
          <View style={[styles.celda, { width: 100 }]}>
            <Text style={styles.textoNormal}>${item.costo_compra}</Text>
          </View>

          {/* Precio */}
          <View style={[styles.celda, { width: 100 }]}>
            <Text style={[styles.textoPrincipal, { fontSize: 15 }]}>
              ${item.precio_venta}
            </Text>
          </View>

          {/* Margen */}
          <View style={[styles.celda, { width: 90 }]}>
            <Text style={styles.textoVerde}>+{margen}%</Text>
          </View>

          {/* Stock */}
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
    [agregarAlCarrito],
  );

  const [modalCodigo, setModalCodigo] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  // procesa la lectura
  const procesarCodigoLeido = (codigo) => {
    setMostrarEscaner(false);

    // Buscamos el producto en tu lista actual por código de barras o alfanumérico
    const productoEncontrado = listaProducto.find(
      (item: Producto) => item.codigo_barras === codigo || item.codigo_alfanumerico === codigo
    );

    if (productoEncontrado) {
      // Si lo encuentra, abrimos la tarjeta de opciones de ese producto
      abrirOpciones(productoEncontrado);
    } else {
      alert("Producto no encontrado en el inventario.");
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
  const abrirOpciones = (producto_seleccionado) => {
    setProductoAEditar(producto_seleccionado);
    setOpcionesVisible(true);
  };
  const eliminacionProducto = async (producto) => {
    const respuesta = await eliminarProducto(
      producto.id_producto,
      empresa?.id_empresa,
    );
    if (respuesta == true) {
      await fetchProducts();
      alert("producto eliminado"); //cambiar por una notificacion
      setModalEliminar(false);
    }
  };
  useEffect(() => {
    if (!filterStockBajo && !filterAlerta) {
      setLista(listaProducto);
    }
  }, [listaProducto, filterStockBajo, filterAlerta]);
  //logica de impresion
  const imprimirListaPDF = async () => {
    const filasHTML = lista
      .map((item) => {
        const precio = Number(item.precio_venta) || 0;
        const unidades = Number(item.unidades_por_paquete) || 0;
        const porcentajeDescuento = Number(item.bonificacion_paquete) || 0;
        const subtotal = precio * unidades;
        // Calculamos el monto a descontar y se lo restamos al subtotal
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
          <Pressable onPress={() => setMostrarEscaner(true)} style={[styles.botonToolbar, { backgroundColor: '#3b82f6' }]}>
            <Text style={[styles.textoBotonToolbar, { color: 'white' }]}>📷 Escanear</Text>
          </Pressable>)}
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
            // ==========================================
            // VISTA CELULAR: Scroll vertical global
            // ==========================================
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20, gap: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* CAJA PRODUCTOS: Altura fija de 450px para scrollear adentro */}
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
                      nestedScrollEnabled={true} // <-- FUNDAMENTAL PARA CELULARES
                    />
                  </View>
                </ScrollView>
              </View>

              {/* CAJA CARRITO: Queda abajo y toma su altura natural */}
              <View style={[styles.contenedorTabla, { minHeight: 400 }]}>
                <Carrito />
              </View>
            </ScrollView>
          ) : (
            <View
              style={{
                flex: 1,
                flexDirection: celular ? "column" : "row",
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
                      // flatList ya viene con scroll view y podes limitar las columnas con num columns
                      // es el arreglo que va a recorrer
                      data={lista}
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
              <View style={[styles.contenedorTabla, { flex: 1 }]}>
                <Carrito />
              </View>
            </View>
          )}
        </View>
      )}
      <Modal
        animationType="fade"
        transparent={true} // Permite ver el fondo oscuro
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Permite cerrar con el botón "Atrás" de Android
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
        transparent={true} // Permite ver el fondo oscuro
        visible={modalEdicionVisible}
        onRequestClose={() => setModalEdicionVisible(false)} // Permite cerrar con el botón "Atrás" de Android
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
              Opciones: {productoAEditar?.nombre_producto}
            </Text>

            {/* BOTÓN EDITAR */}
            <Pressable
              style={styles.botonOpcion}
              onPress={() => {
                setOpcionesVisible(false);
                setModalEdicionVisible(true);
              }}
            >
              <Text style={styles.textoBotonOpcion}>Editar producto</Text>
            </Pressable>

            {/* BOTÓN QR Y BARRAS */}
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

            {/* BOTÓN ELIMINAR */}
            <Pressable
              style={[styles.botonOpcion, styles.botonOpcionEliminar]}
              onPress={() => {
                setOpcionesVisible(false);
                setModalEliminar(true);
              }}
            >
              <Text style={styles.textoBotonEliminar}>Eliminar producto</Text>
            </Pressable>

            {/* BOTÓN CANCELAR */}
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
        transparent={true} // Permite ver el fondo oscuro
        visible={modalCodigo}
        onRequestClose={() => setModalCodigo(false)} // Permite cerrar con el botón "Atrás" de Android
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
        transparent={true} // Permite ver el fondo oscuro
        visible={modalElminar}
        onRequestClose={() => setModalEliminar(false)} // Permite cerrar con el botón "Atrás" de Android
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
    overflow: "hidden", // Fundamental para que las esquinas no se vuelvan cuadradas
  },
  modalFondo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalVentana: {
    width: "100%",
    maxWidth: 700, // Limita el ancho en la PC
    maxHeight: "90%", // Evita que se salga de la pantalla si es muy largo
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden", // Para que el ScrollView interno no tape los bordes redondos
  },
  modalVentanaCelular: {
    maxHeight: "95%",
    padding: 5, // Un poco menos de espacio desperdiciado en los bordes para el celu
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
    color: "#10b981", // Verde característico del margen
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
    flexDirection: "row", // Los pone uno al lado del otro
    flexWrap: "wrap", // Si no entran en la pantalla del celular, los baja de renglón
    gap: 10, // Espacio entre los botones (funciona perfecto en web y react native moderno)
    marginBottom: 15, // Espacio para que no se peguen a la tabla
    alignItems: "center",
  },
  botonToolbar: {
    backgroundColor: "#e5e7eb", // Gris clarito por defecto
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
    backgroundColor: "#f3f4f6", // Gris clarito
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
    backgroundColor: "#fee2e2", // Rojo muy clarito
  },
  textoBotonEliminar: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626", // Rojo fuerte
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
