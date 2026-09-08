import { supabase } from "@/database/supabase";
import { DetalleVenta } from "@/types/types";
export const obtenerDetallesPorVenta = async (id_venta: number) => {
  try {
    const { data, error } = await supabase
      .from("detalle_venta")
      .select("*, producto(nombre_producto,id_medida, medida(nombre_tipo))")
      .eq("id_venta", id_venta);
    if (error) {
      console.error("Error en la base de datos", error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error en la base de datos", error);
    return [];
  }
};
export const obtenerDetalleVenta = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("detalle_venta")
      .select("*")

      .eq("id_detalle", id)
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
type CreacionDetalleVenta = Omit<DetalleVenta, "id_detalle">;
export const crearDetalleVenta = async (
  data_detalleVenta: CreacionDetalleVenta,
) => {
  try {
    const { data, error } = await supabase
      .from("detalle_venta")
      .insert(data_detalleVenta)
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
export const eliminarDetalleVenta = async (
  id_detalle: number,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("detalle_venta")
      .delete()
      .eq("id_detalle", id_detalle);
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
