import { Text, View, StyleSheet } from "react-native";

export default function PantallaPrincipal() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>¡Hola! Este es mi sistema de depósito</Text>
      <Text style={styles.subtitulo}>El texto funciona perfecto.</Text>
    </View>
  );
}

// Acá abajo le damos diseño (colores, tamaños, centrado)
const styles = StyleSheet.create({
  contenedor: {
    flex: 1, // Ocupa toda la pantalla
    justifyContent: "center", // Centra verticalmente
    alignItems: "center", // Centra horizontalmente
    backgroundColor: "#f5f5f5", // Color de fondo gris clarito
  },
  titulo: {
    fontSize: 24, // Tamaño de letra grande
    fontWeight: "bold", // Negrita
    color: "#333", // Gris oscuro
    marginBottom: 10, // Espacio hacia abajo
  },
  subtitulo: {
    fontSize: 16,
    color: "#666",
  },
});
