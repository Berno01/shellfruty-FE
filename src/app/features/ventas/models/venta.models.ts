export interface Venta {
  id_venta: number;
  fecha: string; // ISO 8601 format
  id_sucursal: number;
  monto_efectivo: number;
  monto_qr: number;
  total: number;
  estado: VentaEstado;
  username: string;
}

export type VentaEstado = "PENDIENTE" | "COMPLETADA" | "CANCELADA";

export interface VentaDetalle {
  id_venta: number;
  fecha: string;
  id_sucursal: number;
  monto_efectivo: number;
  monto_qr: number;
  total: number;
  estado: VentaEstado;
  username: string | null;
  created_by: number;
  updated_by: number;
  detalles: DetalleVentaItem[];
}

export interface DetalleVentaItem {
  id_detalle_venta: number;
  id_venta: number;
  id_menu: number;
  nombre_menu: string;
  url_foto?: string | null;
  cantidad: number;
  precio_unitario: number;
  total: number;
  personalizaciones: Personalizacion[];
}

export interface Personalizacion {
  id_detalle_personalizacion: number;
  id_ingrediente: number;
  cantidad: number;
}

export interface IngredienteCatalogo {
  id_ingrediente: number;
  nombre_ingrediente: string;
}

export interface CategoriaIngredientes {
  nombre_categoria: string;
  ingredientes: IngredienteCatalogo[];
}

export interface MenuVenta {
  id_menu: number;
  nombre_menu: string;
  precio_menu: number;
  id_categoria_menu?: number; // Para filtrado frontend
  url_foto?: string | null;
}

export interface VentaQueryParams {
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  id_sucursal?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateVentaDetalle {
  id_menu: number;
  cantidad: number;
  precio: number;
  sub_total: number;
  personalizaciones?: any[]; // Opcional, por defecto []
}

export interface CreateVentaPayload {
  id_usuario: number;
  fecha: string; // YYYY-MM-DD
  id_sucursal: number;
  monto_efectivo: number;
  monto_qr: number;
  total: number;
  estado: string; // "ENTREGADO" o "PENDIENTE"
  detalles: CreateVentaDetalle[];
}
