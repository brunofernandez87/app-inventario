import { StockRevendedor, Usuario } from "@/types/types";
import { supabase } from "../database/supabase";
import { crearMovimientoStock } from "./movimiento_stock";
import { editarProducto, obtenerProducto } from "./producto";

export const obtenerRevendedoresYStock = async (id_empresa: number) => {
  try {
    // 1. Traemos los usuarios de la empresa
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_empresa", id_empresa);

    if (errUsuarios) throw errUsuarios;

    // 2. Traemos el stock asignado que está "En poder"
    const { data: stock, error: errStock } = await supabase
      .from("stock_revendedor")
      .select(
        `
        *,
        producto:id_producto ( nombre_producto, precio_venta, codigo_barras )
      `,
      )
      .eq("estado", "En poder");

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
    const cantidad_restante = registro.cantidad - cantidad_devuelta;

    // 1. Actualizar el registro de stock_revendedor
    if (cantidad_restante <= 0) {
      // Devolvió todo
      await supabase
        .from("stock_revendedor")
        .update({ estado: "Devuelto" })
        .eq("id_registro", registro.id_registro);
    } else {
      // Devolución parcial: achicamos lo que tiene "En poder" y creamos un registro para el historial "Devuelto"
      await supabase
        .from("stock_revendedor")
        .update({ cantidad: cantidad_restante })
        .eq("id_registro", registro.id_registro);

      await supabase.from("stock_revendedor").insert({
        id_usuario: registro.id_usuario,
        id_producto: registro.id_producto,
        cantidad: cantidad_devuelta,
        estado: "Devuelto",
      });
    }

    // 2. Devolver la mercadería al stock central (usando tus funciones de producto.ts)
    const productoActual = await obtenerProducto(registro.id_producto);
    if (productoActual) {
      await editarProducto({
        id_producto: registro.id_producto,
        stock_unidades: productoActual.stock_unidades + cantidad_devuelta,
      });
    }

    // 3. Registrar el movimiento
    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: registro.id_producto,
      tipo_movimiento: "ENTRADA", // Entra al depósito de nuevo
      cantidad: cantidad_devuelta,
      motivo: "Devolución de revendedor/camioneta",
    });

    return true;
  } catch (error) {
    console.error("Error al procesar devolución: ", error);
    return false;
  }
};

export const procesarVentaTotal = async (
  registro: StockRevendedor,
  id_empresa: number,
): Promise<boolean> => {
  try {
    // 1. Marcamos el stock como vendido
    await supabase
      .from("stock_revendedor")
      .update({ estado: "Vendido" })
      .eq("id_registro", registro.id_registro);

    // 2. Registramos el movimiento (Salida porque se vendió)
    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: registro.id_producto,
      tipo_movimiento: "SALIDA",
      cantidad: registro.cantidad,
      motivo: "Venta concretada por revendedor/camioneta",
    });

    return true;
  } catch (error) {
    console.error("Error al procesar venta: ", error);
    return false;
  }
};
