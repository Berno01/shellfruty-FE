import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import {
  Venta,
  VentaDetalle,
  VentaQueryParams,
  ApiResponse,
  MenuVenta,
  CreateVentaPayload,
} from "../models/venta.models";
import { CategoriaMenu } from "../../menu/services/menu.service";
import { getTodayBolivia } from "../../../core/utils/date.utils";

@Injectable({
  providedIn: "root",
})
export class VentaService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private readonly ENDPOINT = "venta";

  /**
   * Obtiene lista de ventas con filtros
   * Por defecto filtra por fecha de hoy en Bolivia
   * Si es admin, no filtra por sucursal
   * Si es vendedor, filtra por su sucursal
   */
  getVentas(
    params?: Partial<VentaQueryParams>,
  ): Observable<ApiResponse<Venta[]>> {
    const today = getTodayBolivia();

    let httpParams = new HttpParams()
      .set("fecha_inicio", params?.fecha_inicio || today)
      .set("fecha_fin", params?.fecha_fin || today);

    // Filtrar por sucursal solo si NO es admin
    const user = this.authService.currentUser;
    const isAdmin = user?.nombre_rol?.toLowerCase().includes("admin") || false;

    if (!isAdmin && user?.id_sucursal) {
      // Si no es admin, aplicar filtro de sucursal
      const sucursalId = params?.id_sucursal || user.id_sucursal;
      httpParams = httpParams.set("id_sucursal", sucursalId.toString());
    } else if (params?.id_sucursal) {
      // Si es admin pero se pasó explícitamente una sucursal
      httpParams = httpParams.set("id_sucursal", params.id_sucursal.toString());
    }

    return this.apiService.get<ApiResponse<Venta[]>>(
      `${this.ENDPOINT}`,
      httpParams,
    );
  }

  /**
   * Obtiene el detalle completo de una venta
   */
  getVentaDetalle(id: number): Observable<ApiResponse<VentaDetalle>> {
    return this.apiService.get<ApiResponse<VentaDetalle>>(
      `${this.ENDPOINT}/${id}`,
    );
  }

  /**
   * Elimina (desactiva) una venta
   */
  deleteVenta(id: number): Observable<ApiResponse<any>> {
    const user = this.authService.currentUser;
    const body = {
      id_usuario: user?.id_usuario || 1,
    };
    return this.apiService.delete<ApiResponse<any>>(
      `${this.ENDPOINT}/${id}`,
      body,
    );
  }

  /**
   * Cambia el estado de una venta de PENDIENTE a ENVIADO
   */
  enviarVenta(id: number): Observable<ApiResponse<any>> {
    const user = this.authService.currentUser;
    const body = {
      id_usuario: user?.id_usuario || 1,
    };
    return this.apiService.patch<ApiResponse<any>>(
      `${this.ENDPOINT}/${id}/enviar`,
      body,
    );
  }

  /**
   * Crea una nueva venta
   */
  createVenta(
    payload: CreateVentaPayload,
  ): Observable<ApiResponse<VentaDetalle>> {
    return this.apiService.post<ApiResponse<VentaDetalle>>(
      this.ENDPOINT,
      payload,
    );
  }

  /**
   * Actualiza una venta existente
   */
  updateVenta(
    id: number,
    payload: CreateVentaPayload,
  ): Observable<ApiResponse<VentaDetalle>> {
    return this.apiService.put<ApiResponse<VentaDetalle>>(
      `${this.ENDPOINT}/${id}`,
      payload,
    );
  }

  /**
   * Obtiene el catálogo de ingredientes agrupados por categoría
   * Se almacena en localStorage para consultas rápidas
   */
  getIngredientes(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(
      `${this.ENDPOINT}/ingredientes`,
    );
  }

  /**
   * Carga ingredientes desde localStorage o API
   */
  loadIngredientesCache(): void {
    const cached = localStorage.getItem("shellfruty_ingredientes");
    if (!cached) {
      this.getIngredientes().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Sanitizar URLs al guardar en cache
            const sanitizedData = response.data.map((cat: any) => ({
              ...cat,
              ingredientes:
                cat.ingredientes?.map((ing: any) => ({
                  ...ing,
                  url_foto: this.sanitizeImageUrl(ing.url_foto),
                })) || [],
            }));
            localStorage.setItem(
              "shellfruty_ingredientes",
              JSON.stringify(sanitizedData),
            );
          }
        },
        error: (err) => console.error("Error cargando ingredientes", err),
      });
    }
  }

  /**
   * Obtiene el nombre de un ingrediente desde el cache
   */
  getIngredienteNombre(id: number): string {
    const cached = localStorage.getItem("shellfruty_ingredientes");
    if (!cached) return `Ingrediente #${id}`;

    try {
      const categorias = JSON.parse(cached);
      for (const cat of categorias) {
        const found = cat.ingredientes?.find(
          (ing: any) => ing.id_ingrediente === id,
        );
        if (found) return found.nombre_ingrediente;
      }
    } catch (e) {
      console.error("Error parseando cache de ingredientes", e);
    }

    return `Ingrediente #${id}`;
  }

  /**
   * Obtiene ingredientes agrupados por categoría desde el cache
   */
  getIngredientesPorCategoria(idsIngredientes: number[]): any[] {
    const cached = localStorage.getItem("shellfruty_ingredientes");
    if (!cached) return [];

    try {
      const categorias = JSON.parse(cached);
      const result: any[] = [];

      for (const cat of categorias) {
        const ingredientesFiltrados =
          cat.ingredientes?.filter((ing: any) =>
            idsIngredientes.includes(ing.id_ingrediente),
          ) || [];

        if (ingredientesFiltrados.length > 0) {
          result.push({
            nombre_categoria: cat.nombre_categoria,
            ingredientes: ingredientesFiltrados,
          });
        }
      }

      return result;
    } catch (e) {
      console.error("Error parseando cache de ingredientes", e);
      return [];
    }
  }

  private sanitizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/\\/g, "");
  }

  private readonly MENUS_CACHE_KEY = "shellfruty_menus_venta";
  private readonly CATEGORIAS_CACHE_KEY = "shellfruty_categorias_venta";

  /**
   * Carga menús y categorías para la venta y los guarda en localStorage
   */
  loadMenusAndCategories(): void {
    // Cargar Menus desde venta/menus/
    this.apiService.get<ApiResponse<MenuVenta[]>>("venta/menus").subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log("Menús recibidos de la API:", response.data);
          // Sanitizar URLs de imágenes al cachear
          const sanitizedMenus = response.data.map((menu) => ({
            ...menu,
            url_foto: this.sanitizeImageUrl(menu.url_foto),
          }));
          localStorage.setItem(
            this.MENUS_CACHE_KEY,
            JSON.stringify(sanitizedMenus),
          );
        }
      },
      error: (err) => console.error("Error cargando menús para venta", err),
    });

    // Cargar Categorías desde menu/categoria-menu
    this.apiService
      .get<ApiResponse<CategoriaMenu[]>>("menu/categoria-menu")
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            console.log("Categorías recibidas de la API:", response.data);
            localStorage.setItem(
              this.CATEGORIAS_CACHE_KEY,
              JSON.stringify(response.data),
            );
          }
        },
        error: (err) =>
          console.error("Error cargando categorías para venta", err),
      });
  }

  getCachedMenus(): MenuVenta[] {
    const cached = localStorage.getItem(this.MENUS_CACHE_KEY);
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }

  getCachedCategories(): CategoriaMenu[] {
    const cached = localStorage.getItem(this.CATEGORIAS_CACHE_KEY);
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.authService.currentUser;
    return user?.nombre_rol?.toLowerCase().includes("admin") || false;
  }
}



