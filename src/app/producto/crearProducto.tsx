import { useEmpresa } from "@/context/empresaContext";
import { useListaProducto } from "@/context/listaProductoContext";
import { getMedidas } from "@/service/medida";
import { crearProducto } from "@/service/producto";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
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
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [costo_compra, setCosto_compra] = useState("");
  const [precio_venta, setPrecio_venta] = useState("");
  const [medida, setMedida] = useState(1);
  const [stock_unidades, setStock_unidades] = useState("");
  const [stock_paquetes, setStock_paquetes] = useState("");
  const [unidades_paquete, setUnidades_paquete] = useState("");
  const [bonificacion_paquete, setBonificacion_paquete] = useState("");
  const [stock_minimo, setStock_minimo] = useState("");
  const { empresa } = useEmpresa();
  const [listaMedida, setListamedida] = useState([]);
  useEffect(() => {
    const buscarMedidas = async () => {
      const medidas = await getMedidas(empresa?.id_empresa);
      setListamedida(medidas);
    };
    buscarMedidas();
  }, []);
  const { fetchProducts } = useListaProducto();

  const cambiarUnidadesPorPaquete = (valor) => {
    setUnidades_paquete(valor);
    const unidsPorPaq = Number(valor);
    if (unidsPorPaq > 0) {
      if (stock_paquetes !== "") {
        // Si ya había escrito paquetes, actualizamos el total de unidades
        setStock_unidades(String(Number(stock_paquetes) * unidsPorPaq));
      } else if (stock_unidades !== "") {
        // Si no había paquetes pero sí unidades, calculamos los paquetes
        setStock_paquetes(String(Number(stock_unidades) / unidsPorPaq));
      }
    }
  };
  // Cuando el usuario escribe cuántos PAQUETES tiene
  const cambiarStockPaquetes = (valor) => {
    setStock_paquetes(valor);
    const unidsPorPaq = Number(unidades_paquete);

    // Si sabemos cuántas unidades trae el paquete, multiplicamos
    if (unidsPorPaq > 0 && valor !== "") {
      setStock_unidades(String(Number(valor) * unidsPorPaq));
    }
  };
  // Cuando el usuario escribe cuántas UNIDADES tiene
  const cambiarStockUnidades = (valor) => {
    setStock_unidades(valor);
    const unidsPorPaq = Number(unidades_paquete);
    // Si sabemos cuántas unidades trae el paquete, dividimos
    if (unidsPorPaq > 0 && valor !== "") {
      setStock_paquetes(String(Number(valor) / unidsPorPaq));
    }
  };
  const formularioIncompleto =
    nombre.trim() == "" ||
    codigo_alfanumerico.trim() == "" ||
    costo_compra.trim() == "" ||
    precio_venta.trim() == "";
  const guardarProducto = async () => {
    let codigoBarrasFinal =
      "200" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const id_empresa = empresa?.id_empresa;
    if (id_empresa == null) {
      alert("Error al crear producto");
      return;
    }
    const nuevoProducto = {
      id_empresa: id_empresa,
      codigo_alfanumerico: codigo_alfanumerico,
      codigo_barras: codigoBarrasFinal,
      nombre_producto: nombre,
      marca: marca,
      ubicacion: ubicacion,
      costo_compra: Number(costo_compra),
      precio_venta: Number(precio_venta),
      id_medida: medida,
      stock_unidades: Number(stock_unidades),
      stock_paquetes: Number(stock_paquetes),
      unidades_por_paquete: Number(unidades_paquete),
      bonificacion_paquete: Number(bonificacion_paquete),
      stock_minimo: Number(stock_minimo),
    };
    const respuesta = await crearProducto(nuevoProducto);
    if (respuesta) {
      await fetchProducts();
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
          onChangeText={(texto) => {
            const textoNormalizado = texto.replace(",", ".");
            // Previene que escriban más de un punto accidentalmente
            if (/^\d*\.?\d*$/.test(textoNormalizado)) {
              setCosto_compra(textoNormalizado);
            }
          }}
          placeholder="1500"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.label}>Precio de venta</Text>
        <TextInput
          style={styles.input}
          value={precio_venta}
          onChangeText={(texto) => {
            const textoNormalizado = texto.replace(",", ".");
            // Previene que escriban más de un punto accidentalmente
            if (/^\d*\.?\d*$/.test(textoNormalizado)) {
              setPrecio_venta(textoNormalizado);
            }
          }}
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
              <Picker.Item
                label={medida.nombre_tipo}
                value={medida.id_medida}
                key={medida.id_medida}
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Stock expresado en {medida}</Text>
        <TextInput
          style={styles.input}
          value={stock_unidades}
          onChangeText={(texto) => {
            const soloNumeros = texto.replace(/[^0-9]/g, "");
            cambiarStockUnidades(soloNumeros);
          }}
          placeholder="12"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>{medida} por paquetes</Text>
        <TextInput
          style={styles.input}
          value={unidades_paquete}
          onChangeText={(texto) => {
            const soloNumeros = texto.replace(/[^0-9]/g, "");
            cambiarUnidadesPorPaquete(soloNumeros);
          }}
          placeholder="6"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>Stock de paquetes</Text>
        <TextInput
          style={styles.input}
          value={stock_paquetes}
          onChangeText={(texto) => {
            const soloNumeros = texto.replace(/[^0-9]/g, "");
            cambiarStockPaquetes(soloNumeros);
          }}
          placeholder="2"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>
          Porcentaje de Bonificacion por paquete cerrado (sin el signo %)
        </Text>
        <TextInput
          style={styles.input}
          value={bonificacion_paquete}
          onChangeText={(texto) => {
            const soloNumeros = texto.replace(/[^0-9]/g, "");
            setBonificacion_paquete(soloNumeros);
          }}
          placeholder="10%"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          onSubmitEditing={guardarProducto}
        />

        <Text style={styles.label}>
          Stock minimo de {medida} para la alerta
        </Text>
        <TextInput
          style={styles.input}
          value={stock_minimo}
          onChangeText={(texto) => {
            const soloNumeros = texto.replace(/[^0-9]/g, "");
            setStock_minimo(soloNumeros);
          }}
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
