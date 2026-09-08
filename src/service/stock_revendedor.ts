import { StockRevendedor, Usuario } from "@/types/types";
import { supabase } from "../database/supabase";
import { crearMovimientoStock } from "./movimiento_stock";

export const obtenerRevendedoresYStock = async (id_empresa: number) => {
  try {
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("nombre_usuario", { ascending: true });

    if (errUsuarios) throw errUsuarios;

    const { data: stock, error: errStock } = await supabase
      .from("stock_revendedor")
      .select(
        `
        *,
        id_producto,
        producto:id_producto ( id_producto, nombre_producto, precio_venta, codigo_barras )
      `,
      )
      .order("id_registro", { ascending: false });

    if (errStock) throw errStock;

    return {
      usuarios: (usuarios || []) as Usuario[],
      stock: (stock || []) as StockRevendedor[],
    };
  } catch (error) {
    console.error("Error al obtener datos de revendedores: ", error);
    return { usuarios: [], stock: [] };
  }
};

export const procesarDevolucion = async (
  registro: StockRevendedor,
  cantidad_devuelta: number,
  id_empresa: number,
): Promise<boolean> => {
  try {
    const idRegistro = registro.id_registro;
    const idProducto =
      registro.id_producto || (registro as any).producto?.id_producto;

    if (!idRegistro || !idProducto) return false;

    const cantidad_restante = registro.cantidad - cantidad_devuelta;

    if (cantidad_restante <= 0) {
      await supabase
        .from("stock_revendedor")
        .update({ estado: "Devuelto" })
        .eq("id_registro", idRegistro);
    } else {
      await supabase
        .from("stock_revendedor")
        .update({ cantidad: cantidad_restante })
        .eq("id_registro", idRegistro);
      await supabase.from("stock_revendedor").insert({
        id_usuario: registro.id_usuario,
        id_producto: idProducto,
        cantidad: cantidad_devuelta,
        estado: "Devuelto",
      });
    }

    const { data: prod } = await supabase
      .from("producto")
      .select("stock_unidades")
      .eq("id_producto", idProducto)
      .single();
    if (prod) {
      await supabase
        .from("producto")
        .update({ stock_unidades: prod.stock_unidades + cantidad_devuelta })
        .eq("id_producto", idProducto);
    }

    const { data: user } = await supabase
      .from("usuario")
      .select("nombre_usuario")
      .eq("id_usuario", registro.id_usuario)
      .single();
    const nombreRev = user?.nombre_usuario || "revendedor";

    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: idProducto,
      tipo_movimiento: "ENTRADA",
      cantidad: cantidad_devuelta,
      motivo: `Devolución de: ${nombreRev}`,
    });

    return true;
  } catch (error) {
    console.error("Error al procesar devolución: ", error);
    return false;
  }
};

export const procesarVenta = async (
  registro: StockRevendedor,
  cantidad_vendida: number,
  id_empresa: number,
): Promise<boolean> => {
  try {
    const idRegistro = registro.id_registro;
    const idProducto =
      registro.id_producto || (registro as any).producto?.id_producto;

    if (!idRegistro || !idProducto) return false;

    const cantidad_restante = registro.cantidad - cantidad_vendida;

    if (cantidad_restante <= 0) {
      await supabase
        .from("stock_revendedor")
        .update({ estado: "Vendido" })
        .eq("id_registro", idRegistro);
    } else {
      await supabase
        .from("stock_revendedor")
        .update({ cantidad: cantidad_restante })
        .eq("id_registro", idRegistro);
      await supabase.from("stock_revendedor").insert({
        id_usuario: registro.id_usuario,
        id_producto: idProducto,
        cantidad: cantidad_vendida,
        estado: "Vendido",
      });
    }

    const { data: user } = await supabase
      .from("usuario")
      .select("nombre_usuario")
      .eq("id_usuario", registro.id_usuario)
      .single();
    const nombreRev = user?.nombre_usuario || "revendedor";

    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: idProducto,
      tipo_movimiento: "SALIDA",
      cantidad: cantidad_vendida,
      motivo: `Venta concretada por: ${nombreRev}`,
    });

    return true;
  } catch (error) {
    console.error("Error al procesar venta: ", error);
    return false;
  }
};

