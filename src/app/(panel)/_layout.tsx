import { useRouter } from "expo-router";
import { Drawer, DrawerContentScrollView, DrawerItemList } from "expo-router/drawer";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/authContext";
import { useEmpresa } from "../../context/empresaContext";


function CustomDrawerContent(props: any) {
  // Traemos los datos de la nube para mostrar nombres de empresa y usuario
  const { usuario, logout } = useAuth();
  const { empresa } = useEmpresa();
  const router = useRouter();

  // Función para destruir la sesión y devolverte a la pantalla blanca de entrada
  const manejarCerrarSesion = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1 }}>
      {/* nombre de la empresa */}
      <View style={styles.headerDrawer}>
        <Text style={styles.textoEmpresa}>{empresa?.nombre_empresa}</Text>
        <Text style={styles.textoSubtitulo}>Control de stock</Text>
      </View>

      {/*  Muestra la lista de pantallas */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        {/* DrawerItemList dibuja automáticamente las opciones que configuremos más abajo */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Muestra los datos del empleado y el botón de salir */}
      <View style={styles.footerDrawer}>
        <Text style={styles.textoUsuario}>{usuario?.nombre_usuario}</Text>
        <Text style={styles.textoRol}>{usuario?.rol}</Text>

        <TouchableOpacity style={styles.botonCerrar} onPress={manejarCerrarSesion}>
          <Text style={styles.textoBotonCerrar}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

//Le dice a Expo qué pantallas existen acá adentro
export default function LayoutPanel() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#007BFF" },
        headerTintColor: "white",
        drawerActiveTintColor: "#007BFF",
      }}
    >
      {/* Acá declaramos una por una las pantallas a las que se puede navegar */}
      <Drawer.Screen name="productos" options={{ drawerLabel: "Productos", title: "Productos" }} />
      <Drawer.Screen name="revendedores" options={{ drawerLabel: "Revendedores", title: "Revendedores" }} />
      <Drawer.Screen name="movimientos" options={{ drawerLabel: "Movimientos", title: "Movimientos" }} />
      <Drawer.Screen name="ventas" options={{ drawerLabel: "Ventas", title: "Ventas" }} />
      <Drawer.Screen name="reportes" options={{ drawerLabel: "Reportes", title: "Reportes" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerDrawer: { padding: 20, paddingTop: 50, backgroundColor: "#F4F6F8", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  textoEmpresa: { fontSize: 22, fontWeight: "bold", color: "#333" },
  textoSubtitulo: { fontSize: 14, color: "#666", marginTop: 2 },

  footerDrawer: { padding: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: "#FAFAFA" },
  textoUsuario: { fontSize: 18, fontWeight: "bold", color: "#333" },
  textoRol: { fontSize: 14, color: "#007BFF", marginBottom: 15, fontWeight: "500" },

  botonCerrar: { backgroundColor: "#DC3545", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  textoBotonCerrar: { color: "white", fontWeight: "bold", fontSize: 15 },
});