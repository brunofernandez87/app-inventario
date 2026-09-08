import React, { useImperativeHandle, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Esta es la "llave" que nos permite abrir el modal desde cualquier otro archivo
export const alertaRef = React.createRef();

export default function AlertsInApp() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ titulo: '', mensaje: '', tipo: 'error' });

  // Enganchamos la función "mostrar" a la llave global
  useImperativeHandle(alertaRef, () => ({
    mostrar: (titulo: string, mensaje: string, tipo: string) => {
      setConfig({ titulo, mensaje, tipo });
      setVisible(true);
    }
  }));

  const cerrar = () => setVisible(false);

  // Colores según el tipo de alerta
  const colorBoton = config.tipo === 'error' ? '#dc2626' : '#16a34a';

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.fondoOscuro}>
        <View style={styles.ventana}>
          <Text style={styles.titulo}>{config.titulo}</Text>
          <Text style={styles.mensaje}>{config.mensaje}</Text>

          <TouchableOpacity
            style={[styles.boton, { backgroundColor: colorBoton }]}
            onPress={cerrar}
          >
            <Text style={styles.textoBoton}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondoOscuro: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ventana: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  mensaje: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});