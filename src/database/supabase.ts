import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Expo inyecta mágicamente estas variables gracias al prefijo EXPO_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Guarda el token de sesión en la memoria del celu
    autoRefreshToken: true, // Renueva la sesión automáticamente
    persistSession: true, // Mantiene al usuario logueado
    detectSessionInUrl: false,
  },
});
