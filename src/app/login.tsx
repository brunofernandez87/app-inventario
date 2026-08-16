import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/authContext";

export default function PantallaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, cargando } = useAuth();
  const router = useRouter();

  const manejarLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Por favor completá todos los campos.");
      return;
    }

    const exito = await login(email, password);

    if (exito) {
      router.replace("/home");
    } else {
      Alert.alert("Error", "Correo o contraseña incorrectos. Revisá los datos.");
    }
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>Bienvenido</Text>
        <Text style={styles.subtitulo}>Ingresá los datos de tu cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

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
  contenedor: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#F4F6F8" },
  tarjeta: { backgroundColor: "white", padding: 25, borderRadius: 15, elevation: 5 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 5, textAlign: "center" },
  subtitulo: { fontSize: 14, color: "#666", marginBottom: 30, textAlign: "center" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  boton: { backgroundColor: "#007BFF", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  textoBoton: { color: "white", fontSize: 16, fontWeight: "bold" },
});