export const crearNuevoRevendedor = async (
  nombre_usuario: string,
  rol: "Revendedor" | "Socio" | "Camioneta",
  bonificacion: number,
  id_empresa: number,
  permite_devolucion: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("usuario").insert({
      id_empresa: id_empresa,
      nombre_usuario: nombre_usuario,
      rol: rol,
      bonificacion: bonificacion > 0 ? bonificacion : null,
      permite_devolucion: permite_devolucion,
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al crear el nuevo revendedor: ", error);
    return false;
  }
};

export const editarRevendedor = async (
  id_usuario: number,
  nombre_usuario: string,
  rol: string,
  bonificacion: number,
  permite_devolucion: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("usuario")
      .update({
        nombre_usuario,
        rol,
        bonificacion: bonificacion > 0 ? bonificacion : null,
        permite_devolucion,
      })
      .eq("id_usuario", id_usuario);
    return !error;
  } catch (error) {
    return false;
  }
};

export const eliminarRevendedor = async (
  id_usuario: number,
  id_empresa: number,
): Promise<boolean> => {
  try {
    const { data: user } = await supabase
      .from("usuario")
      .select("nombre_usuario")
      .eq("id_usuario", id_usuario)
      .single();
    const nombreRev = user?.nombre_usuario || "revendedor eliminado";

    const { data: stockEnPoder, error: errStock } = await supabase
      .from("stock_revendedor")
      .select("id_producto, cantidad")
      .eq("id_usuario", id_usuario)
      .eq("estado", "En poder");

    if (errStock) throw errStock;

    if (stockEnPoder && stockEnPoder.length > 0) {
      for (const item of stockEnPoder) {
        const { data: prod } = await supabase
          .from("producto")
          .select("stock_unidades")
          .eq("id_producto", item.id_producto)
          .single();
        if (prod) {
          await supabase
            .from("producto")
            .update({ stock_unidades: prod.stock_unidades + item.cantidad })
            .eq("id_producto", item.id_producto);

          await crearMovimientoStock({
            id_empresa: id_empresa,
            id_producto: item.id_producto,
            tipo_movimiento: "ENTRADA",
            cantidad: item.cantidad,
            motivo: `Devolución automática al eliminar cuenta de: ${nombreRev}`,
          });
        }
      }
    }

    await supabase
      .from("stock_revendedor")
      .delete()
      .eq("id_usuario", id_usuario);
    const { error: errDelete } = await supabase
      .from("usuario")
      .delete()
      .eq("id_usuario", id_usuario);

    if (errDelete) throw errDelete;

    return true;
  } catch (error) {
    console.error("Error al eliminar revendedor: ", error);
    return false;
  }
};

export const obtenerProductosParaAsignar = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("producto")
      .select("id_producto, nombre_producto, codigo_barras, stock_unidades")
      .eq("id_empresa", id_empresa);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener productos: ", error);
    return [];
  }
};

export const asignarStockARevendedor = async (
  id_usuario: number,
  id_producto: number,
  cantidad: number,
  estado: "En poder" | "Vendido",
  id_empresa: number,
): Promise<{ exito: boolean; error?: string }> => {
  try {
    const { data: prod } = await supabase
      .from("producto")
      .select("stock_unidades")
      .eq("id_producto", id_producto)
      .single();
    if (!prod) return { exito: false, error: "Producto no encontrado." };
    if (prod.stock_unidades < cantidad)
      return {
        exito: false,
        error: `Stock insuficiente. Solo te quedan ${prod.stock_unidades} unidades.`,
      };

    const { error: errInsert } = await supabase
      .from("stock_revendedor")
      .insert({ id_usuario, id_producto, cantidad, estado });
    if (errInsert) throw errInsert;

    await supabase
      .from("producto")
      .update({ stock_unidades: prod.stock_unidades - cantidad })
      .eq("id_producto", id_producto);

    const { data: user } = await supabase
      .from("usuario")
      .select("nombre_usuario")
      .eq("id_usuario", id_usuario)
      .single();
    const nombreRev = user?.nombre_usuario || "revendedor";

    await crearMovimientoStock({
      id_empresa,
      id_producto,
      tipo_movimiento: "SALIDA",
      cantidad,
      motivo: `Asignación a: ${nombreRev} (${estado})`,
    });

    return { exito: true };
  } catch (error) {
    console.error("Error al asignar stock: ", error);
    return { exito: false, error: "Error de conexión." };
  }
};
