export interface Producto {
  id_producto: number;
  id_empresa: number;
  codigo_barras?: string;
  nombre_producto: string;
  marca?: string;
  ubicacion?: string;
  costo_compra?: number;
  precio_venta?: number;
  id_tipo_venta?: number;
  stock_unidades: number;
  stock_paquetes: number;
  unidades_por_paquete: number;
  bonificacion_paquete: number;
  stock_minimo: number;
  alerta_proyeccion: boolean;
  fecha_creacion: String;
}
