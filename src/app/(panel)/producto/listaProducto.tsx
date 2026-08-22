import { useListaProducto } from "@/context/listaProductoContext";
import { BlurView } from "expo-blur";
import { Link, Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CreacionProducto from "../../producto/crearProducto";
export default function ListaProductos() {
  const [modalVisible, setModalVisible] = useState(false);
  const { listaProducto, setlistaProducto, cargando, fetchProducts } =
    useListaProducto();
  const memoizedKeyExtractor = useCallback(
    (item: any) => item.id_producto.toString(),
    [],
  );
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.fila}>
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
      </View>
    ),
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Lista de productos" }} />
      {cargando ? (
        <Text>Cargando...</Text>
      ) : !listaProducto || listaProducto.length === 0 ? (
        <Text> no hay productos </Text>
      ) : (
        <View>
          <Link href="/productos" asChild>
            <Pressable>
              <Text>Productos</Text>
            </Pressable>
          </Link>
          <Text>Lista de Productos</Text>
          <Pressable onPress={() => setModalVisible(true)}>
            <Text>Crear Producto +</Text>
          </Pressable>
          <Link href="/" asChild>
            <Pressable>
              <Text>Imprimir lista</Text>
            </Pressable>
          </Link>
          <Text>Solo stock bajo</Text>
          <Text>Solo productos con alerta</Text>
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
                data={listaProducto}
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
          <View style={styles.modalVentana}>
            <CreacionProducto onClose={() => setModalVisible(false)} />
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // El fondo oscuro de la imagen
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
});
