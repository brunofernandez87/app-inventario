import { supabase } from "../database/supabase";

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
      .order("fecha_movimiento", { ascending: false }); // Ordenamos del más nuevo al más viejo

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener el historial de movimientos:", error);
    return [];
  }
};
