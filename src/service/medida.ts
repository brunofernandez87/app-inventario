import { supabase } from "../database/supabase";
import { TipoVenta } from "../types/types"; // Mantenemos tu interface TipoVenta si no la cambiaste en types.ts

export const getMedidas = async (idEmpresa: number): Promise<TipoVenta[]> => {
  const { data, error } = await supabase
    .from("medida")
    .select("*")
    .eq("id_empresa", idEmpresa)
    .order("nombre_tipo", { ascending: true });

  if (error) {
    console.error("Error al obtener medidas:", error);
    throw new Error(error.message);
  }
  return data as TipoVenta[];
};

export const addMedida = async (
  medida: Omit<TipoVenta, "id_medida">,
): Promise<TipoVenta> => {
  const { data, error } = await supabase
    .from("medida")
    .insert([medida])
    .select()
    .single();

  if (error) {
    console.error("Error al agregar medida:", error);
    throw new Error(error.message);
  }
  return data as TipoVenta;
};

export const deleteMedida = async (idMedida: number): Promise<void> => {
  const { error } = await supabase
    .from("medida")
    .delete()
    .eq("id_medida", idMedida);

  if (error) {
    console.error("Error al eliminar medida:", error);
    throw new Error(error.message);
  }
};
