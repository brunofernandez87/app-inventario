import { Medida } from "@/types/types";
import { supabase } from "../database/supabase";

export const getMedidas = async (id_empresa: number): Promise<Medida[]> => {
  try {
    const { data, error } = await supabase
      .from("medida")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("nombre_tipo", { ascending: true });

    if (error) {
      console.error("Error al obtener medidas:", error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return [];
  }
};

export const crearMedida = async (
  id_empresa: number,
  nombre_tipo: string,
  abreviacion: string,
  permite_decimales?: boolean,
) => {
  try {
    const payload = {
      id_empresa,
      nombre_tipo,
      abreviacion,
      permite_decimales: Boolean(permite_decimales),
    };

    const { data, error } = await supabase
      .from("medida")
      .insert(payload)
      .select();

    if (error) return { exito: false, msj: error.message };
    return { exito: true };
  } catch (err: any) {
    return { exito: false, msj: err.message };
  }
};

export const editarMedida = async (
  id_medida: number,
  id_empresa: number,
  nombre_tipo: string,
  abreviacion: string,
  permite_decimales?: boolean,
) => {
  try {
    const { data, error } = await supabase
      .from("medida")
      .update({
        nombre_tipo,
        abreviacion,
        permite_decimales: Boolean(permite_decimales),
      })
      .eq("id_medida", id_medida)
      .eq("id_empresa", id_empresa)
      .select();

    if (error) return { exito: false, msj: error.message };
    if (!data || data.length === 0)
      return {
        exito: false,
        msj: "Supabase no encontró la medida para editar.",
      };

    return { exito: true };
  } catch (err: any) {
    return { exito: false, msj: err.message };
  }
};

export const eliminarMedida = async (id_medida: number, id_empresa: number) => {
  try {
    const { error } = await supabase
      .from("medida")
      .delete()
      .eq("id_medida", id_medida)
      .eq("id_empresa", id_empresa);

    if (error) return { exito: false, msj: error.message };
    return { exito: true };
  } catch (err: any) {
    return { exito: false, msj: err.message };
  }
};
