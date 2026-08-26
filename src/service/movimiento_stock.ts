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

export const registrarMovimientoManual = async (
  id_empresa: number,
  id_producto: number,
  tipo_movimiento: "ENTRADA" | "SALIDA",
  cantidad: number,
  motivo: string,
): Promise<{ exito: boolean; error?: string }> => {
  try {
    const { data: prod } = await supabase
      .from("producto")
      .select("stock_unidades")
      .eq("id_producto", id_producto)
      .single();

    if (!prod) return { exito: false, error: "Producto no encontrado." };

    let nuevoStock = prod.stock_unidades;

    if (tipo_movimiento === "ENTRADA") {
      nuevoStock += cantidad;
    } else {
      if (prod.stock_unidades < cantidad) {
        return {
          exito: false,
          error: `Stock insuficiente. Solo quedan ${prod.stock_unidades} unidades.`,
        };
      }
      nuevoStock -= cantidad;
    }

    const { error: errUpdate } = await supabase
      .from("producto")
      .update({ stock_unidades: nuevoStock })
      .eq("id_producto", id_producto);

    if (errUpdate) throw errUpdate;
    const { error: errInsert } = await supabase
      .from("movimiento_stock")
      .insert([{ id_empresa, id_producto, tipo_movimiento, cantidad, motivo }]);

    if (errInsert) throw errInsert;

    return { exito: true };
  } catch (error) {
    console.error("Error al registrar movimiento manual:", error);
    return { exito: false, error: "Error de conexión." };
  }
};
