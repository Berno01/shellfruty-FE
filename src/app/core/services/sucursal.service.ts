import { Injectable, inject } from "@angular/core";
import { ApiService } from "./api.service";
import { Observable, of, tap } from "rxjs";

export interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface SucursalResponse {
  success: boolean;
  data: Sucursal[];
}

@Injectable({
  providedIn: "root",
})
export class SucursalService {
  private apiService = inject(ApiService);
  private readonly STORAGE_KEY = "shellfruty_sucursales";
  private sucursalesMap: Map<number, string> = new Map();

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Carga las sucursales desde localStorage al inicializar el servicio
   */
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const sucursales: Sucursal[] = JSON.parse(stored);
        this.buildMap(sucursales);
      } catch (e) {
        console.error("Error parsing stored sucursales", e);
      }
    }
  }

  /**
   * Construye el mapa de id -> nombre desde el array
   */
  private buildMap(sucursales: Sucursal[]): void {
    this.sucursalesMap.clear();
    sucursales.forEach((s) => {
      this.sucursalesMap.set(s.id_sucursal, s.nombre_sucursal);
    });
  }

  /**
   * Carga las sucursales desde la API y las guarda en localStorage
   */
  loadSucursales(): Observable<SucursalResponse> {
    return this.apiService.get<SucursalResponse>("sucursal").pipe(
      tap((response) => {
        if (response.success && response.data) {
          // Guardar en localStorage
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.data));
          // Actualizar el mapa
          this.buildMap(response.data);
        }
      }),
    );
  }

  /**
   * Obtiene el nombre de una sucursal por su ID
   */
  getNombreSucursal(id: number): string {
    return this.sucursalesMap.get(id) || `Sucursal #${id}`;
  }

  /**
   * Obtiene todas las sucursales del cache
   */
  getSucursales(): Sucursal[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * Verifica si hay sucursales en cache
   */
  hasCachedSucursales(): boolean {
    return this.sucursalesMap.size > 0;
  }
}
