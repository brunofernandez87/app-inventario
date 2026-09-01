import { DetalleVenta } from "@/types/types";
import { Text, View } from "react-native";

export default function DetalleVenta(DetalleVenta: DetalleVenta) {
  return (
    <View>
      <Text>Detalle de la venta numero {DetalleVenta.id_venta}</Text>
      <View>
        <Text>Nombre del producto{DetalleVenta.id_producto}</Text>
        <Text>Es paquete cerrado: {DetalleVenta.es_paquete_cerrado}</Text>
        <Text>Cantidad: {DetalleVenta.cantidad}</Text>
        <Text>Precio Unitario {DetalleVenta.precio_unitario}</Text>
        <Text>Total {DetalleVenta.subtotal}</Text>
      </View>
    </View>
  );
}
