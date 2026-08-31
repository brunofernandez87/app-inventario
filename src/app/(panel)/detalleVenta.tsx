import { useEmpresa } from "@/context/empresaContext";
import { obtenerDetalleVenta } from "@/service/detalle_venta";
import { Text, View } from "react-native";

export default function DetalleVenta(id: number) {
  const { empresa } = useEmpresa();
  const buscarDetalle = async () => {
    const resultado = await obtenerDetalleVenta(id, empresa?.id_empresa);
    if (resultado != null) {
      return resultado;
    } else {
      console.error("no se encontro el detalle venta");
    }
  };
  return (
    <View>
      <View>
        <Text>Hey</Text>
      </View>
    </View>
  );
}
