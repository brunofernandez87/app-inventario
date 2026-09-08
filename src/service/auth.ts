import { supabase } from "../database/supabase";
import { Usuario, Cuenta, SesionUsuario } from "@/types/types";


export const iniciarSesion = async (email: string, password: string): Promise<SesionUsuario | null> => {
  try {
    // Iniciamos sesión en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Error de autenticación:", authError?.message);
      return null;
    }

    const idAuth = authData.user.id; // Este es tu id_auth (UUID)

    // Buscamos la Cuenta vinculada a este id_auth
    const { data: cuentaData, error: cuentaError } = await supabase
      .from("cuenta")
      .select("*")
      .eq("id_auth", idAuth)
      .single();

    if (cuentaError || !cuentaData) {
      console.error("Error al buscar la cuenta:", cuentaError?.message);
      return null;
    }

    // Buscamos el Usuario usando el id_usuario que nos dio la Cuenta
    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_usuario", cuentaData.id_usuario)
      .single();

    if (usuarioError || !usuarioData) {
      console.error("Error al buscar el usuario:", usuarioError?.message);
      return null;
    }

    return {
      usuario: usuarioData as Usuario,
      email: cuentaData.email,
    };

  } catch (error) {
    console.error("Error inesperado en el inicio de sesión:", error);
    return null;
  }
};

// Función para cerrar sesión
export const cerrarSesion = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error al cerrar sesión:", error.message);
};