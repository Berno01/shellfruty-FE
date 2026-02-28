import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { VentasSocketService } from "../../core/services/ventas-socket.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { VentaService } from "./services/venta.service";
import { AbastecimientoService } from "./services/abastecimiento.service";
import { AuthService } from "../../core/services/auth.service";
import {
  SucursalService,
  Sucursal,
} from "../../core/services/sucursal.service";
import {
  Venta,
  VentaEstado,
  VentaDetalle,
  DetalleVentaItem,
  MenuVenta,
  Abastecimiento,
  SaldoItem,
} from "./models/venta.models";
import {
  getTodayBolivia,
  formatDateToYYYYMMDD,
} from "../../core/utils/date.utils";

@Component({
  selector: "app-ventas",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#fdf7f8] pb-12">
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div
          class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
        >
          <div class="flex flex-col gap-1">
            <h2 class="text-3xl font-extrabold text-black">Ventas Diarias</h2>
            <p class="text-slate-600 text-base font-medium">
              Resumen de transacciones del día
            </p>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <!-- Sucursal Filter -->
            <div
              *ngIf="isAdmin()"
              class="relative group min-w-[170px] flex-1 md:flex-none"
            >
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <select
                [(ngModel)]="selectedSucursal"
                (change)="onFilterChange()"
                [disabled]="!isAdmin()"
                class="form-select w-full pl-10 pr-8 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:border-[#eaa6b6] focus:ring-[#eaa6b6] shadow-sm text-black cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option [ngValue]="null">Todas las Sucursales</option>
                <option
                  *ngFor="let sucursal of sucursales()"
                  [ngValue]="sucursal.id_sucursal"
                >
                  {{ sucursal.nombre_sucursal }}
                </option>
              </select>
            </div>

            <!-- Date Filter -->
            <div class="relative group min-w-[170px] flex-1 md:flex-none">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="date"
                [(ngModel)]="fechaInicio"
                (change)="onFilterChange()"
                [placeholder]="isRangeMode() ? 'Fecha Inicio' : 'Fecha'"
                class="form-input w-full pl-10 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:border-[#eaa6b6] focus:ring-[#eaa6b6] shadow-sm text-black cursor-pointer"
              />
            </div>

            <!-- Second date (only in range mode) -->
            <div
              *ngIf="isRangeMode()"
              class="relative group min-w-[170px] flex-1 md:flex-none"
            >
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="date"
                [(ngModel)]="fechaFin"
                (change)="onFilterChange()"
                placeholder="Fecha Fin"
                class="form-input w-full pl-10 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:border-[#eaa6b6] focus:ring-[#eaa6b6] shadow-sm text-black cursor-pointer"
              />
            </div>

            <!-- Toggle Range Button -->
            <button
              (click)="toggleRangeMode()"
              [class.bg-[#eaa6b6]]="isRangeMode()"
              [class.bg-slate-200]="!isRangeMode()"
              [class.text-black]="isRangeMode()"
              [class.text-slate-700]="!isRangeMode()"
              class="hover:opacity-80 font-bold py-3 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
              [title]="
                isRangeMode() ? 'Modo fecha única' : 'Modo rango de fechas'
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span *ngIf="isRangeMode()">Rango</span>
            </button>

            <!-- Abastecimiento Vasos Button -->
            <button
              (click)="openAbastecimientoModal()"
              [disabled]="currentSucursalId() === 0"
              class="bg-white border border-slate-300 hover:border-[#eaa6b6] hover:bg-pink-50 text-slate-700 font-bold py-3 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              [title]="
                currentSucursalId() === 0
                  ? 'Selecciona una sucursal primero'
                  : 'Registrar abastecimiento de productos'
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-[#eaa6b6]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <!-- Cuerpo del vaso (tazón) -->
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M6 4h12l-2 15H8L6 4z"
                />
                <!-- Tapa / línea superior -->
                <line
                  x1="5"
                  y1="4"
                  x2="19"
                  y2="4"
                  stroke-linecap="round"
                  stroke-width="1.5"
                />
                <!-- Pitillo / straw -->
                <line
                  x1="13.5"
                  y1="1"
                  x2="13.5"
                  y2="9"
                  stroke-linecap="round"
                  stroke-width="1.5"
                />
                <!-- Burbujas (bubble tea) -->
                <circle
                  cx="9.5"
                  cy="12"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="12"
                  cy="14.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="14.5"
                  cy="12"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              Vasos
            </button>

            <!-- Saldo de Ventas Button -->
            <button
              (click)="openSaldoModal()"
              [disabled]="currentSucursalId() === 0"
              class="bg-white border border-slate-300 hover:border-[#eaa6b6] hover:bg-pink-50 text-slate-700 font-bold py-3 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              [title]="
                currentSucursalId() === 0
                  ? 'Selecciona una sucursal primero'
                  : 'Ver saldo de ventas del d\u00eda'
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-[#eaa6b6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Saldo
            </button>

            <!-- Nueva Venta Button -->
            <button
              routerLink="/ventas/nueva"
              class="bg-[#eaa6b6] hover:bg-[#d68a9a] text-black font-extrabold py-3 px-6 rounded-lg shadow-md shadow-pink-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 flex-1 md:flex-none text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Nueva Venta</span>
            </button>
          </div>
        </div>

        <!-- Desktop View (Table) -->
        <div
          class="hidden lg:flex flex-1 bg-white rounded-xl shadow-md border border-slate-200 flex-col overflow-hidden"
        >
          <!-- Table -->
          <div class="flex-1 overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-100">
                  <th
                    class="py-5 px-4 text-sm font-bold uppercase tracking-wider text-black whitespace-nowrap w-16 text-center"
                  >
                    #
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black whitespace-nowrap"
                  >
                    Estado
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black whitespace-nowrap w-32"
                  >
                    Fecha/Hora
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black whitespace-nowrap"
                  >
                    Sucursal
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black whitespace-nowrap"
                  >
                    Usuario
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black text-right w-32"
                  >
                    Efectivo
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black text-right w-32"
                  >
                    QR
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black text-right w-32"
                  >
                    Total
                  </th>
                  <th
                    class="py-5 px-6 text-sm font-bold uppercase tracking-wider text-black text-center w-28"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <!-- Loading State -->
                <tr *ngIf="isLoading()">
                  <td colspan="9" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="h-12 w-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"
                      ></div>
                      <p class="text-lg font-bold text-slate-600">
                        Cargando ventas...
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Data Rows -->
                <ng-container *ngIf="!isLoading()">
                  <tr
                    *ngFor="let venta of ventas()"
                    class="hover:bg-pink-50/50 transition-colors group"
                    [class.opacity-60]="venta.estado === 'CANCELADA'"
                    [class.venta-bot]="ventasBotHighlight().has(venta.id_venta)"
                  >
                    <!-- ID Venta -->
                    <td class="py-4 px-4 text-center">
                      <span
                        class="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-black rounded-md"
                        >#{{ venta.id_venta }}</span
                      >
                    </td>

                    <!-- Estado -->
                    <td class="py-4 px-6">
                      <span
                        [ngClass]="getEstadoBadgeClass(venta.estado)"
                        class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
                      >
                        {{ getEstadoLabel(venta.estado) }}
                      </span>
                    </td>

                    <!-- Fecha/Hora -->
                    <td class="py-4 px-6 text-base text-black font-bold">
                      {{ formatDateTime(venta.fecha) }}
                    </td>

                    <!-- Sucursal -->
                    <td
                      class="py-4 px-6 text-base text-slate-800 font-semibold"
                    >
                      {{ getNombreSucursal(venta.id_sucursal) }}
                    </td>

                    <!-- Usuario -->
                    <td class="py-4 px-6 text-base text-slate-700 font-medium">
                      {{ venta.username }}
                    </td>

                    <!-- Efectivo -->
                    <td
                      class="py-4 px-6 text-base font-bold text-right"
                      [class.text-black]="venta.estado !== 'CANCELADA'"
                      [class.text-slate-400]="venta.estado === 'CANCELADA'"
                      [class.line-through]="venta.estado === 'CANCELADA'"
                    >
                      {{
                        venta.monto_efectivo > 0
                          ? "Bs. " + venta.monto_efectivo.toFixed(2)
                          : "-"
                      }}
                    </td>

                    <!-- QR -->
                    <td
                      class="py-4 px-6 text-base font-bold text-right"
                      [class.text-black]="venta.estado !== 'CANCELADA'"
                      [class.text-slate-400]="venta.estado === 'CANCELADA'"
                      [class.line-through]="venta.estado === 'CANCELADA'"
                    >
                      {{
                        venta.monto_qr > 0
                          ? "Bs. " + venta.monto_qr.toFixed(2)
                          : "-"
                      }}
                    </td>

                    <!-- Total -->
                    <td
                      class="py-4 px-6 text-base font-extrabold text-right"
                      [class.text-black]="venta.estado !== 'CANCELADA'"
                      [class.text-slate-400]="venta.estado === 'CANCELADA'"
                      [class.line-through]="venta.estado === 'CANCELADA'"
                    >
                      Bs. {{ venta.total.toFixed(2) }}
                    </td>

                    <!-- Acciones -->
                    <td class="py-4 px-6 text-center">
                      <div
                        class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <!-- Botón Ver Detalle -->
                        <button
                          (click)="verDetalle(venta)"
                          class="p-1 text-slate-500 hover:text-black transition-colors"
                          title="Ver detalle"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>

                        <!-- Botón Enviar (solo para PENDIENTE) -->
                        <button
                          *ngIf="venta.estado === 'PENDIENTE'"
                          (click)="enviarVenta(venta)"
                          class="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Enviar venta"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>

                        <!-- Botón Editar -->
                        <button
                          [routerLink]="['/ventas/editar', venta.id_venta]"
                          class="p-1 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Editar venta"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <!-- Botón Eliminar -->
                        <button
                          (click)="deleteVenta(venta)"
                          class="p-1 text-slate-500 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-container>

                <!-- Empty State -->
                <tr *ngIf="!isLoading() && ventas().length === 0">
                  <td colspan="8" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div class="bg-slate-100 p-4 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-12 w-12 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p class="text-lg font-bold text-slate-600">
                        No hay ventas para mostrar
                      </p>
                      <p class="text-sm text-slate-500">
                        Intenta cambiar los filtros o crea una nueva venta
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Summary -->
          <div class="bg-[#eaa6b6]/20 border-t border-[#eaa6b6]/30">
            <table class="w-full">
              <tbody>
                <tr>
                  <!-- Columnas vacías para alineación (Estado, Fecha, Sucursal, Usuario) -->
                  <td class="py-5 px-6"></td>
                  <td class="py-5 px-6 w-32"></td>
                  <td class="py-5 px-6"></td>
                  <td class="py-5 px-6"></td>

                  <!-- Total Efectivo (alineado con columna Efectivo) -->
                  <td class="py-5 px-6 text-right w-32">
                    <div class="flex flex-col items-end">
                      <span
                        class="text-xs uppercase tracking-wide text-slate-700 font-bold mb-1"
                      >
                        Total Efectivo
                      </span>
                      <span class="text-xl font-black text-black">
                        Bs. {{ totales().efectivo.toFixed(2) }}
                      </span>
                    </div>
                  </td>

                  <!-- Total QR (alineado con columna QR) -->
                  <td class="py-5 px-6 text-right w-32">
                    <div class="flex flex-col items-end">
                      <span
                        class="text-xs uppercase tracking-wide text-slate-700 font-bold mb-1"
                      >
                        Total QR
                      </span>
                      <span class="text-xl font-black text-black">
                        Bs. {{ totales().qr.toFixed(2) }}
                      </span>
                    </div>
                  </td>

                  <!-- Venta Total (alineado con columna Total) -->
                  <td class="py-5 px-6 text-right w-32">
                    <div class="flex flex-col items-end relative">
                      <div
                        class="absolute -bottom-2 right-0 w-32 h-1.5 bg-[#eaa6b6] rounded-full opacity-60"
                      ></div>
                      <span
                        class="text-xs uppercase tracking-wide text-black font-black mb-1"
                      >
                        Venta Total
                      </span>
                      <span
                        class="text-3xl font-black text-black tracking-tight"
                      >
                        Bs. {{ totales().total.toFixed(2) }}
                      </span>
                    </div>
                  </td>

                  <!-- Columna vacía para Acciones -->
                  <td class="py-5 px-6 w-28"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile View (Cards) -->
        <div class="flex lg:hidden flex-1 flex-col gap-6">
          <!-- Loading State Mobile -->
          <div
            *ngIf="isLoading()"
            class="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100"
          >
            <div class="flex flex-col items-center gap-3">
              <div
                class="h-10 w-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"
              ></div>
              <p class="text-sm font-bold text-slate-500">Cargando ventas...</p>
            </div>
          </div>

          <!-- Cards Grid -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            *ngIf="!isLoading()"
          >
            <div
              *ngFor="let venta of ventas()"
              class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
              [class.opacity-75]="venta.estado === 'CANCELADA'"
              [class.bg-slate-50]="venta.estado === 'CANCELADA'"
              [class.venta-bot]="ventasBotHighlight().has(venta.id_venta)"
            >
              <!-- Card Top: Date & Status -->
              <div class="flex justify-between items-start mb-4">
                <div class="flex flex-col">
                  <span class="text-xs font-black text-[#eaa6b6] mb-1"
                    >#{{ venta.id_venta }}</span
                  >
                  <span
                    class="text-sm font-bold text-slate-800 flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-pink-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {{
                      formatDateTime(venta.fecha).split(",")[0].split(" ")[0]
                    }}
                  </span>
                  <span class="text-xs font-semibold text-slate-400 pl-5">
                    {{
                      formatDateTime(venta.fecha).split(",")[1] ||
                        formatDateTime(venta.fecha).split(" ")[1]
                    }}
                  </span>
                </div>
                <span
                  [ngClass]="getEstadoBadgeClass(venta.estado)"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-current bg-opacity-10 backdrop-blur-sm"
                >
                  {{ getEstadoLabel(venta.estado) }}
                </span>
              </div>

              <!-- Info Body -->
              <div class="flex-1 mb-4">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span
                      class="text-slate-400 font-bold uppercase tracking-wider"
                      >Sucursal</span
                    >
                    <span
                      class="font-bold text-slate-700 truncate max-w-[120px]"
                      title="{{ getNombreSucursal(venta.id_sucursal) }}"
                    >
                      {{ getNombreSucursal(venta.id_sucursal) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span
                      class="text-slate-400 font-bold uppercase tracking-wider"
                      >Atendido por</span
                    >
                    <span
                      class="font-bold text-slate-700 truncate max-w-[120px]"
                    >
                      {{ venta.username }}
                    </span>
                  </div>
                </div>

                <!-- Price Box -->
                <div
                  class="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-pink-50/30 group-hover:border-pink-100 transition-colors"
                >
                  <div class="flex justify-between items-end mb-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase"
                      >Total Venta</span
                    >
                    <span
                      class="text-2xl font-black text-slate-900 leading-none"
                      [class.line-through]="venta.estado === 'CANCELADA'"
                      [class.text-slate-400]="venta.estado === 'CANCELADA'"
                    >
                      {{ venta.total.toFixed(2)
                      }}<span class="text-xs text-slate-500 font-bold ml-0.5"
                        >Bs</span
                      >
                    </span>
                  </div>
                  <div
                    class="flex gap-3 pt-2 border-t border-slate-200/50 mt-2"
                  >
                    <div
                      class="flex flex-col flex-1"
                      *ngIf="venta.monto_efectivo > 0"
                    >
                      <span
                        class="text-[9px] text-slate-400 uppercase font-bold"
                        >Efectivo</span
                      >
                      <span class="text-xs font-bold text-slate-600"
                        >{{ venta.monto_efectivo }} Bs</span
                      >
                    </div>
                    <div
                      class="flex flex-col flex-1 items-end"
                      *ngIf="venta.monto_qr > 0"
                    >
                      <span
                        class="text-[9px] text-slate-400 uppercase font-bold"
                        >QR Transfer</span
                      >
                      <span class="text-xs font-bold text-slate-600"
                        >{{ venta.monto_qr }} Bs</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions Divider -->

              <!-- Actions Footer -->
              <div
                class="flex items-center justify-between pt-3 border-t border-slate-100"
              >
                <button
                  (click)="verDetalle(venta)"
                  class="text-xs font-bold text-slate-500 hover:text-pink-500 flex items-center gap-1 transition-colors px-2 py-1.5 rounded-lg hover:bg-pink-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Ver Detalle
                </button>

                <div class="flex items-center gap-1">
                  <!-- Botón Enviar (solo para PENDIENTE) -->
                  <button
                    *ngIf="venta.estado === 'PENDIENTE'"
                    (click)="enviarVenta(venta)"
                    class="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 rounded-lg"
                    title="Enviar venta"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>

                  <!-- Botón Editar -->
                  <button
                    [routerLink]="['/ventas/editar', venta.id_venta]"
                    class="p-2 text-slate-400 hover:text-amber-600 transition-colors bg-slate-50 hover:bg-amber-50 rounded-lg"
                    title="Editar venta"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  <!-- Botón Eliminar -->
                  <button
                    (click)="deleteVenta(venta)"
                    class="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              *ngIf="ventas().length === 0"
              class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed"
            >
              <div
                class="inline-flex items-center justify-center w-20 h-20 bg-pink-50 rounded-full mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10 text-pink-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-1">
                No hay ventas registradas
              </h3>
              <p class="text-slate-500">
                Ajusta los filtros o crea una nueva venta para comenzar.
              </p>
            </div>
          </div>

          <!-- Modern Summary Footer -->
          <div
            class="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white mt-auto"
          >
            <div
              class="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center"
            >
              <!-- Label -->
              <div
                class="md:col-span-1 text-center md:text-left border-b md:border-b-0 border-slate-800 pb-4 md:pb-0"
              >
                <h3
                  class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1"
                >
                  Resumen de Totales
                </h3>
                <div
                  class="flex items-center justify-center md:justify-start gap-2"
                >
                  <span
                    class="inline-block w-2 h-2 rounded-full bg-green-400"
                  ></span>
                  <span class="text-sm font-semibold text-slate-200"
                    >{{ ventas().length }} Transacciones</span
                  >
                </div>
              </div>

              <!-- Stat Cards -->
              <div class="md:col-span-3 grid grid-cols-3 gap-4">
                <!-- Cash -->
                <div
                  class="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50"
                >
                  <p
                    class="text-[10px] text-slate-400 font-bold uppercase mb-1"
                  >
                    Efectivo Total
                  </p>
                  <p
                    class="text-lg sm:text-2xl font-bold text-green-400 truncate"
                  >
                    Bs {{ totales().efectivo.toFixed(2) }}
                  </p>
                </div>
                <!-- QR -->
                <div
                  class="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50"
                >
                  <p
                    class="text-[10px] text-slate-400 font-bold uppercase mb-1"
                  >
                    QR Total
                  </p>
                  <p
                    class="text-lg sm:text-2xl font-bold text-sky-400 truncate"
                  >
                    Bs {{ totales().qr.toFixed(2) }}
                  </p>
                </div>
                <!-- Total -->
                <div
                  class="bg-pink-600 rounded-xl p-3 border border-pink-500 shadow-lg shadow-pink-900/50 relative overflow-hidden group"
                >
                  <div
                    class="absolute -right-4 -top-4 w-12 h-12 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-500"
                  ></div>
                  <p
                    class="text-[10px] text-pink-100 font-bold uppercase mb-1 relative z-10"
                  >
                    Venta Total
                  </p>
                  <p
                    class="text-lg sm:text-2xl font-black text-white truncate relative z-10"
                  >
                    Bs {{ totales().total.toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Abastecimiento Vasos -->
    <div
      *ngIf="showAbastecimientoModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="closeAbastecimientoModal()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-2xl shrink-0"
        >
          <div>
            <h2 class="text-xl font-extrabold text-black">
              Abastecimiento de Productos
            </h2>
            <p class="text-sm text-slate-500 font-medium">
              {{ fechaInicio() }} &nbsp;·&nbsp;
              {{ getNombreSucursal(currentSucursalId()) }}
            </p>
          </div>
          <button
            (click)="closeAbastecimientoModal()"
            class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-5 space-y-6">
          <!-- Registros del día -->
          <div>
            <h3
              class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3"
            >
              Registros del día
            </h3>
            <div
              *ngIf="isLoadingAbastecimiento()"
              class="flex justify-center py-6"
            >
              <div
                class="h-8 w-8 border-4 border-pink-200 border-t-[#eaa6b6] rounded-full animate-spin"
              ></div>
            </div>
            <p
              *ngIf="
                !isLoadingAbastecimiento() && abastecimientosHoy().length === 0
              "
              class="text-slate-400 text-sm italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              Sin registros para este día.
            </p>
            <div
              *ngIf="
                !isLoadingAbastecimiento() && abastecimientosHoy().length > 0
              "
              class="space-y-2"
            >
              <div
                *ngFor="let ab of abastecimientosHoy()"
                class="bg-slate-50 rounded-xl p-3 border border-slate-100"
              >
                <p class="text-xs font-bold text-slate-400 mb-2">
                  Registro #{{ ab.id_abastecimiento }}&nbsp;·&nbsp;{{
                    formatAbFecha(ab.fecha)
                  }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let d of ab.detalles"
                    class="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
                  >
                    <span class="text-[#eaa6b6]">&times;{{ d.cantidad }}</span>
                    {{ d.nombre_menu }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nuevo registro -->
          <div>
            <h3
              class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3"
            >
              Nuevo Registro
            </h3>
            <p
              *ngIf="vasosMenuItems().length === 0"
              class="text-slate-400 text-sm italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              No se encontraron productos en el menú.
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                *ngFor="let item of vasosMenuItems()"
                class="rounded-xl p-3 border flex flex-col gap-2 transition-colors"
                [class.border-slate-200]="
                  (vasosQuantities()[item.id_menu] || 0) === 0
                "
                [class.bg-slate-50]="
                  (vasosQuantities()[item.id_menu] || 0) === 0
                "
                [class.border-[#eaa6b6]]="
                  (vasosQuantities()[item.id_menu] || 0) > 0
                "
                [class.bg-pink-50]="(vasosQuantities()[item.id_menu] || 0) > 0"
              >
                <!-- Imagen -->
                <div
                  class="w-full h-20 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center"
                >
                  <img
                    *ngIf="item.url_foto"
                    [src]="item.url_foto"
                    [alt]="item.nombre_menu"
                    class="w-full h-full object-cover"
                  />
                  <svg
                    *ngIf="!item.url_foto"
                    class="h-8 w-8 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 7h2l2-3h10l2 3h2a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1zm9 3a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                </div>
                <!-- Id + Nombre -->
                <div>
                  <span class="text-[10px] font-bold text-slate-400"
                    >#{{ item.id_menu }}</span
                  >
                  <p
                    class="text-xs font-bold text-slate-800 line-clamp-2 leading-tight"
                  >
                    {{ item.nombre_menu }}
                  </p>
                </div>
                <!-- Cantidad -->
                <div
                  class="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  <button
                    (click)="decrementAbQty(item.id_menu)"
                    class="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 font-bold text-base leading-none transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    [value]="vasosQuantities()[item.id_menu] || 0"
                    (change)="setAbQty(item.id_menu, $event)"
                    min="0"
                    class="flex-1 text-center text-sm font-black text-slate-900 py-1.5 outline-none w-0 bg-transparent"
                  />
                  <button
                    (click)="incrementAbQty(item.id_menu)"
                    class="px-2.5 py-1.5 text-slate-500 hover:bg-[#eaa6b6] hover:text-black font-bold text-base leading-none transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="shrink-0 bg-white border-t border-slate-200 p-5 flex items-center justify-between rounded-b-2xl"
        >
          <span class="text-sm font-bold text-slate-500">
            {{ abTotalItems() }} producto(s) seleccionado(s)
          </span>
          <div class="flex gap-3">
            <button
              (click)="closeAbastecimientoModal()"
              class="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              (click)="saveAbastecimiento()"
              [disabled]="abTotalItems() === 0 || isSavingAbastecimiento()"
              class="px-5 py-2.5 rounded-xl bg-[#eaa6b6] text-black font-black hover:bg-[#d68a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <span
                *ngIf="isSavingAbastecimiento()"
                class="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"
              ></span>
              {{
                isSavingAbastecimiento() ? "Guardando..." : "Guardar Registro"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Saldo de Ventas -->
    <div
      *ngIf="showSaldoModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="closeSaldoModal()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-2xl shrink-0"
        >
          <div>
            <h2 class="text-xl font-extrabold text-black">Saldo del Día</h2>
            <p class="text-sm text-slate-500 font-medium">
              {{ fechaInicio() }} &nbsp;·&nbsp;
              {{ getNombreSucursal(currentSucursalId()) }}
            </p>
          </div>
          <button
            (click)="closeSaldoModal()"
            class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 p-5">
          <!-- Loading -->
          <div *ngIf="isLoadingSaldo()" class="flex justify-center py-10">
            <div class="h-8 w-8 border-4 border-pink-200 border-t-[#eaa6b6] rounded-full animate-spin"></div>
          </div>

          <!-- Empty -->
          <p
            *ngIf="!isLoadingSaldo() && saldoItems().length === 0"
            class="text-slate-400 text-sm italic text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"
          >
            Sin datos de saldo para este día.
          </p>

          <!-- Table -->
          <div *ngIf="!isLoadingSaldo() && saldoItems().length > 0" class="space-y-2">
            <!-- Header row -->
            <div class="grid grid-cols-3 gap-2 px-3 pb-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Producto</span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Vendido</span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Saldo</span>
            </div>
            <div
              *ngFor="let item of saldoItems()"
              class="grid grid-cols-3 gap-2 items-center bg-slate-50 rounded-xl px-3 py-2.5 border"
              [class.border-slate-100]="item.saldo > 0"
              [class.border-pink-200]="item.saldo === 0"
              [class.bg-pink-50]="item.saldo === 0"
            >
              <span class="text-sm font-bold text-slate-800 truncate" [title]="item.nombre_menu">
                {{ item.nombre_menu }}
              </span>
              <span class="text-sm font-black text-slate-700 text-center">
                {{ item.vendido }}
              </span>
              <div class="flex justify-end">
                <span
                  class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg text-sm font-black"
                  [class.bg-green-100]="item.saldo > 0"
                  [class.text-green-700]="item.saldo > 0"
                  [class.bg-red-100]="item.saldo === 0"
                  [class.text-red-600]="item.saldo === 0"
                >
                  {{ item.saldo }}
                </span>
              </div>
            </div>

            <!-- Totals row -->
            <div class="grid grid-cols-3 gap-2 items-center bg-white rounded-xl px-3 py-2.5 border border-slate-200 mt-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total</span>
              <span class="text-sm font-black text-slate-900 text-center">
                {{ totalVendidoSaldo() }}
              </span>
              <div class="flex justify-end">
                <span class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg text-sm font-black bg-slate-100 text-slate-700">
                  {{ totalSaldoRestante() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 bg-white border-t border-slate-200 p-4 flex justify-end rounded-b-2xl">
          <button
            (click)="closeSaldoModal()"
            class="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalle de Venta -->
    <div
      *ngIf="showDetalleModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="closeDetalleModal()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl"
        >
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-extrabold text-black">Detalle de Venta</h2>
            <span class="text-2xl font-bold text-[#eaa6b6]"
              >#{{ detalleVenta()?.id_venta }}</span
            >
          </div>
          <button
            (click)="closeDetalleModal()"
            class="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Summary Card -->
        <div class="bg-slate-50 p-6 mx-6 mt-6 rounded-xl">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-bold uppercase tracking-wide text-slate-600"
            >
              Total Venta
            </h3>
            <div class="flex gap-6">
              <div class="text-right">
                <p class="text-xs font-bold uppercase text-slate-500">
                  Efectivo
                </p>
                <p class="text-lg font-black">
                  {{ detalleVenta()?.monto_efectivo || 0 }}Bs.
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold uppercase text-slate-500">QR</p>
                <p class="text-lg font-black">
                  {{ detalleVenta()?.monto_qr || 0 }}Bs.
                </p>
              </div>
            </div>
          </div>
          <div class="text-left">
            <p class="text-5xl font-black text-black">
              {{ detalleVenta()?.total || 0 }}Bs.
            </p>
          </div>
        </div>

        <!-- Detalle de Productos -->
        <div class="p-6">
          <h3 class="text-lg font-bold text-black mb-4">
            Detalle de Productos
          </h3>

          <div class="space-y-4">
            <div
              *ngFor="let item of detalleVenta()?.detalles"
              class="bg-slate-50 rounded-xl p-5 border border-slate-100"
            >
              <!-- Product Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-14 w-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden"
                  >
                    <ng-container
                      *ngIf="item.url_foto; else menuItemPlaceholder"
                    >
                      <img
                        [src]="item.url_foto"
                        [alt]="item.nombre_menu"
                        class="w-full h-full object-cover"
                      />
                    </ng-container>
                    <ng-template #menuItemPlaceholder>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 7h2l2-3h10l2 3h2a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1zm9 3a4 4 0 100 8 4 4 0 000-8z"
                        />
                      </svg>
                    </ng-template>
                  </div>
                  <div>
                    <h4 class="text-lg font-bold text-black">
                      {{ item.nombre_menu }}
                    </h4>
                    <p class="text-sm text-slate-500 font-medium">
                      Cantidad: {{ item.cantidad }}
                    </p>
                  </div>
                </div>
                <p class="text-xl font-black text-black">{{ item.total }}Bs.</p>
              </div>

              <!-- Personalizaciones -->
              <div
                *ngIf="
                  item.personalizaciones && item.personalizaciones.length > 0
                "
              >
                <div
                  *ngFor="
                    let categoria of getPersonalizacionesPorCategoria(
                      item.personalizaciones
                    )
                  "
                  class="mt-4"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="text-xs font-bold uppercase tracking-wider text-slate-400"
                      >{{ categoria.nombre_categoria }}</span
                    >
                    <div class="flex-1 h-px bg-slate-200"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div
                      *ngFor="let ing of categoria.ingredientes"
                      class="text-sm flex items-center gap-2"
                    >
                      <div
                        class="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden"
                      >
                        <ng-container *ngIf="ing.url_foto; else ingPlaceholder">
                          <img
                            [src]="ing.url_foto"
                            [alt]="ing.nombre"
                            class="w-full h-full object-cover"
                          />
                        </ng-container>
                        <ng-template #ingPlaceholder>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 7h2l2-3h10l2 3h2a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1zm9 3a4 4 0 100 8 4 4 0 000-8z"
                            />
                          </svg>
                        </ng-template>
                      </div>
                      <div>
                        <span class="text-slate-700 font-semibold">{{
                          ing.nombre
                        }}</span>
                        <span class="text-slate-400 ml-1"
                          >(x{{ ing.cantidad }})</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sin personalizaciones -->
              <div
                *ngIf="
                  !item.personalizaciones || item.personalizaciones.length === 0
                "
                class="mt-2 text-sm text-slate-500 italic"
              >
                Sin personalizaciones
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div
          class="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3 justify-end rounded-b-2xl"
        >
          <button
            (click)="closeDetalleModal()"
            class="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            class="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @import url("https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&display=swap");

      :host {
        font-family: "Work Sans", sans-serif;
      }

      .venta-bot {
        animation: bot-highlight 1s ease-in-out infinite alternate;
      }
      @keyframes bot-highlight {
        from {
          background-color: #dcfce7;
        }
        to {
          background-color: #bbf7d0;
        }
      }
    `,
  ],
})
export class VentasComponent implements OnInit, OnDestroy {
  private ventaService = inject(VentaService);
  private abastecimientoService = inject(AbastecimientoService);
  private authService = inject(AuthService);
  private sucursalService = inject(SucursalService);
  private router = inject(Router);
  private socketService = inject(VentasSocketService);

  ventas = signal<Venta[]>([]);
  sucursales = signal<Sucursal[]>([]);
  fechaInicio = signal<string>(getTodayBolivia());
  fechaFin = signal<string>(getTodayBolivia());
  selectedSucursal = signal<number | null>(null);
  isRangeMode = signal<boolean>(false); // Modo de rango de fechas
  showDetalleModal = signal<boolean>(false);
  detalleVenta = signal<VentaDetalle | null>(null);
  isLoading = signal<boolean>(false); // Nuevo signal para loading state

  // ── Saldo signals ──────────────────────────────────────────────
  showSaldoModal = signal<boolean>(false);
  saldoItems = signal<SaldoItem[]>([]);
  isLoadingSaldo = signal<boolean>(false);

  totalVendidoSaldo = computed(() =>
    this.saldoItems().reduce((s, i) => s + i.vendido, 0),
  );
  totalSaldoRestante = computed(() =>
    this.saldoItems().reduce((s, i) => s + i.saldo, 0),
  );

  // ── Abastecimiento signals ────────────────────────────────────
  showAbastecimientoModal = signal<boolean>(false);
  vasosMenuItems = signal<MenuVenta[]>([]);
  vasosQuantities = signal<Record<number, number>>({});
  abastecimientosHoy = signal<Abastecimiento[]>([]);
  isLoadingAbastecimiento = signal<boolean>(false);
  isSavingAbastecimiento = signal<boolean>(false);

  abTotalItems = computed(
    () => Object.values(this.vasosQuantities()).filter((v) => v > 0).length,
  );

  currentSucursalId = computed(() => {
    return this.selectedSucursal() ?? this.userSucursal ?? 0;
  });

  ventasBotHighlight = signal<Set<number>>(new Set());
  private destroy$ = new Subject<void>();

  userSucursal: number | null = null;
  userRol: number | null = null;

  // Computed totals
  totales = computed(() => {
    const ventasActivas = this.ventas().filter((v) => v.estado !== "CANCELADA");
    return {
      efectivo: ventasActivas.reduce((sum, v) => sum + v.monto_efectivo, 0),
      qr: ventasActivas.reduce((sum, v) => sum + v.monto_qr, 0),
      total: ventasActivas.reduce((sum, v) => sum + v.total, 0),
    };
  });

  ngOnInit() {
    this.loadUserData();
    this.loadSucursales();
    this.ventaService.loadIngredientesCache(); // Cargar ingredientes al inicio
    this.loadVentas();

    // Socket: escuchar nueva_venta del bot (WhatsApp)
    this.socketService.nuevaVenta$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.origen === "bot") {
          // Construir un objeto Venta a partir del payload plano del servidor
          const nuevaVenta: Venta = {
            id_venta: payload.id_venta,
            fecha: payload.fecha,
            id_sucursal: payload.id_sucursal,
            total: payload.total,
            monto_efectivo: 0,
            monto_qr: 0,
            estado: "COMPLETADA",
            username: "Bot WhatsApp",
          };
          this.ventas.update((current) => [nuevaVenta, ...current]);
          new Audio("assets/sounds/alert.wav").play().catch(() => {});
          const id = nuevaVenta.id_venta;
          this.ventasBotHighlight.update((s) => new Set([...s, id]));
          setTimeout(() => {
            this.ventasBotHighlight.update((s) => {
              const n = new Set(s);
              n.delete(id);
              return n;
            });
          }, 5000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSucursales() {
    // Si ya hay sucursales en cache, usarlas
    if (this.sucursalService.hasCachedSucursales()) {
      this.sucursales.set(this.sucursalService.getSucursales());
    }
    // Cargar desde la API y actualizar el cache
    this.sucursalService.loadSucursales().subscribe({
      next: (response) => {
        if (response.success) {
          this.sucursales.set(response.data);
        }
      },
      error: (err) => console.error("Error cargando sucursales", err),
    });
  }

  private loadUserData() {
    const user = this.authService.currentUser;
    this.userRol = user?.id_rol || null;
    this.userSucursal = user?.id_sucursal || null;

    // Configuración inicial del filtro de sucursal según rol
    if (this.isAdmin()) {
      // Admin: Por defecto "Todas las Sucursales" (null)
      this.selectedSucursal.set(null);
    } else if (this.userSucursal) {
      // Vendedor: Setear su sucursal asignada
      this.selectedSucursal.set(this.userSucursal);
    }
  }

  loadVentas() {
    this.isLoading.set(true); // Activar carga

    const params = {
      fecha_inicio: this.fechaInicio(),
      // Solo enviar fecha_fin si estamos en modo rango
      fecha_fin: this.isRangeMode() ? this.fechaFin() : this.fechaInicio(),
      ...(this.selectedSucursal() && { id_sucursal: this.selectedSucursal()! }),
    };

    this.ventaService.getVentas(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.ventas.set(response.data);
        }
        this.isLoading.set(false); // Desactivar carga
      },
      error: (err) => {
        console.error("Error cargando ventas", err);
        this.isLoading.set(false); // Desactivar carga en error
      },
    });
  }

  toggleRangeMode() {
    this.isRangeMode.set(!this.isRangeMode());
    // Si desactivamos el rango, resetear fecha_fin a fecha_inicio
    if (!this.isRangeMode()) {
      this.fechaFin.set(this.fechaInicio());
    }
    this.onFilterChange();
  }

  onFilterChange() {
    // Si es admin y cambió la sucursal, actualizar la sucursal activa globalmente
    if (this.isAdmin()) {
      const selectedId = this.selectedSucursal();
      if (selectedId !== null) {
        const sucursal = this.sucursales().find(
          (s) => s.id_sucursal === selectedId,
        );
        if (sucursal) {
          this.authService.setActiveSucursal(
            sucursal.id_sucursal,
            sucursal.nombre_sucursal,
          );
        }
      }
    }
    this.loadVentas();
  }

  verDetalle(venta: Venta) {
    this.ventaService.getVentaDetalle(venta.id_venta).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const detallesSanitizados = response.data.detalles.map((d) => ({
            ...d,
            url_foto: this.sanitizeImageUrl(d.url_foto),
          }));

          this.detalleVenta.set({
            ...response.data,
            detalles: detallesSanitizados,
          });
          this.showDetalleModal.set(true);
        }
      },
      error: (err) => console.error("Error cargando detalle de venta", err),
    });
  }

  closeDetalleModal() {
    this.showDetalleModal.set(false);
    this.detalleVenta.set(null);
  }

  getPersonalizacionesPorCategoria(personalizaciones: any[]) {
    if (!personalizaciones || personalizaciones.length === 0) return [];

    const idsIngredientes = personalizaciones.map((p) => p.id_ingrediente);
    const categorias =
      this.ventaService.getIngredientesPorCategoria(idsIngredientes);

    // Enriquecer con cantidad
    return categorias.map((cat) => ({
      nombre_categoria: cat.nombre_categoria,
      ingredientes: cat.ingredientes.map((ing: any) => {
        const personalizacion = personalizaciones.find(
          (p) => p.id_ingrediente === ing.id_ingrediente,
        );
        return {
          ...ing,
          nombre: ing.nombre_ingrediente,
          cantidad: personalizacion?.cantidad || 1,
        };
      }),
    }));
  }

  deleteVenta(venta: Venta) {
    if (
      confirm(
        `¿Estás seguro de eliminar la venta #${venta.id_venta} por Bs. ${venta.total.toFixed(2)}?`,
      )
    ) {
      this.ventaService.deleteVenta(venta.id_venta).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadVentas(); // Reload list
          }
        },
        error: (err) => console.error("Error eliminando venta", err),
      });
    }
  }

  enviarVenta(venta: Venta) {
    if (
      confirm(
        `¿Enviar la venta #${venta.id_venta}?\nCambiará de PENDIENTE a ENVIADO.`,
      )
    ) {
      this.ventaService.enviarVenta(venta.id_venta).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadVentas(); // Reload list
          }
        },
        error: (err) => console.error("Error enviando venta", err),
      });
    }
  }

  isAdmin(): boolean {
    return this.userRol === 1;
  }

  formatDateTime(fecha: string): string {
    const date = new Date(fecha);
    const time = date.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${time}\n${day}`;
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: "Pendiente",
      ENTREGADO: "Entregado",
      CANCELADA: "Cancelado",
      ENVIADO: "Enviado",
    };
    return labels[estado] || estado;
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: Record<string, string> = {
      ENTREGADO: "bg-green-100 text-green-800 border border-green-200", // Verde suave
      PENDIENTE: "bg-gray-200 text-gray-700 border border-gray-300", // Gris
      ENVIADO: "bg-[#25D366] text-white shadow-sm border-none", // WhatsApp Green
      CANCELADA: "bg-slate-200 text-slate-700 border border-slate-300",
    };
    return classes[estado] || "bg-gray-100 text-gray-800";
  }

  getNombreSucursal(id: number): string {
    return this.sucursalService.getNombreSucursal(id);
  }

  private sanitizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/\\/g, "");
  }

  // ── Saldo methods ──────────────────────────────────────────────

  openSaldoModal() {
    this.showSaldoModal.set(true);
    this.loadSaldo();
  }

  closeSaldoModal() {
    this.showSaldoModal.set(false);
  }

  loadSaldo() {
    const sucId = this.currentSucursalId();
    if (!sucId) return;
    this.isLoadingSaldo.set(true);
    this.saldoItems.set([]);
    this.abastecimientoService
      .getSaldo(this.fechaInicio(), sucId)
      .subscribe({
        next: (res) => {
          if (res.success) this.saldoItems.set(res.data);
          this.isLoadingSaldo.set(false);
        },
        error: () => this.isLoadingSaldo.set(false),
      });
  }

  // ── Abastecimiento methods ────────────────────────────────────

  openAbastecimientoModal() {
    // Cargar todos los productos del menú desde el cache
    const allMenus = this.ventaService.getCachedMenus();
    const allCats = this.ventaService.getCachedCategories();

    // Prioridad: vasos → crepes → brownies → resto
    const PRIORITY = ["vaso", "crepe", "brownie"];
    const catName = (id: number | undefined) =>
      (
        allCats.find((c) => c.id_categoria_menu === id)
          ?.nombre_categoria_menu ?? ""
      ).toLowerCase();
    const priorityOf = (id: number | undefined) => {
      const idx = PRIORITY.findIndex((p) => catName(id).includes(p));
      return idx === -1 ? PRIORITY.length : idx;
    };

    const sorted = [...allMenus].sort((a, b) => {
      const pa = priorityOf(a.id_categoria_menu);
      const pb = priorityOf(b.id_categoria_menu);
      if (pa !== pb) return pa - pb;
      if (pa < PRIORITY.length) return a.precio_menu - b.precio_menu;
      return 0;
    });

    this.vasosMenuItems.set(sorted);
    this.vasosQuantities.set({});
    this.showAbastecimientoModal.set(true);
    this.loadAbastecimientosHoy();
  }

  closeAbastecimientoModal() {
    this.showAbastecimientoModal.set(false);
  }

  loadAbastecimientosHoy() {
    const sucId = this.currentSucursalId();
    this.isLoadingAbastecimiento.set(true);
    this.abastecimientoService
      .getAbastecimientos(this.fechaInicio(), sucId || undefined)
      .subscribe({
        next: (res) => {
          if (res.success) this.abastecimientosHoy.set(res.data);
          this.isLoadingAbastecimiento.set(false);
        },
        error: () => this.isLoadingAbastecimiento.set(false),
      });
  }

  incrementAbQty(idMenu: number) {
    this.vasosQuantities.update((q) => ({
      ...q,
      [idMenu]: (q[idMenu] || 0) + 1,
    }));
  }

  decrementAbQty(idMenu: number) {
    this.vasosQuantities.update((q) => ({
      ...q,
      [idMenu]: Math.max(0, (q[idMenu] || 0) - 1),
    }));
  }

  setAbQty(idMenu: number, event: Event) {
    const val = Math.max(
      0,
      parseInt((event.target as HTMLInputElement).value) || 0,
    );
    this.vasosQuantities.update((q) => ({ ...q, [idMenu]: val }));
  }

  saveAbastecimiento() {
    const qs = this.vasosQuantities();
    const detalles = Object.entries(qs)
      .filter(([, cant]) => cant > 0)
      .map(([idMenu, cant]) => ({ id_menu: Number(idMenu), cantidad: cant }));
    if (detalles.length === 0) return;

    const user = this.authService.currentUser;
    const sucId = this.currentSucursalId();
    this.isSavingAbastecimiento.set(true);

    this.abastecimientoService
      .createAbastecimiento({
        fecha: this.fechaInicio(),
        id_sucursal: sucId,
        id_usuario: user?.id_usuario || 1,
        detalles,
      })
      .subscribe({
        next: (res) => {
          this.isSavingAbastecimiento.set(false);
          if (res.success) {
            this.vasosQuantities.set({});
            this.loadAbastecimientosHoy(); // Refrescar lista del día
          }
        },
        error: () => this.isSavingAbastecimiento.set(false),
      });
  }

  formatAbFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  }
}
