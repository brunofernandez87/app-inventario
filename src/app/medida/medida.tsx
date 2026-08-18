import { addMedida, deleteMedida, getMedidas } from "@/service/medida";
import { OpcionPredefinida, TipoVenta } from "@/types/types";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const OPCIONES_PREDEFINIDAS: OpcionPredefinida[] = [
  { nombre_tipo: "Kilo", abreviacion: "kg" },
  { nombre_tipo: "Litro", abreviacion: "lts" },
  { nombre_tipo: "Metro", abreviacion: "m" },
  { nombre_tipo: "Gramo", abreviacion: "g" },
  { nombre_tipo: "Centimetro", abreviacion: "cm" },
  { nombre_tipo: "Unidad", abreviacion: "un" },
];

export default function MedidaScreen() {
  const [medidas, setMedidas] = useState<TipoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const ID_EMPRESA_ACTUAL = 1;

  useEffect(() => {
    cargarMedidas();
  }, []);

  const cargarMedidas = async () => {
    try {
      setLoading(true);
      const data = await getMedidas(ID_EMPRESA_ACTUAL);
      setMedidas(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las medidas");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = async (opcion: OpcionPredefinida) => {
    const yaExiste = medidas.some(
      (m) => m.nombre_tipo.toLowerCase() === opcion.nombre_tipo.toLowerCase(),
    );
    if (yaExiste) {
      Alert.alert("Atención", "Esta medida ya está en la lista.");
      setModalVisible(false);
      return;
    }

    try {
      setModalVisible(false);
      const nueva = await addMedida({
        id_empresa: ID_EMPRESA_ACTUAL,
        nombre_tipo: opcion.nombre_tipo,
        abreviacion: opcion.abreviacion,
      });
      setMedidas([...medidas, nueva]);
    } catch (error) {
      Alert.alert("Error", "No se pudo agregar la medida");
    }
  };

  const handleEliminar = (id: number) => {
    Alert.alert("Confirmar", "¿Estás seguro de eliminar esta medida?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMedida(id);
            setMedidas(medidas.filter((m) => m.id_medida !== id));
          } catch (error) {
            Alert.alert("Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: TipoVenta }) => (
    <View className="flex-row items-center justify-between bg-white p-4 mb-2 rounded-lg border border-gray-200 shadow-sm">
      <Text className="text-gray-800 text-lg font-semibold w-1/3">
        {item.nombre_tipo}
      </Text>
      <Text className="text-gray-500 text-base flex-1 text-center bg-gray-100 rounded-md py-1 mx-2">
        {item.abreviacion}
      </Text>
      <TouchableOpacity
        onPress={() => handleEliminar(item.id_medida)}
        className="p-2"
      >
        <Text className="text-red-500 text-lg font-bold">X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Medidas</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Define cómo se miden los productos.
          </Text>
        </View>
        <TouchableOpacity
          className="bg-blue-600 px-4 py-3 rounded-lg shadow"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-bold text-base">+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : (
        <FlatList
          data={medidas}
          keyExtractor={(item) => item.id_medida.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10 text-lg">
              No hay medidas registradas.
            </Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-1/2">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Seleccionar Medida
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-red-500 font-bold text-lg">Cerrar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={OPCIONES_PREDEFINIDAS}
              keyExtractor={(item) => item.nombre_tipo}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row justify-between items-center bg-gray-50 p-4 mb-3 rounded-xl border border-gray-200 active:bg-blue-50"
                  onPress={() => handleAgregar(item)}
                >
                  <Text className="text-lg font-semibold text-gray-800">
                    {item.nombre_tipo}
                  </Text>
                  <Text className="text-gray-500">{item.abreviacion}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
