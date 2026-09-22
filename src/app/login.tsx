import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Importamos la memoria
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { useAuth } from "../context/authContext";
import { notificaciones } from "../service/notificaciones";

export default function PantallaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado para saber si el casillero está marcado (por defecto sí)
  const [recordarme, setRecordarme] = useState(true);
  // Traemos "usuario" desde el context por si ahí tenés guardado su ID y el de la empresa
  const { login, cargando, usuario } = useAuth();
  const router = useRouter();

  // Obtenemos el ancho y calculamos si es celular 
  const { width } = useWindowDimensions();
  const celular = width < 768;

  const manejarLogin = async () => {
    if (!email || !password) {
      notificaciones.error("Atención", "Por favor completá todos los campos.");
      return;
    }

    const exito = await login(email, password);

    if (exito) {
      await AsyncStorage.setItem("recordarme", recordarme ? "true" : "false");
      router.replace({ pathname: "/(panel)/productos" } as any);
    } else {
      notificaciones.error("Error", "Correo o contraseña incorrectos. Revisá los datos.");
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Combinamos los estilos dependiendo del dispositivo */}
      <View style={[styles.tarjeta, celular ? styles.tarjetaCelular : styles.tarjetaPC]}>

        <Text style={styles.titulo}>Bienvenido</Text>
        <Text style={styles.subtitulo}>Ingresá los datos de tu cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#000000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#000000"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        {/* Checkbox para que el usuario decida si quiere ser recordado */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setRecordarme(!recordarme)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, recordarme && styles.checkboxActivo]}>
            {recordarme && <Text style={styles.tilde}>✓</Text>}
          </View>
          <Text style={styles.textoCheckbox}>Mantener sesión iniciada</Text>
        </TouchableOpacity>

        {cargando ? (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={styles.boton} onPress={manejarLogin}>
            <Text style={styles.textoBoton}>Iniciar Sesión</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", //Agregamos esto para centrar la tarjeta en PC
    padding: 20,
    backgroundColor: "#F4F6F8"
  },

  // Estilo general de la tarjeta
  tarjeta: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    // Agregamos sombras para que también se vea linda en la Web/PC
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // 👇 4. Definimos los anchos condicionales 👇
  tarjetaCelular: {
    width: "100%",
  },
  tarjetaPC: {
    width: 450, // Límite máximo para que no se estire de más en monitores grandes
  },

  titulo: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 5, textAlign: "center" },
  subtitulo: { fontSize: 14, color: "#666", marginBottom: 25, textAlign: "center" },
  input: { backgroundColor: "#F9FAFB", color: "black", borderWidth: 1, borderColor: "#E5E7EB", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  boton: { backgroundColor: "#007BFF", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 5 },
  textoBoton: { color: "white", fontSize: 16, fontWeight: "bold" },

  // Estilos para darle forma al casillero
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: "#007BFF", borderRadius: 5, justifyContent: "center", alignItems: "center", marginRight: 10 },
  checkboxActivo: { backgroundColor: "#007BFF" },
  tilde: { color: "white", fontSize: 14, fontWeight: "bold" },
  textoCheckbox: { color: "#666", fontSize: 15 },
});