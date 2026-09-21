import { Producto } from "@/types/types";
import { supabase } from "../database/supabase";
export const obtenerProductos = async (
  id_empresa: number,
): Promise<Producto[]> => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("nombre_producto", { ascending: true });
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
export const obtenerProducto = async (
  id: number,
  id_empresa: number,
): Promise<Producto | null> => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("id_empresa", id_empresa)
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
export const obtenerStockBajo = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("id_empresa", id_empresa)
      .eq("alerta_stock", true);
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
export const obtenerAlertaProyeccion = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("vista_productos_con_proyeccion")
      .select("*")
      .eq("id_empresa", id_empresa)
      .eq("alerta_proyeccion", true);
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
export const editarProducto = async (
  data_producto: Partial<Producto>,
  id_empresa: number,
) => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .update(data_producto)
      .eq("id_producto", data_producto.id_producto)
      .eq("id_empresa", id_empresa)
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
  id_empresa: number,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .delete()
      .eq("id_producto", id_producto)
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
type CreacionProducto = Omit<Producto, "id_producto" | "fecha_creacion">;
export const crearProducto = async (data_producto: CreacionProducto) => {
  try {
    const { data, error } = await supabase
      .from("producto")
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
export const modificarCantidad = async (
  id: number,
  cantidad: Number,
  id_empresa: number,
) => {
  const producto = await obtenerProducto(id, id_empresa);
  if (!producto) return;
  const unidades_viejas = producto?.stock_unidades;
  const unidades_nuevas = unidades_viejas - cantidad;
  // Usamos Math.floor para redondear hacia abajo (Ej: 13 unidades / 6 por paquete = 2 paquetes enteros)
  let nuevos_paquetes = 0;
  if (producto.stock_paquetes) {
    nuevos_paquetes = Math.floor(unidades_nuevas / producto.stock_paquetes);
  }
  const { alerta_stock, ...restoDelProducto } = producto;
  const producto_nuevo = {
    ...restoDelProducto,
    stock_unidades: unidades_nuevas,
    stock_paquetes: nuevos_paquetes,
  };
  await editarProducto(producto_nuevo, id_empresa);
};
