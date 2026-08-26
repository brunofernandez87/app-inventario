import { useEmpresa } from "@/context/empresaContext";
import { useListaProducto } from "@/context/listaProductoContext";
import { obtenerAlertaProyeccion, obtenerStockBajo } from "@/service/producto";
import { BlurView } from "expo-blur";
import { Link, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import CreacionProducto from "../producto/crearProducto";
import EditarProducto from "../producto/editarProducto";
export default function ListaProductos() {
  const { width } = useWindowDimensions();
  const celular = width < 768;
  const [modalEdicionVisible, setModalEdicionVisible] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [opcionesVisible, setOpcionesVisible] = useState(false);
  const { listaProducto, cargando, fetchProducts } = useListaProducto();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const [lista, setLista] = useState(listaProducto);
  const { empresa } = useEmpresa();
  const renderItem = useCallback(({ item }: { item: any }) => {
    const filaConAlerta = item.alerta_proyeccion
      ? { backgroundColor: "#fee2e2" }
      : {};
    return (
      <Pressable
        onLongPress={() => abrirOpciones(item)}
        style={({ pressed }) => [
          styles.fila,
          filaConAlerta,
          pressed && { opacity: 0.6 }, // Efecto visual al mantener apretado
        ]}
      >
        {/* es  para que tenga tipo tabla*/}
        <Text numberOfLines={1} style={[styles.celda, { width: 120 }]}>
          {item.codigo_barras}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 130 }]}>
          {item.codigo_alfanumerico}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 150 }]}>
          {item.nombre_producto}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 100 }]}>
          {item.marca}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 90 }]}>
          {item.costo_compra}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 90 }]}>
          {item.precio_venta}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 100 }]}>
          {item.stock_paquetes}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 100 }]}>
          {item.stock_unidades}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 130 }]}>
          {item.unidades_por_paquete}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 100 }]}>
          medida
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 130 }]}>
          {item.bonificacion_paquete}
        </Text>
        <Text numberOfLines={1} style={[styles.celda, { width: 100 }]}>
          {item.ubicacion}
        </Text>
      </Pressable>
    );
  }, []);
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
  useEffect(() => {
    if (!filterStockBajo && !filterAlerta) {
      setLista(listaProducto);
    }
  }, [listaProducto, filterStockBajo, filterAlerta]);

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
        <Link href="/" asChild>
          <Pressable style={styles.botonToolbar}>
            <Text style={styles.textoBotonToolbar}>Imprimir lista</Text>
          </Pressable>
        </Link>
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
          <ScrollView horizontal={true} style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.fila}>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 120 }]}
                >
                  Codigo de barras
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 130 }]}
                >
                  Codigo alfanumerico
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 150 }]}
                >
                  Nombre
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 100 }]}
                >
                  Marca
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 90 }]}
                >
                  Costo compra
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 90 }]}
                >
                  Precio venta
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 100 }]}
                >
                  Stock paquetes
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 100 }]}
                >
                  Stock Unidades
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 130 }]}
                >
                  Unidades por paquete
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 100 }]}
                >
                  Medida
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 130 }]}
                >
                  Bonificacion paquete
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.celdaEncabezado, { width: 100 }]}
                >
                  Ubicacion
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
                setOpcionesVisible(false); // Cierra este menú
                setModalEdicionVisible(true); // Abre tu modal de edición
              }}
            >
              <Text style={styles.textoBotonOpcion}>Editar producto</Text>
            </Pressable>

            {/* BOTÓN QR Y BARRAS */}
            <Pressable
              style={styles.botonOpcion}
              onPress={() => {
                setOpcionesVisible(false);
                alert("Acá abrimos el modal del QR!"); // Reemplazar luego
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
                alert("Acá ejecutamos la función de eliminar!"); // Reemplazar luego
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
    </View>
  );
}
const styles = StyleSheet.create({
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
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1, // Le pone una línea al borde izquierdo de la tabla
    borderColor: "#ccc",
  },
  celdaEncabezado: {
    fontSize: 12,
    fontWeight: "bold",
    borderRightWidth: 1, // La línea vertical que separa las columnas
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 4, // Para que la letra no se pegue a la línea
    textAlign: "center",
    backgroundColor: "#eee",
  },
  celda: {
    fontSize: 12,
    borderRightWidth: 1, // La línea vertical que separa las columnas
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 4,
    textAlign: "center", // Centra el texto como en Excel
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
