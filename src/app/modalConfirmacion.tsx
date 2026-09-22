import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Confirmacion({
  visible,
  onConfirm,
  onCancel,
  titulo,
  texto,
}) {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.fondoOscuro}>
        <View style={styles.ventana}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}> {texto}</Text>
          <View style={styles.filaBotones}>
            <TouchableOpacity
              style={[styles.boton, { backgroundColor: "#22c55e" }]}
              onPress={onConfirm}
            >
              <Text style={styles.textoBoton}>Si</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boton, { backgroundColor: "#ef4444" }]}
              onPress={onCancel}
            >
              <Text style={styles.textoBoton}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  fondoOscuro: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  ventana: {
    width: 320,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
  },
  mensaje: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
  },
  filaBotones: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  boton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBoton: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});
