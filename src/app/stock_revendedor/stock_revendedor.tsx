<<<<<<< Updated upstream
import { Text, View } from "react-native";

export default function PantallaDetalleVenta() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Pantalla de stock revendedor (En construcción)</Text>
=======
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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function StockRevendedorScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stock, setStock] = useState<StockRevendedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Devolución
  const [modalVisible, setModalVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] =
    useState<StockRevendedor | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");

  const ID_EMPRESA_ACTUAL = 1; // Reemplazar con contexto de sesión

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
    setModalVisible(true);
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

    setModalVisible(false);
    const exito = await procesarDevolucion(
      itemSeleccionado,
      cant,
      ID_EMPRESA_ACTUAL,
    );

    if (exito) {
      Alert.alert("Éxito", "Stock devuelto al depósito general.");
      cargarDatos();
    } else {
      Alert.alert("Error", "No se pudo procesar la devolución.");
    }
  };

  const renderStock = ({ item }: { item: StockRevendedor }) => (
    <View className="flex-row items-center justify-between bg-gray-50 p-3 mt-2 rounded border border-gray-200">
      <View className="flex-1">
        <Text className="font-semibold text-gray-800">
          {(item as any).producto?.nombre_producto}
        </Text>
        <Text className="text-sm text-gray-500">En poder: {item.cantidad}</Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="bg-green-100 border border-green-500 px-3 py-1 rounded"
          onPress={() => handleVendido(item)}
        >
          <Text className="text-green-700 font-bold">Vendido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-orange-100 border border-orange-500 px-3 py-1 rounded"
          onPress={() => handleDevolver(item)}
        >
          <Text className="text-orange-700 font-bold">Devolver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsuario = ({ item: usuario }: { item: Usuario }) => {
    // REGLA: Si es camioneta, el descuento es estricto 0.
    const descuento =
      usuario.rol === "Camioneta" ? 0 : usuario.bonificacion || 0;
    const stockAsignado = stock.filter(
      (s) => s.id_usuario === usuario.id_usuario,
    );

    return (
      <View className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-300">
        <View className="mb-2 border-b border-gray-100 pb-2">
          <Text className="text-xl font-bold text-gray-900">
            {usuario.nombre_usuario}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold uppercase">
              {usuario.rol}
            </Text>
            <Text className="text-gray-500 text-sm">
              Descuento: {descuento}%
            </Text>
          </View>
        </View>

        {stockAsignado.length === 0 ? (
          <Text className="text-gray-400 italic mt-2">Sin stock en poder.</Text>
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

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">
        Control Revendedores
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(u) => u.id_usuario.toString()}
          renderItem={renderUsuario}
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Cantidad a Devolver
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-lg bg-gray-50 text-center mb-4"
              keyboardType="numeric"
              value={cantidadInput}
              onChangeText={setCantidadInput}
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-gray-200"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-800 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-blue-600"
                onPress={confirmarDevolucion}
              >
                <Text className="text-white font-bold">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
>>>>>>> Stashed changes
    </View>
  );
}
