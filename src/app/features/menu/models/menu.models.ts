export interface Category {
  id_categoria: number;
  nombre_categoria: string;
  estado: boolean;
}

export interface Ingredient {
  id_ingrediente: number;
  nombre_ingrediente: string;
  id_categoria?: number;
  estado?: boolean;
  categoria?: Category;
  url_foto?: string | null;
}

export interface Menu {
  id_menu: number;
  nombre_menu: string;
  precio_menu: number;
  estado: boolean;
  id_categoria_menu?: number; // Added optional to avoid breaking existing strict types if any
  url_foto?: string | null;
}

export interface RuleDetail {
  id_detalle_regla?: number;
  id_regla?: number;
  id_ingrediente: number;
  costo_extra: number;
  estado?: boolean;
  ingrediente?: {
    id_ingrediente: number;
    nombre_ingrediente: string;
  };
}

export interface Rule {
  id_regla: number;
  id_categoria: number;
  id_menu: number;
  cant_gratis: number;
  costo_extra: number;
  combinacion: boolean;
  estado: boolean;
  detalles_activos: RuleDetail[];
}

export interface RuleCreateDto {
  id_categoria: number;
  id_menu: number;
  cant_gratis: number;
  costo_extra: number;
  combinacion: boolean;
  detalles: {
    id_ingrediente: number;
    costo_extra: number;
  }[];
}

export interface CategoryCreateDto {
  nombre_categoria: string;
}

export interface IngredientCreateDto {
  nombre_ingrediente: string;
  id_categoria: number | string;
  url_foto?: string | null;
}

export interface MenuCreateDto {
  nombre_menu: string;
  precio_menu: number;
  id_categoria_menu: number;
  url_foto?: string | null;
}

export interface MenuDetail extends Menu {
  reglas_activas: Rule[];
}
