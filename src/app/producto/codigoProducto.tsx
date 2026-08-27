import Barcode from "@kichiyaki/react-native-barcode-generator";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
export default function codigoProducto({ onClose, producto }) {
  const imprimir_codigos = () => {
    alert("imprimiendo");
    onClose();
  };
  const valorQR = producto?.codigo_alfanumerico || "SIN-CODIGO";
  const valorBarras = producto?.codigo_barras || "0000000000000";
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.tituloHeader}> Codigos del producto</Text>
        <Pressable onPress={onClose} style={styles.botonCerrar}>
          <Text style={styles.textoCerrar}>X</Text>
        </Pressable>
      </View>
      <View style={styles.cuerpo}>
        <View style={styles.infoProducto}>
          <Text style={styles.nombreProducto}>{producto.nombre_producto}</Text>
          <Text style={styles.metaProducto}>
            {producto.marca}-{producto.ubicacion}
          </Text>
        </View>
        <View style={styles.seccionCodigo}>
          <Text style={styles.labelSecundario}>Codigo QR</Text>
          <View style={styles.cajaCodigo}>
            <QRCode
              value={valorQR}
              size={120}
              color="black"
              backgroundColor="white"
            />
          </View>
          <Text style={styles.textoCodigoAbajo}>{valorQR}</Text>
        </View>
        <View style={styles.seccionCodigo}>
          <Text style={styles.labelSecundario}>Codigo de barras</Text>
          <View style={styles.cajaCodigo}>
            <Barcode
              format="CODE128"
              value={valorBarras}
              text={valorBarras}
              style={{ marginBottom: 0 }}
              maxWidth={250}
              height={70}
            />
          </View>
        </View>
        <Pressable onPress={imprimir_codigos} style={styles.botonImprimir}>
          <Text style={styles.textoBotonImprimir}>Imprimir</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tituloHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  botonCerrar: {
    padding: 5,
  },
  textoCerrar: {
    fontSize: 24,
    color: "#64748b",
    lineHeight: 24,
  },
  cuerpo: {
    padding: 20,
  },
  infoProducto: {
    marginBottom: 25,
  },
  nombreProducto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
  },
  metaProducto: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "monospace", // Le da el toque técnico de la imagen
  },
  seccionCodigo: {
    alignItems: "center",
    marginBottom: 25,
  },
  labelSecundario: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cajaCodigo: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  textoCodigoAbajo: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  botonImprimir: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotonImprimir: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
});
