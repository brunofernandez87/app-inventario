import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/authContext";

export default function IndexEnrutador() {
  const { usuario, cargando } = useAuth();

  // Mientras le pregunta a Supabase si hay sesión, muestra la ruedita
  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // Si encontró un usuario activo, lo patea a tu sistema de depósito
  if (usuario) {
    return <Redirect href="/productos" />;
  }

  // Si no hay sesión, lo patea al formulario para que ponga la clave
  return <Redirect href="/login" />;
}