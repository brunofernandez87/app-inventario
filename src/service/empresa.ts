import { Empresa } from '@/types/types';
import { supabase } from '../database/supabase';

export const obtenerEmpresa = async (id_Empresa: number): Promise<Empresa | null> => {
  try {
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .eq('id_empresa', id_Empresa)
      .single();

    // Si Supabase nos devuelve un error lógico (ej: no encontró la empresa)
    if (error) {
      console.error("Error al obtener la empresa:", error.message);
      return null;
    }

    return data as Empresa;

  } catch (error) {
    // El catch atrapa errores graves (ej: se cortó internet)
    console.error("Error inesperado de conexión/ejecución: ", error);
    return null;
  }
};