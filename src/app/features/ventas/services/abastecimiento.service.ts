import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ApiService } from "../../../core/services/api.service";
import {
  Abastecimiento,
  CreateAbastecimientoPayload,
  SaldoItem,
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
   * Saldo de abastecimiento: total vendido y saldo restante por menú.
   * GET /api/v1/abastecimiento/saldo?fecha=YYYY-MM-DD&id_sucursal=N
   */
  getSaldo(
    fecha: string,
    id_sucursal: number,
  ): Observable<ApiResponse<SaldoItem[]>> {
    const params = new HttpParams()
      .set("fecha", fecha)
      .set("id_sucursal", id_sucursal.toString());
    return this.apiService.get<ApiResponse<SaldoItem[]>>(
      `${this.ENDPOINT}/saldo`,
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
