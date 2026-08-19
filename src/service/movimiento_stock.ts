import { MovimientoStock } from "@/types/types";
import { supabase } from "../database/supabase";

export const crearMovimientoStock = async (
  data_movimiento: Omit<MovimientoStock, "id_movimiento" | "fecha_movimiento">,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("movimiento_stock")
      .insert(data_movimiento);

    if (error) {
      console.error(
        "Error en la base de datos al crear movimiento",
        error.message,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return false;
  }
};
