import { useRouter } from "expo-router"; // <-- Importamos el enrutador
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/authContext";
import { useEmpresa } from "../context/empresaContext";

export default function PantallaPrincipal() {
  const { usuario, logout } = useAuth();
  const { empresa } = useEmpresa();
  const router = useRouter(); // <-- Activamos el enrutador

  // Creamos esta función que hace las dos tareas en orden
  const manejarCerrarSesion = async () => {
    await logout(); // 1. Destruye la sesión en Supabase y borra los datos
    router.replace("/login"); // 2. Te patea directamente a la pantalla de Login
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>
        ¡Bienvenido, {usuario?.nombre_usuario}!
      </Text>

      <Text style={styles.subtitulo}>
        Has ingresado a: {empresa?.nombre_empresa}
      </Text>

      {/* Ahora el botón llama a nuestra nueva función */}
      <TouchableOpacity style={styles.botonCerrar} onPress={manejarCerrarSesion}>
        <Text style={styles.textoBoton}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 18,
    color: "#007BFF",
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "500",
  },
  botonCerrar: {
    backgroundColor: "#DC3545",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  textoBoton: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  }
});