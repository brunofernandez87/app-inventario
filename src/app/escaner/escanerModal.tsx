import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
export default function EscanerModal({ visible, alCerrar, alEscanear }) {
  const [permisos, solicitarPermisos] = useCameraPermissions();

  // Si el modal se abre y no hay permisos, los pedimos automáticamente
  useEffect(() => {
    if (visible && permisos && !permisos.granted) {
      solicitarPermisos();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      {permisos?.granted ? (
        <View style={styles.contenedorCamara}>
          <CameraView
            style={styles.camara}
            facing="back"
            // Cuando detecta un código, ejecuta la función que le pasamos desde la pantalla principal
            onBarcodeScanned={({ data }) => alEscanear(data)}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128"],
            }}
          />
          <View style={styles.contenedorBotonFlotante}>
            <TouchableOpacity style={styles.botonCerrar} onPress={alCerrar}>
              <Text style={styles.textoBoton}>Cancelar Escaneo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.contenedorCentro}>
          <Text style={styles.textoCentro}>Solicitando permisos de cámara...</Text>
          <TouchableOpacity style={styles.botonPermiso} onPress={() => {
            // Si el permiso está denegado de forma permanente, abrimos los ajustes del celular
            if (permisos && !permisos.canAskAgain) {
              Linking.openSettings();
            } else {
              solicitarPermisos();
            }
          }}>
            <Text style={styles.textoBoton}>Abrir Configuración para dar Permiso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCerrar} onPress={alCerrar}>
            <Text style={styles.textoBoton}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedorCamara: {
    flex: 1,
    backgroundColor: '#000',
  },
  camara: {
    flex: 1, // Obliga a la cámara a ocupar todo el espacio disponible
    width: '100%',
  },
  // Contenedor flotante para que el botón de cancelar quede sobre la cámara
  contenedorBotonFlotante: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  botonCerrar: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center'
  },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoCentro: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  botonPermiso: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, marginBottom: 15, width: '80%', alignItems: 'center' }
});