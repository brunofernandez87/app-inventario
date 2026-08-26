import { supabase } from "../database/supabase";

export const crearMovimientoStock = async (datos: {
  id_empresa: number;
  id_producto: number;
  tipo_movimiento: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
}) => {
  try {
    const { error } = await supabase.from("movimiento_stock").insert([datos]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al crear movimiento:", error);
    return false;
  }
};

export const obtenerHistorialMovimientos = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("movimiento_stock")
      .select(
        `
        *,
        producto:id_producto ( nombre_producto, codigo_barras )
      `,
      )
      .eq("id_empresa", id_empresa)
      .order("fecha_movimiento", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener el historial de movimientos:", error);
    return [];
  }
};
