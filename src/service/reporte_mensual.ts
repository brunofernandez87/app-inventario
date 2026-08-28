import { Producto, StockRevendedor, Usuario } from "@/types/types";
import { supabase } from "../database/supabase";

export const obtenerVentasRevendedores = async (id_empresa: number) => {
  try {
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .eq("id_empresa", id_empresa)
      .in("rol", ["Revendedor", "Camioneta"]);

    if (errUsuarios) throw errUsuarios;

    const { data: stockVendido, error: errStock } = await supabase
      .from("stock_revendedor")
      .select(
        `*, producto:id_producto ( nombre_producto, precio_venta, codigo_barras )`,
      )
      .eq("estado", "Vendido");

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
      .from("producto")
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

export const obtenerResumenMensual = async (id_empresa: number) => {
  try {
    const fecha = new Date();
    const primerDia = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1,
    ).toISOString();
    const ultimoDia = new Date(
      fecha.getFullYear(),
      fecha.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();

    const { data, error } = await supabase
      .from("movimiento_stock")
      .select(`cantidad, producto:id_producto ( precio_venta )`)
      .eq("id_empresa", id_empresa)
      .eq("tipo_movimiento", "SALIDA")
      .ilike("motivo", "%Venta%")
      .gte("fecha_movimiento", primerDia)
      .lte("fecha_movimiento", ultimoDia);

    if (error) throw error;

    let transacciones = data?.length || 0;
    let unidadesVendidas = 0;
    let ingresosTotales = 0;

    data?.forEach((mov: any) => {
      const cant = mov.cantidad || 0;
      const precioVenta = mov.producto?.precio_venta || 0;
      unidadesVendidas += cant;
      ingresosTotales += cant * precioVenta;
    });

    const costosTotales = 0;
    const gananciaNeta = ingresosTotales;

    return { transacciones, unidadesVendidas, costosTotales, gananciaNeta };
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
    return {
      transacciones: 0,
      unidadesVendidas: 0,
      costosTotales: 0,
      gananciaNeta: 0,
    };
  }
};

export const obtenerHistorialGraficos = async (id_empresa: number) => {
  try {
    const mesesNombres = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const fechaActual = new Date();

    const labels = [];
    const ganancias = [0, 0, 0, 0, 0, 0];
    const transacciones = [0, 0, 0, 0, 0, 0];
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 5);
    fechaInicio.setDate(1);
    fechaInicio.setHours(0, 0, 0, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(mesesNombres[d.getMonth()]);
    }

    const { data, error } = await supabase
      .from("movimiento_stock")
      .select(
        `cantidad, fecha_movimiento, producto:id_producto ( precio_venta )`,
      )
      .eq("id_empresa", id_empresa)
      .eq("tipo_movimiento", "SALIDA")
      .ilike("motivo", "%Venta%")
      .gte("fecha_movimiento", fechaInicio.toISOString());

    if (error) throw error;

    data?.forEach((mov: any) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const diffMeses =
        (fechaActual.getFullYear() - fechaMov.getFullYear()) * 12 +
        (fechaActual.getMonth() - fechaMov.getMonth());

      if (diffMeses >= 0 && diffMeses < 6) {
        const arrayIndex = 5 - diffMeses;
        const cant = mov.cantidad || 0;
        const precioVenta = mov.producto?.precio_venta || 0;

        ganancias[arrayIndex] += cant * precioVenta;
        transacciones[arrayIndex] += 1;
      }
    });

    return { labels, ganancias, transacciones };
  } catch (error) {
    console.error("Error al obtener historial gráficos:", error);
    return {
      labels: ["-", "-", "-", "-", "-", "-"],
      ganancias: [0, 0, 0, 0, 0, 0],
      transacciones: [0, 0, 0, 0, 0, 0],
    };
  }
};

export const obtenerProyeccionesYRentabilidad = async (id_empresa: number) => {
  try {
    const { data: productosView, error: errProd } = await supabase
      .from("vista_productos_con_proyeccion")
      .select("*")
      .eq("id_empresa", id_empresa);

    if (errProd) throw errProd;
    const proyecciones: any[] = [];
    const rentabilidad: any[] = [];
    let totalCosto = 0;
    let totalPrecio = 0;

    productosView?.forEach((prod) => {
      const stock = Number(prod.stock_unidades) || 0;
      const promMensual = Number(prod.ventas_promedio_mensual) || 0;

      let mesesRestantes = "-";
      let estado = "Sin historial";

      if (promMensual > 0) {
        const meses = Math.round(stock / promMensual);
        mesesRestantes = `${meses} meses`;
        estado = prod.alerta_proyeccion ? "Bajo" : "OK";
      }

      proyecciones.push({
        id: prod.id_producto,
        nombre: prod.nombre_producto,
        codigo: prod.codigo_barras || prod.codigo_alfanumerico || "S/C",
        stock: stock,
        prom:
          promMensual > 0 ? `~${Math.round(promMensual)}/mes` : "Sin ventas",
        meses: mesesRestantes,
        estado: estado,
      });

      const costo = Number(prod.costo_compra) || 0;
      const precio = Number(prod.precio_venta) || 0;
      const ganancia = precio - costo;
      const margen = costo > 0 ? Math.round((ganancia / costo) * 100) : 100;

      const valCosto = stock * costo;
      const valPrecio = stock * precio;

      totalCosto += valCosto;
      totalPrecio += valPrecio;

      rentabilidad.push({
        id: prod.id_producto,
        nombre: prod.nombre_producto,
        codigoMarca: prod.codigo_barras || prod.codigo_alfanumerico || "S/C",
        costo: costo,
        precio: precio,
        ganancia: ganancia,
        margen: `${margen}%`,
        stock: stock,
        valCosto: valCosto,
      });
    });

    const gananciaPotencial = totalPrecio - totalCosto;

    return {
      proyecciones,
      rentabilidad,
      resumenRentabilidad: { totalCosto, totalPrecio, gananciaPotencial },
    };
  } catch (error) {
    console.error("Error al obtener datos extra:", error);
    return {
      proyecciones: [],
      rentabilidad: [],
      resumenRentabilidad: {
        totalCosto: 0,
        totalPrecio: 0,
        gananciaPotencial: 0,
      },
    };
  }
};
