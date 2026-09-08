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

export const obtenerResumenMensual = async (
  id_empresa: number,
  fechaInicioRango?: string,
  fechaFinRango?: string,
) => {
  try {
    let query = supabase
      .from("venta")
      .select(
        `
        total,
        estado,
        detalle_venta (
          cantidad,
          producto ( costo_compra )
        )
      `,
      )
      .eq("id_empresa", id_empresa)
      .neq("estado", "Cancelado");

    if (fechaInicioRango && fechaFinRango) {
      query = query
        .gte("fecha_venta", `${fechaInicioRango}T00:00:00`)
        .lte("fecha_venta", `${fechaFinRango}T23:59:59`);
    } else {
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
      query = query.gte("fecha_venta", primerDia).lte("fecha_venta", ultimoDia);
    }

    const { data, error } = await query;
    if (error) throw error;

    let transacciones = data?.length || 0;
    let unidadesVendidas = 0;
    let ingresosTotales = 0;
    let costosTotales = 0;

    data?.forEach((venta: any) => {
      ingresosTotales += Number(venta.total) || 0;
      venta.detalle_venta?.forEach((det: any) => {
        const cant = Number(det.cantidad) || 0;
        const costo = Number(det.producto?.costo_compra) || 0;
        unidadesVendidas += cant;
        costosTotales += cant * costo;
      });
    });

    const gananciaNeta = ingresosTotales - costosTotales;

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

    const labels: string[] = [];
    const ganancias = Array(12).fill(0);
    const transacciones = Array(12).fill(0);
    const ventasPorMes: Record<number, any[]> = {};

    const fechaInicio = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() - 11,
      1,
    );
    fechaInicio.setHours(0, 0, 0, 0);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() - i,
        1,
      );
      labels.push(mesesNombres[d.getMonth()]);
      ventasPorMes[11 - i] = [];
    }

    const { data, error } = await supabase
      .from("venta")
      .select(
        `id_venta, numero_ticket, total, fecha_venta, cliente, estado, usuario(nombre_usuario)`,
      )
      .eq("id_empresa", id_empresa)
      .neq("estado", "Cancelado")
      .gte("fecha_venta", fechaInicio.toISOString());

    if (error) throw error;

    data?.forEach((v: any) => {
      const fechaMov = new Date(v.fecha_venta);
      const diffMeses =
        (fechaActual.getFullYear() - fechaMov.getFullYear()) * 12 +
        (fechaActual.getMonth() - fechaMov.getMonth());

      if (diffMeses >= 0 && diffMeses < 12) {
        const arrayIndex = 11 - diffMeses;
        ganancias[arrayIndex] += Number(v.total) || 0;
        transacciones[arrayIndex] += 1;
        ventasPorMes[arrayIndex].push(v);
      }
    });

    for (let i = 0; i < 12; i++) {
      ventasPorMes[i].sort(
        (a, b) =>
          new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime(),
      );
    }

    return { labels, ganancias, transacciones, ventasPorMes };
  } catch (error) {
    console.error("Error al obtener historial gráficos:", error);
    return {
      labels: Array(12).fill("-"),
      ganancias: Array(12).fill(0),
      transacciones: Array(12).fill(0),
      ventasPorMes: {},
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

        // 1 mes o menos es critico entre 1 y 3 meses es ok y mas de 3 es superavit
        if (meses <= 1 || prod.alerta_proyeccion) {
          estado = "Crítico";
        } else if (meses <= 3) {
          estado = "OK";
        } else {
          estado = "Superávit";
        }
      }

      if (estado !== "Sin historial") {
        proyecciones.push({
          id: prod.id_producto,
          nombre: prod.nombre_producto,
          codigo: prod.codigo_alfanumerico || "S/C",
          stock: stock,
          prom:
            promMensual > 0 ? `~${Math.round(promMensual)}/mes` : "Sin ventas",
          meses: mesesRestantes,
          estado: estado,
        });
      }

      const costo = Number(prod.costo_compra) || 0;
      const precio = Number(prod.precio_venta) || 0;
      const ganancia = precio - costo;
      const margen = costo > 0 ? Math.round((ganancia / costo) * 100) : 100;

      let colorMargen = "ok";
      if (margen < 15) {
        colorMargen = "bajo";
      } else if (margen >= 15 && margen <= 30) {
        colorMargen = "medio";
      }

      const valCosto = stock * costo;
      const valPrecio = stock * precio;

      totalCosto += valCosto;
      totalPrecio += valPrecio;

      rentabilidad.push({
        id: prod.id_producto,
        nombre: prod.nombre_producto,
        codigoMarca: prod.codigo_alfanumerico || "S/C",
        costo: costo,
        precio: precio,
        ganancia: ganancia,
        margen: `${margen}%`,
        colorMargen: colorMargen,
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
