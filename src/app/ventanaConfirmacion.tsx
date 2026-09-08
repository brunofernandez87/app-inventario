import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function VentanaConfirmacion({ onClose, onConfirm, texto }) {
  const [confirmar, setConfirmar] = useState("");
  const botonDeshabilitado = confirmar.toLowerCase().trim() !== "confirmar";
  const manejoConfirmacion = async () => {
    if (!botonDeshabilitado) {
      onConfirm();
      setConfirmar("");
      onClose();
    }
  };
  return (
    <View style={styles.contenedor}>
      <Text style={styles.texto}>
        Esta seguro de {texto}? en caso de que si escriba "confirmar"
      </Text>
      <TextInput
        style={styles.input}
        value={confirmar}
        onChangeText={setConfirmar}
        placeholder="confirmar"
        placeholderTextColor="#9ca3af"
        onSubmitEditing={manejoConfirmacion}
        autoCapitalize="none"
      />
      <View style={styles.botonera}>
        <Pressable onPress={onClose}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
        <Pressable disabled={botonDeshabilitado} onPress={manejoConfirmacion}>
          <Text
            style={[
              styles.textoConfirmar,
              { color: botonDeshabilitado ? "#9ca3af" : "#dc2626" },
            ]}
          >
            Confirmar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  texto: {
    marginBottom: 15,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#000000",
  },
  botonera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoCancelar: {
    fontSize: 16,
    color: "#6b7280",
  },
  textoConfirmar: {
    fontSize: 16,
    fontWeight: "600",
  },
});
