import { supabase } from "../database/supabase";
import { Producto } from "@/types/types";
export const obtenerProductos = async (): Promise<Producto[]> => {
  try {
    const { data, error } = await supabase.from("productos").select("*");
    if (error) {
      console.error("Error en la base de datos", error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return [];
  }
};
export const obtenerProducto = async (id: number): Promise<Producto | null> => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("id_producto", id)
      .single();
    // TIP: Si sabés que el nombre es único y querés que devuelva
    // un solo objeto en vez de un arreglo, podés agregar .single()
    // después del .eq().
    if (error) {
      console.error("Error en la base de datos", error.message);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error("Error de conexion/ejecucion: ", error);
    return null;
  }
};
export const editarProducto = async (data_producto: Partial<Producto>) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .update(data_producto)
      .eq("id_producto", data_producto.id_producto)
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
export const eliminarProducto = async (
  id_producto: number,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .delete()
      .eq("id_producto", id_producto);
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
type CreacionProducto = Omit<Producto, "id_producto" | "fecha_creacion">;
export const crearProducto = async (data_producto: CreacionProducto) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .insert(data_producto)
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
