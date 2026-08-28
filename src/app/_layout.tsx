import { ListaCarritoProvider } from "@/context/carritoContext";
import { ListaProductoProvider } from "@/context/listaProductoContext";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/authContext";
import { EmpresaProvider } from "../context/empresaContext";

export default function LayoutPrincipal() {
  return (
    <AuthProvider>
      <EmpresaProvider>
        <ListaCarritoProvider>
          <ListaProductoProvider>
            {/* El Stack maneja la navegación visual ocultando la barra superior nativa */}
            <Stack screenOptions={{ headerShown: false }} />
          </ListaProductoProvider>
        </ListaCarritoProvider>
      </EmpresaProvider>
    </AuthProvider>
  );
}
