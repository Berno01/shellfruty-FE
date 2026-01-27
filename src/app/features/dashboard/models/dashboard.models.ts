export interface DashboardKeys {
  monto_efectivo_total: number;
  monto_qr_total: number;
  total_general: number;
  cantidad_total_items: string; // The API returns string "8" in example
  total_ventas_enviado: number;
}

export interface IngredienteCantidad {
  nombre_ingrediente: string;
  cantidad: number;
}

export interface IngredientesPorCategoria {
  id_categoria: number;
  nombre_categoria: string;
  ingredientes: IngredienteCantidad[];
}

export interface MenuMasVendido {
  nombre_menu: string;
  cantidad: string; // API returns "11"
}

export interface HoraConcurrida {
  hora: number;
  cantidad: number;
}

export interface DashboardGraphs {
  ingredientes_por_categoria: IngredientesPorCategoria[];
  menus_mas_vendidos: MenuMasVendido[];
  horas_concurridas: HoraConcurrida[];
}

export interface DashboardFilters {
  fecha_inicio: string;
  fecha_fin: string;
  id_sucursal?: number;
}
