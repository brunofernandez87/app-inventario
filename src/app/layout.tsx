import { Stack } from "expo-router";
import { ListaProductoProvider } from "@/context/listaProductoContext";
export default function layoutPrincipal() {
  return (
    <ListaProductoProvider>
      <Stack />
      {/* <Stack.Screen 
          name="login" 
          options={{ headerShown: false }}
          sirve para el login evitar que aparezca la barra arriba */}
    </ListaProductoProvider>
  );
}
