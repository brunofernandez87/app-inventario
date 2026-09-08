import { ListaCarritoProvider } from "@/context/carritoContext";
import { ListaProductoProvider } from "@/context/listaProductoContext";
import { ListaVentaProvider } from "@/context/listaVentaContext";
import { Stack } from "expo-router";
import AlertsInApp from "../components/notificaciones/alert_inApp";
import { AuthProvider } from "../context/authContext";
import { EmpresaProvider } from "../context/empresaContext";

export default function LayoutPrincipal() {
  return (
    <AuthProvider>
      <EmpresaProvider>
        <ListaCarritoProvider>
          <ListaVentaProvider>
            <ListaProductoProvider>
              {/* El Stack maneja la navegación visual ocultando la barra superior nativa */}
              <Stack screenOptions={{ headerShown: false }} />
              <AlertsInApp />
            </ListaProductoProvider>
          </ListaVentaProvider>
        </ListaCarritoProvider>
      </EmpresaProvider>
    </AuthProvider>
  );
}
