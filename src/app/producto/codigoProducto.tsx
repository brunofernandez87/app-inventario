import Barcode from "@kichiyaki/react-native-barcode-generator";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { imprimirPDF } from "../utils/impresora";
export default function CodigoProducto({ onClose, producto }) {
  const imprimir_codigos = async () => {
    const nombre = producto?.nombre_producto || "Producto sin nombre";
    const meta = `${producto?.marca || ""} - ${producto?.ubicacion || ""}`;
    const valorQR = producto?.codigo_alfanumerico || "SIN-CODIGO";
    const valorBarras = producto?.codigo_barras || "0000000000000";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(valorQR)}`;
    const barcodeUrl = `https://barcode.orcascan.com/?type=code128&data=${encodeURIComponent(valorBarras)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            /* Elimina la URL y la fecha automáticas del navegador */
            @page { size: auto; margin: 0mm; } 
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              padding: 40px; /* Margen para no pegar la etiqueta al borde físico del papel */
              background-color: white;
            }
            .etiqueta { 
              border: 2px dashed #ccc; 
              padding: 30px; 
              border-radius: 10px; 
              width: 350px; 
              text-align: center; 
            }
            h2 { margin: 0 0 5px 0; font-size: 22px; color: #1e293b; }
            p { margin: 0 0 25px 0; color: #64748b; font-size: 14px; font-family: monospace; }
            .seccion { margin-bottom: 25px; }
            .label { font-size: 12px; color: #94a3b8; letter-spacing: 1px; margin-bottom: 10px; font-weight: bold; }
            .texto-codigo { margin-top: 5px; font-size: 14px; font-family: monospace; font-weight: bold; color: #334155; }
            img { max-width: 100%; height: auto; }
            .barcode-img { height: 70px; }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <h2>${nombre}</h2>
            <p>${meta}</p>

            <div class="seccion">
              <div class="label">CÓDIGO QR</div>
              <img src="${qrUrl}" alt="Código QR" />
              <div class="texto-codigo">${valorQR}</div>
            </div>

            <div class="seccion">
              <div class="label">CÓDIGO DE BARRAS</div>
              <img src="${barcodeUrl}" class="barcode-img" alt="Código de Barras" />
              <div class="texto-codigo">${valorBarras}</div>
            </div>
          </div>
        </body>
      </html>
    `;
    await imprimirPDF(htmlContent);
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
