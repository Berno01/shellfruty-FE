import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ApiService } from "../../../core/services/api.service";
import {
  Abastecimiento,
  CreateAbastecimientoPayload,
  ApiResponse,
} from "../models/venta.models";

@Injectable({
  providedIn: "root",
})
export class AbastecimientoService {
  private apiService = inject(ApiService);
  private readonly ENDPOINT = "abastecimiento";

  /**
   * Listado de abastecimientos por fecha y sucursal.
   * GET /api/v1/abastecimiento?fecha=YYYY-MM-DD&id_sucursal=N
   */
  getAbastecimientos(
    fecha: string,
    id_sucursal?: number,
  ): Observable<ApiResponse<Abastecimiento[]>> {
    let params = new HttpParams().set("fecha", fecha);
    if (id_sucursal) params = params.set("id_sucursal", id_sucursal.toString());
    return this.apiService.get<ApiResponse<Abastecimiento[]>>(
      this.ENDPOINT,
      params,
    );
  }

  /**
   * Registrar un nuevo abastecimiento.
   * POST /api/v1/abastecimiento
   */
  createAbastecimiento(
    payload: CreateAbastecimientoPayload,
  ): Observable<ApiResponse<Abastecimiento>> {
    return this.apiService.post<ApiResponse<Abastecimiento>>(
      this.ENDPOINT,
      payload,
    );
  }
}
