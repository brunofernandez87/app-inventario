import { StockRevendedor, Usuario } from "@/types/types";
import { supabase } from "../database/supabase";
import { crearMovimientoStock } from "./movimiento_stock";
import { editarProducto, obtenerProducto } from "./producto";

export const obtenerRevendedoresYStock = async (id_empresa: number) => {
  try {
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_empresa", id_empresa);

    if (errUsuarios) throw errUsuarios;

    // MAGIA 1: Le pedimos a Supabase que traiga el id_producto también adentro de producto
    const { data: stock, error: errStock } = await supabase
      .from("stock_revendedor")
      .select(
        `
        *,
        id_producto,
        producto:id_producto ( id_producto, nombre_producto, precio_venta, codigo_barras )
      `,
      );

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
    // MAGIA 2: Rescate de IDs por si Supabase nos los mandó vacíos
    const idRegistro = registro.id_registro;
    const idProducto =
      registro.id_producto || (registro as any).producto?.id_producto;

    if (!idRegistro || !idProducto) {
      console.error("Faltan IDs críticos para devolver", {
        idRegistro,
        idProducto,
      });
      return false;
    }

    const cantidad_restante = registro.cantidad - cantidad_devuelta;

    // 1. Actualizar el registro de stock_revendedor
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

    // 2. Devolver la mercadería al stock central
    const productoActual = await obtenerProducto(idProducto, id_empresa);

    if (productoActual && productoActual.stock_unidades !== undefined) {
      await editarProducto(
        {
          id_producto: idProducto,
          stock_unidades: productoActual.stock_unidades + cantidad_devuelta,
        },
        id_empresa,
      );
    }

    // 3. Registrar el movimiento
    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: idProducto,
      tipo_movimiento: "ENTRADA",
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
    // MAGIA 2: Rescate de IDs para la venta
    const idRegistro = registro.id_registro;
    const idProducto =
      registro.id_producto || (registro as any).producto?.id_producto;

    if (!idRegistro || !idProducto) {
      console.error("Faltan IDs críticos para la venta", {
        idRegistro,
        idProducto,
      });
      return false;
    }

    await supabase
      .from("stock_revendedor")
      .update({ estado: "Vendido" })
      .eq("id_registro", idRegistro);

    await crearMovimientoStock({
      id_empresa: id_empresa,
      id_producto: idProducto, // Usamos el ID blindado acá
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

export const crearNuevoRevendedor = async (
  nombre_usuario: string,
  rol: "Revendedor" | "Socio" | "Camioneta",
  bonificacion: number,
  id_empresa: number,
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("usuario").insert({
      id_empresa: id_empresa,
      nombre_usuario: nombre_usuario,
      rol: rol,
      bonificacion: bonificacion > 0 ? bonificacion : null,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al crear el nuevo revendedor: ", error);
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
  estado: "En poder" | "Vendido" | "Devuelto",
  id_empresa: number,
): Promise<boolean> => {
  try {
    // 1. Guardamos el registro en la tabla del revendedor
    const { error: errInsert } = await supabase
      .from("stock_revendedor")
      .insert({
        id_usuario,
        id_producto,
        cantidad,
        estado,
      });

    if (errInsert) throw errInsert;

    // 2. Lógica de inventario
    if (estado === "En poder" || estado === "Vendido") {
      const productoActual = await obtenerProducto(id_producto, id_empresa);
      if (productoActual && productoActual.stock_unidades !== undefined) {
        await editarProducto(
          {
            id_producto: id_producto,
            stock_unidades: productoActual.stock_unidades - cantidad,
          },
          id_empresa,
        );

        await crearMovimientoStock({
          id_empresa,
          id_producto,
          tipo_movimiento: "SALIDA",
          cantidad,
          motivo: `Asignación a revendedor (${estado})`,
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error al asignar stock: ", error);
    return false;
  }
};
