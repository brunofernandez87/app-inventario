import * as Print from "expo-print";
import { Platform } from "react-native";
// Recibe cualquier código HTML como parámetro y lo imprime
export const imprimirPDF = async (contenidoHTML) => {
  try {
    if (Platform.OS === "web") {
      const ventanaImpresion = window.open("", "_blank");
      ventanaImpresion.document.write(contenidoHTML);
      ventanaImpresion.document.close();

      ventanaImpresion.onload = () => {
        ventanaImpresion.focus();
        ventanaImpresion.print();
        ventanaImpresion.close();
      };
    } else {
      await Print.printAsync({
        html: contenidoHTML,
      });
    }
    return true;
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Hubo un error al intentar imprimir el documento.");
    return false;
  }
};
