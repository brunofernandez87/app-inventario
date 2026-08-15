import { useListaProducto } from "@/context/listaProductoContext";
import { Stack } from "expo-router";
import { Producto } from "@/types/types";
import { View, Text, FlatList } from "react-native";
export default function Productos() {
  const { ListaProducto, setlistaProducto, cargando, fetchProducts } =
    useListaProducto();
  const lista = ListaProducto;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Lista de productos" }} />
      {cargando ? (
        <Text>Cargando...</Text>
      ) : (
        <FlatList
          // flatList ya viene con scroll view y podes limitar las columnas con num columns
          // es el arreglo que va a recorrer
          data={lista}
          // sirve para saber cual es la clave de cada fila tiene que ser string lo que se pasa en key extractor
          keyExtractor={(item) => item.id_producto.toString()}
          // se le muestra como muestra el item desestructurandolo
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#ccc",
              }}
            >
              {/* es  para que tenga tipo tabla*/}
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.codigo_barras}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.codigo_alfanumerico}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.nombre_producto}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>{item.marca} </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>{item.costo_compra}</Text>
              <Text style={{ flex: 1, fontSize: 12 }}>{item.precio_venta}</Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.stock_paquetes}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.stock_unidades}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.unidades_por_paquete}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>
                {item.bonificacion_paquete}
              </Text>
              <Text style={{ flex: 1, fontSize: 12 }}>{item.ubicacion}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
