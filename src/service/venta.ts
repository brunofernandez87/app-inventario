import { supabase } from "@/database/supabase";
import { Venta } from "@/types/types";

export const obtenerVentas = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("venta")
      .select("*")
      .eq("id_empresa", id_empresa);
    if (error) {
      console.error("Error en la base de datos", error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error de conexion/ejecucion", error);
    return [];
  }
};
export const obtenerVenta = async (id: number, id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("venta")
      .select("*")
      .eq("id_empresa", id_empresa)
      .eq("id_venta", id)
      .single();
    if (error) {
      console.error("Error en la base de datos", error.message);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error("Error de conexion/ejecucion", error);
    return null;
  }
};
type CreacionVenta = Omit<Venta, "id_venta">;
export const crearVenta = async (data_venta: CreacionVenta) => {
  try {
    const { data, error } = await supabase
      .from("venta")
      .insert(data_venta)
      .select();
    if (error) {
      console.error("Error en la base de datos", error.message);
      return null;
    }
    return data || [];
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return null;
  }
};
export const eliminarVenta = async (
  id_venta: number,
  id_empresa: number,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("venta")
      .delete()
      .eq("id_venta", id_venta)
      .eq("id_empresa", id_empresa);
    if (error) {
      console.error("Error en la base de datos", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return false;
  }
};
