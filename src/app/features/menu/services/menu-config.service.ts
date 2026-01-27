import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import {
  Category,
  CategoryCreateDto,
  Ingredient,
  IngredientCreateDto,
  Menu,
  MenuCreateDto,
  MenuDetail,
  Rule,
  RuleCreateDto,
} from "../models/menu.models";
import { ApiResponse } from "./menu.service";

@Injectable({
  providedIn: "root",
})
export class MenuConfigService {
  private apiService = inject(ApiService);
  private readonly BASE_URL = "menu";

  // ==========================================
  // CATEGORÍAS
  // ==========================================

  getCategorias(): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<ApiResponse<Category[]>>(
      `${this.BASE_URL}/categoria`,
    );
  }

  createCategoria(data: CategoryCreateDto): Observable<ApiResponse<Category>> {
    return this.apiService.post<ApiResponse<Category>>(
      `${this.BASE_URL}/categoria`,
      data,
    );
  }

  updateCategoria(
    id: number,
    data: CategoryCreateDto,
  ): Observable<ApiResponse<Category>> {
    return this.apiService.put<ApiResponse<Category>>(
      `${this.BASE_URL}/categoria/${id}`,
      data,
    );
  }

  deleteCategoria(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(
      `${this.BASE_URL}/categoria/${id}`,
    );
  }

  // ==========================================
  // INGREDIENTES
  // ==========================================

  createIngrediente(
    data: IngredientCreateDto,
  ): Observable<ApiResponse<Ingredient>> {
    return this.apiService.post<ApiResponse<Ingredient>>(
      `${this.BASE_URL}/ingrediente`,
      data,
    );
  }

  getIngredientesByCategoria(
    idCategoria: number,
  ): Observable<ApiResponse<Ingredient[]>> {
    return this.apiService.get<ApiResponse<Ingredient[]>>(
      `${this.BASE_URL}/ingrediente/${idCategoria}`,
    );
  }

  updateIngrediente(
    id: number,
    data: IngredientCreateDto,
  ): Observable<ApiResponse<Ingredient>> {
    return this.apiService.put<ApiResponse<Ingredient>>(
      `${this.BASE_URL}/ingrediente/${id}`,
      data,
    );
  }

  deleteIngrediente(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(
      `${this.BASE_URL}/ingrediente/${id}`,
    );
  }

  // ==========================================
  // MENÚS
  // ==========================================

  getMenus(): Observable<ApiResponse<Menu[]>> {
    return this.apiService.get<ApiResponse<Menu[]>>(`${this.BASE_URL}`);
  }

  getMenuById(id: number): Observable<ApiResponse<MenuDetail>> {
    return this.apiService.get<ApiResponse<MenuDetail>>(
      `${this.BASE_URL}/${id}`,
    );
  }

  createMenu(data: MenuCreateDto): Observable<ApiResponse<Menu>> {
    return this.apiService.post<ApiResponse<Menu>>(`${this.BASE_URL}`, data);
  }

  updateMenu(id: number, data: MenuCreateDto): Observable<ApiResponse<Menu>> {
    return this.apiService.put<ApiResponse<Menu>>(
      `${this.BASE_URL}/${id}`,
      data,
    );
  }

  deleteMenu(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`${this.BASE_URL}/${id}`);
  }

  // ==========================================
  // REGLAS
  // ==========================================

  createRegla(data: RuleCreateDto): Observable<ApiResponse<Rule>> {
    return this.apiService.post<ApiResponse<Rule>>(
      `${this.BASE_URL}/reglas`,
      data,
    );
  }

  /**
   * Obtiene las reglas filtradas por categoría.
   * NOTA: El endpoint proporcionado solo filtra por categoría.
   * Si se necesita filtrar por menú, se debe hacer en el cliente o ajustar el backend.
   */
  getReglasByCategoria(idCategoria: number): Observable<ApiResponse<Rule[]>> {
    return this.apiService.get<ApiResponse<Rule[]>>(
      `${this.BASE_URL}/reglas/${idCategoria}`,
    );
  }

  /**
   * Obtiene las reglas filtrando por menú y categoría.
   * Realiza la petición por categoría y filtra en memoria el menú específico.
   */
  getReglasByMenuAndCategoria(
    idMenu: number,
    idCategoria: number,
  ): Observable<Rule[]> {
    return this.getReglasByCategoria(idCategoria).pipe(
      map((response: ApiResponse<Rule[]>) => {
        if (!response.success || !response.data) return [];
        return response.data.filter((r: Rule) => r.id_menu === idMenu);
      }),
    );
  }

  updateRegla(id: number, data: RuleCreateDto): Observable<ApiResponse<Rule>> {
    return this.apiService.put<ApiResponse<Rule>>(
      `${this.BASE_URL}/reglas/${id}`,
      data,
    );
  }

  deleteRegla(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(
      `${this.BASE_URL}/reglas/${id}`,
    );
  }
}
