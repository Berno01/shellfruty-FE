import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../../../core/services/api.service";

export interface MenuBackendDto {
  id_menu: number;
  nombre_menu: string;
  precio_menu: number;
  estado: boolean;
  id_categoria_menu: number;
  nombre_categoria_menu?: string;
  url_foto?: string | null;
}

export interface CategoriaMenu {
  id_categoria_menu: number;
  nombre_categoria_menu: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: "root",
})
export class MenuService {
  private apiService = inject(ApiService);
  private readonly ENDPOINT = "menu";

  getAll(): Observable<ApiResponse<MenuBackendDto[]>> {
    return this.apiService.get<ApiResponse<MenuBackendDto[]>>(this.ENDPOINT);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`${this.ENDPOINT}/${id}`);
  }

  activate(id: number): Observable<ApiResponse<any>> {
    return this.apiService.patch<ApiResponse<any>>(
      `${this.ENDPOINT}/${id}/activar`,
      {},
    );
  }

  // --- Categoria Menu Methods ---

  getCategoriesMenu(): Observable<ApiResponse<CategoriaMenu[]>> {
    return this.apiService.get<ApiResponse<CategoriaMenu[]>>(
      `${this.ENDPOINT}/categoria-menu`,
    );
  }

  createCategoryMenu(nombre: string): Observable<ApiResponse<CategoriaMenu>> {
    return this.apiService.post<ApiResponse<CategoriaMenu>>(
      `${this.ENDPOINT}/categoria-menu`,
      {
        nombre_categoria_menu: nombre,
      },
    );
  }

  updateCategoryMenu(
    id: number,
    nombre: string,
  ): Observable<ApiResponse<CategoriaMenu>> {
    return this.apiService.put<ApiResponse<CategoriaMenu>>(
      `${this.ENDPOINT}/categoria-menu/${id}`,
      {
        nombre_categoria_menu: nombre,
      },
    );
  }
}
