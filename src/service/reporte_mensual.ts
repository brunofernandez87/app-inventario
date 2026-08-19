import { Producto, StockRevendedor, Usuario } from "@/types/types";
import { supabase } from "../database/supabase";

export const obtenerVentasRevendedores = async (id_empresa: number) => {
  try {
    // Traemos usuarios Revendedor/Camioneta
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_empresa", id_empresa)
      .in("rol", ["Revendedor", "Camioneta"]);

    if (errUsuarios) throw errUsuarios;

    // Traemos SOLO lo vendido
    const { data: stockVendido, error: errStock } = await supabase
      .from("stock_revendedor")
      .select(
        `
        *,
        producto:id_producto ( nombre_producto, precio_venta, codigo_barras )
      `,
      )
      .eq("estado", "Vendido"); // FILTRO ESTRICTO: Solo lo vendido

    if (errStock) throw errStock;

    return {
      usuarios: (usuarios || []) as Usuario[],
      ventas: (stockVendido || []) as StockRevendedor[],
    };
  } catch (error) {
    console.error("Error al obtener ventas de revendedores: ", error);
    return { usuarios: [], ventas: [] };
  }
};

export const obtenerListaPrecios = async (id_empresa: number) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("nombre_producto", { ascending: true });

    if (error) throw error;
    return (data || []) as Producto[];
  } catch (error) {
    console.error("Error al obtener lista de precios: ", error);
    return [];
  }
};
