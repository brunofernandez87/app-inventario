import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
export default function Buscador({ placeholder, valor, onChangeText }) {
  return (
    <View style={styles.contenedorBuscador}>
      <Ionicons
        name="search"
        size={20}
        color="#94a3b8"
        style={{ marginRight: 8 }}
      />
      <TextInput
        style={[
          styles.inputBusqueda,
          // El estilo web se pasa directo acá para evitar errores de StyleSheet
          Platform.OS === "web" && ({ outlineStyle: "none" } as any),
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={valor}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search" // Cambia la tecla "Enter" por "Buscar" en el teclado del celular
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onChangeText("")} style={styles.botonLimpiar}>
          <Ionicons name="close-circle" size={20} color="#94a3b8" />
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  contenedorBuscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    marginBottom: 15,
  },
  icono: {
    fontSize: 16,
    marginRight: 8,
  },
  inputBusqueda: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#1e293b",
  },
  botonLimpiar: {
    padding: 5,
    marginLeft: 5,
  },
});
