import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "../database/supabase";
import { cerrarSesion, iniciarSesion } from "../service/auth";
import { Usuario } from "../types/types";

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Creamos la "nube" vacía usando el molde que definimos arriba.
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const verificarSesionGuardada = async () => {
    setCargando(true);
    try {
      // consulta si hay sesion activa en Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Si hay sesión activa, usamos el id secreto para buscar en la tabla "cuenta"
        const { data: cuenta } = await supabase
          .from("cuenta")
          .select("id_usuario")
          .eq("id_auth", session.user.id)
          .single();

        if (cuenta) {
          // Si encontramos la cuenta, buscamos todos los datos en "usuario"
          const { data: userData } = await supabase
            .from("usuario")
            .select("*")
            .eq("id_usuario", cuenta.id_usuario)
            .single();

          if (userData) {
            // Guardamos los datos en el estado para que toda la app los vea
            setUsuario(userData as Usuario);
          }
        }
      }
    } catch (error) {
      console.error("Error verificando sesión:", error);
    } finally {
      // Pase lo que pase, apagamos la "ruedita de carga"
      setCargando(false);
    }
  };

  // El useEffect hace que verificarSesionGuardada() se ejecute 1 sola vez al abrir la app
  useEffect(() => {
    verificarSesionGuardada();
  }, []);

  // Función puente que usaremos en la pantalla visual de Login
  const login = async (email: string, password: string): Promise<boolean> => {
    setCargando(true);
    // Llama a la función en services/auth.ts
    const sesion = await iniciarSesion(email, password);

    if (sesion) {
      setUsuario(sesion.usuario); // Si anduvo guardamos el usuario
      setCargando(false);
      return true;
    } else {
      setCargando(false);
      return false; // Si falló (clave incorrecta), devolvemos falso
    }
  };

  // Función puente para usar en un botón de "Cerrar Sesión"
  const logout = async () => {
    await cerrarSesion(); // Borra la sesión de la bóveda de Supabase
    setUsuario(null);     // Borra los datos de la nube de la app
  };

  // Acá "empaquetamos" todas las funciones y el usuario, y envolvemos a los {children} 
  // (los children van a ser todas las pantallas de la app)
  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Este es un atajo para no tener que importar useContext y AuthContext en cada pantalla.
// Simplemente escribís `const { usuario } = useAuth();` y listo.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};