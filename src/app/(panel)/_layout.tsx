import { useRouter } from "expo-router";
import { Drawer, DrawerContentScrollView, DrawerItemList } from "expo-router/drawer";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useAuth } from "../../context/authContext";
import { useEmpresa } from "../../context/empresaContext";

function CustomDrawerContent(props: any) {
  const { usuario, logout } = useAuth();
  const { empresa } = useEmpresa();
  const router = useRouter();

  const manejarCerrarSesion = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerDrawer}>
        <Text style={styles.textoEmpresa}>{empresa?.nombre_empresa}</Text>
        <Text style={styles.textoSubtitulo}>Control de stock</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

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

export default function LayoutPanel() {
  // 👇 1. Medimos la pantalla 👇
  const { width } = useWindowDimensions();
  const esPC = width >= 768;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#007BFF" },
        headerTintColor: "white",
        drawerActiveTintColor: "#007BFF",


        drawerType: esPC ? "permanent" : "front", // Fijo en PC, deslizable en celular
        headerShown: !esPC, // Opcional: Oculta la barra superior azul entera en PC si querés una vista más limpia
      }}
    >
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