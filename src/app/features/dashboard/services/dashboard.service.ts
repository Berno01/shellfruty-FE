import { Injectable, inject } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  DashboardFilters,
  DashboardGraphs,
  DashboardKeys,
} from "../models/dashboard.models";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  private apiService = inject(ApiService);

  /**
   * Obtiene los indicadores clave del dashboard (Totales)
   */
  getDashboardKeys(filters: DashboardFilters): Observable<DashboardKeys> {
    let params = new HttpParams()
      .set("fecha_inicio", filters.fecha_inicio)
      .set("fecha_fin", filters.fecha_fin);

    if (filters.id_sucursal !== undefined && filters.id_sucursal !== null) {
      params = params.set("id_sucursal", filters.id_sucursal.toString());
    }

    return this.apiService.get<DashboardKeys>("dashboard/keys", params);
  }

  /**
   * Obtiene los datos para las gráficas del dashboard
   */
  getDashboardGraphs(filters: DashboardFilters): Observable<DashboardGraphs> {
    let params = new HttpParams()
      .set("fecha_inicio", filters.fecha_inicio)
      .set("fecha_fin", filters.fecha_fin);

    if (filters.id_sucursal !== undefined && filters.id_sucursal !== null) {
      params = params.set("id_sucursal", filters.id_sucursal.toString());
    }

    return this.apiService.get<DashboardGraphs>("dashboard/graphs", params);
  }
}
