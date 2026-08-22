import { useEmpresa } from "@/context/empresaContext";
import { crearProducto } from "@/service/producto";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreacionProducto({ onClose }) {
  const [codigo_alfanumerico, setCodigo_alfanumerico] = useState("");
  const [codigo_barras, setCodigo_barras] = useState("");
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [costo_compra, setCosto_compra] = useState("");
  const [precio_venta, setPrecio_venta] = useState("");
  const [medida, setMedida] = useState("unidad");
  const [stock_unidades, setStock_unidades] = useState("");
  const [stock_paquetes, setStock_paquetes] = useState("");
  const [unidades_paquete, setUnidades_paquete] = useState("");
  const [bonificacion_paquete, setBonificacion_paquete] = useState("");
  const [stock_minimo, setStock_minimo] = useState("");
  const { empresa } = useEmpresa();
  const listaMedida = ["unidad", "kilogramo"];
  const formularioIncompleto =
    nombre.trim() == "" ||
    codigo_alfanumerico.trim() == "" ||
    costo_compra.trim() == "" ||
    precio_venta.trim() == "";
  const guardarProducto = async () => {
    const id_empresa = empresa?.id_empresa;
    if (id_empresa == null) {
      alert("Error al crear producto");
      return;
    }
    let id_medida = 1;
    if (medida == "kilogramo") {
      id_medida = 2;
    }
    const nuevoProducto = {
      id_empresa: id_empresa,
      codigo_alfanumerico: codigo_alfanumerico,
      codigo_barras: codigo_barras,
      nombre_producto: nombre,
      marca: marca,
      ubicacion: ubicacion,
      costo_compra: Number(costo_compra),
      precio_venta: Number(precio_venta),
      id_medida: id_medida,
      stock_unidades: Number(stock_unidades),
      stock_paquetes: Number(stock_paquetes),
      unidades_por_paquete: Number(unidades_paquete),
      bonificacion_paquete: Number(bonificacion_paquete),
      stock_minimo: Number(stock_minimo),
    };
    const respuesta = await crearProducto(nuevoProducto);
    if (respuesta) {
      alert("El producto se creo correctamente");
      onClose();
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.headerModal}>
        <Text style={styles.titulo}> Nuevo Producto</Text>
        <Pressable onPress={onClose}>
          <Text style={{ fontSize: 20 }}>X</Text>
        </Pressable>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Codigo alfanumerico</Text>
        <TextInput
          style={styles.input}
          value={codigo_alfanumerico}
          onChangeText={setCodigo_alfanumerico}
          placeholder="CC-2.5"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Codigo de barras</Text>
        <TextInput
          style={styles.input}
          value={codigo_barras}
          onChangeText={setCodigo_barras}
          placeholder="CC2.5L"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Coca Cola 2.5L"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Marca</Text>
        <TextInput
          style={styles.input}
          value={marca}
          onChangeText={setMarca}
          placeholder="Coca Cola"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Ubicacion</Text>
        <TextInput
          style={styles.input}
          value={ubicacion}
          onChangeText={setUbicacion}
          placeholder="Estanteria 2 repisa 3"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Costo de compra</Text>
        <TextInput
          style={styles.input}
          value={costo_compra}
          onChangeText={setCosto_compra}
          placeholder="1500"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Precio de venta</Text>
        <TextInput
          style={styles.input}
          value={precio_venta}
          onChangeText={setPrecio_venta}
          placeholder="2000"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Medida</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={medida}
            onValueChange={(itemValue) => setMedida(itemValue)}
          >
            {listaMedida.map((medida) => (
              <Picker.Item label={medida} value={medida} key={medida} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Stock por unidades</Text>
        <TextInput
          style={styles.input}
          value={stock_unidades}
          onChangeText={setStock_unidades}
          placeholder="12"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>Unidades por paquetes</Text>
        <TextInput
          style={styles.input}
          value={unidades_paquete}
          onChangeText={setUnidades_paquete}
          placeholder="6"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>Stock de paquetes</Text>
        <TextInput
          style={styles.input}
          value={stock_paquetes}
          onChangeText={setStock_paquetes}
          placeholder="2"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>Bonificacion por paquete cerrado</Text>
        <TextInput
          style={styles.input}
          value={bonificacion_paquete}
          onChangeText={setBonificacion_paquete}
          placeholder="10%"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>
          Stock minimo de unidades para la alerta
        </Text>
        <TextInput
          style={styles.input}
          value={stock_minimo}
          onChangeText={setStock_minimo}
          placeholder="2"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Pressable
          onPress={guardarProducto}
          disabled={formularioIncompleto}
          style={[
            styles.botonBase,
            formularioIncompleto
              ? styles.botonDeshabilitado
              : styles.botonActivo,
          ]}
        >
          <Text style={styles.textoBoton}>Crear Producto</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
// --- ESTILOS ---
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Permite que el ScrollView ocupe toda la pantalla
    backgroundColor: "#f5f5f5", // Fondo gris claro para los bordes en PC
    padding: 20,
    justifyContent: "center", // Centra verticalmente si sobra espacio
  },
  formContainer: {
    width: "100%",
    maxWidth: 600, // LA MAGIA: No pasa de 600px en PC
    alignSelf: "center", // Centra la tarjeta horizontalmente
    backgroundColor: "#ffffff", // Tarjeta blanca
    padding: 25,
    borderRadius: 12, // Bordes redondeados
    // Sombrita linda para PC y Celular
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 0,
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db", // Gris clarito para el borde
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#000000",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    overflow: "hidden", // Evita que las esquinas cuadradas del picker tapen el borde redondeado
  },
  picker: {
    height: 50,
    width: "100%",
    borderWidth: 0, // Saca el borde extra en PC
    backgroundColor: "transparent",
  },
  botonBase: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  botonActivo: {
    backgroundColor: "#2563eb", // Azul moderno
  },
  botonDeshabilitado: {
    backgroundColor: "#9ca3af", // Gris bloqueado
  },
  textoBoton: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
