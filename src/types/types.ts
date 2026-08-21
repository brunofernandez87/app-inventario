export interface Producto {
  id_producto: number;
  id_empresa: number;
  codigo_alfanumerico: string;
  codigo_barras?: string;
  nombre_producto: string;
  marca?: string;
  ubicacion?: string;
  costo_compra: number;
  precio_venta: number;
  id_medida: number;
  stock_unidades?: number;
  stock_paquetes?: number;
  unidades_por_paquete?: number;
  bonificacion_paquete?: number;
  stock_minimo?: number;
  alerta_proyeccion?: boolean;
  alerta_stock?: boolean;
  fecha_creacion?: string;
}

export interface Empresa {
  id_empresa: number;
  nombre_empresa: string;
  activo?: boolean | null;
  fecha_creacion?: String | null;
}

export interface Usuario {
  id_usuario: number;
  id_empresa: number;
  nombre_usuario: string;
  rol: enumRol;
  bonificacion?: number | null;
  fecha_creacion?: string | null;
}

enum enumRol {
  Admin = "Admin",
  Socio = "Socio",
  Revendedor = "Revendedor",
  Camioneta = "Camioneta",
}

export interface SesionUsuario {
  usuario: Usuario;
  email: string;
}

export interface Cuenta {
  id_cuenta: number;
  id_usuario: number;
  id_auth: string;
  email: string;
  fecha_creacion?: string | null;
}

export interface StockRevendedor {
  id_registro: number;
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  estado: "En poder" | "Vendido" | "Devuelto";
  fecha_entrega: string;
  producto?: Producto;
}

export interface MovimientoStock {
  id_movimiento?: number;
  id_empresa: number;
  id_producto: number;
  fecha_movimiento?: string;
  tipo_movimiento: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
}
