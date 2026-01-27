import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { VentaService } from "../../services/venta.service";
import {
  MenuVenta,
  Venta,
  CreateVentaPayload,
} from "../../models/venta.models";
import { CategoriaMenu } from "../../../menu/services/menu.service";
import { SucursalService } from "../../../../core/services/sucursal.service";
import { AuthService } from "../../../../core/services/auth.service";
import { getTodayBolivia } from "../../../../core/utils/date.utils";

interface CartItem {
  id_menu: number;
  nombre_menu: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  url_foto?: string | null;
  // TODO: Personalizaciones
}

@Component({
  selector: "app-nueva-venta",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Ajuste de altura para considerar el Navbar y evitar scroll en la página principal -->
    <div class="flex h-[calc(100vh-85px)] bg-[#f8f9fa] overflow-hidden">
      <!-- Left Panel: Product Selection -->
      <div class="flex-1 flex flex-col h-full overflow-hidden relative">
        <!-- Header / Categories -->
        <div class="px-5 py-3 bg-white shadow-sm z-10 shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <button
                routerLink="/ventas"
                class="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 class="text-2xl font-black text-slate-900">
                {{
                  isEditing() ? "Editar Venta #" + editVentaId() : "Nueva Venta"
                }}
              </h1>
            </div>
            <div
              class="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
            >
              Sucursal:
              <span class="text-slate-900 font-bold">{{
                nombreSucursal()
              }}</span>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="flex flex-wrap gap-2">
            <button
              (click)="selectCategory(null)"
              [ngClass]="{
                'bg-[#eaa6b6] text-black ring-2 ring-[#eaa6b6]/30':
                  selectedCategory() === null,
                'bg-white text-slate-600': selectedCategory() !== null,
              }"
              class="px-5 py-2 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all duration-200"
            >
              Todos
            </button>
            <button
              *ngFor="let cat of categorias()"
              (click)="selectCategory(cat.id_categoria_menu)"
              [ngClass]="{
                'bg-[#eaa6b6] text-black ring-2 ring-[#eaa6b6]/30':
                  selectedCategory() === cat.id_categoria_menu,
                'bg-white text-slate-600':
                  selectedCategory() !== cat.id_categoria_menu,
              }"
              class="px-5 py-2 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all duration-200"
            >
              {{ cat.nombre_categoria_menu }}
            </button>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 pb-24 lg:pb-6">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              *ngFor="let product of filteredProducts()"
              (click)="addToCart(product)"
              class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#eaa6b6]/50 transition-all duration-300 flex flex-col h-full relative group overflow-hidden"
            >
              <!-- Product Image -->
              <div
                class="w-full h-36 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 overflow-hidden"
              >
                <ng-container *ngIf="product.url_foto; else menuPlaceholder">
                  <img
                    [src]="product.url_foto"
                    [alt]="product.nombre_menu"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </ng-container>
                <ng-template #menuPlaceholder>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10 text-slate-300"
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

              <div
                class="flex-1 flex flex-col justify-between w-full text-left"
              >
                <h3
                  class="font-bold text-slate-800 mb-1 leading-tight group-hover:text-black line-clamp-2"
                >
                  {{ product.nombre_menu }}
                </h3>
                <p class="text-xl font-black text-[#eaa6b6]">
                  {{ product.precio_menu }} Bs.
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Mobile Cart Trigger Bar -->
        <div
          class="lg:hidden absolute bottom-4 left-4 right-4 z-30"
          *ngIf="cart().length > 0"
        >
          <button
            (click)="showMobileCart.set(true)"
            class="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl shadow-slate-900/20 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm"
              >
                {{ cart().length }} Items
              </div>
              <span class="font-medium text-slate-300 text-sm"
                >Ver pedido actual</span
              >
            </div>
            <div class="text-xl font-black">
              {{ cartTotal().toFixed(2) }} Bs.
            </div>
          </button>
        </div>
      </div>

      <!-- Mobile Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-[2px] transition-opacity duration-300"
        *ngIf="showMobileCart()"
        (click)="showMobileCart.set(false)"
      ></div>

      <!-- Right Panel: Order Summary -->
      <div
        class="bg-white border-l border-slate-200 shadow-2xl flex flex-col shrink-0 z-40
               fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-[2.5rem] transition-transform duration-300 ease-out
               lg:static lg:w-[400px] lg:h-full lg:rounded-none lg:shadow-none lg:translate-y-0"
        [class.translate-y-0]="showMobileCart()"
        [class.translate-y-full]="!showMobileCart()"
      >
        <div
          class="px-5 py-4 border-b border-slate-100 bg-white shrink-0 lg:rounded-none rounded-t-[2.5rem]"
        >
          <!-- Mobile Pull Indicator -->
          <div class="flex justify-center lg:hidden -mt-2 mb-3">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          </div>

          <div class="flex items-center justify-between">
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
              Pedido Actual
            </h2>
            <div class="flex items-center gap-2">
              <span
                *ngIf="isEditing()"
                class="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold rounded"
              >
                Editando #{{ editVentaId() }}
              </span>
              <!-- Mobile Close Button -->
              <button
                (click)="showMobileCart.set(false)"
                class="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
          <div
            *ngIf="cart().length === 0"
            class="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"
          >
            <div
              class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p class="font-medium text-sm">Agrega productos del menú</p>
          </div>

          <div
            *ngFor="let item of cart(); let i = index"
            class="flex gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-pink-100 hover:shadow-sm transition-all group"
          >
            <!-- Product Image -->
            <div
              class="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              <ng-container *ngIf="item.url_foto; else cartPlaceholder">
                <img
                  [src]="item.url_foto"
                  [alt]="item.nombre_menu"
                  class="w-full h-full object-cover"
                />
              </ng-container>
              <ng-template #cartPlaceholder>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-slate-300"
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

            <!-- Product Info & Controls -->
            <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div class="flex justify-between items-start gap-2">
                <h4
                  class="font-bold text-slate-800 text-sm leading-tight line-clamp-2"
                >
                  {{ item.nombre_menu }}
                </h4>
                <span
                  class="font-black text-slate-900 text-sm whitespace-nowrap"
                  >{{ item.subtotal.toFixed(2) }} Bs.</span
                >
              </div>

              <div class="flex justify-between items-center mt-1">
                <!-- Quantity Controls -->
                <div
                  class="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100"
                >
                  <button
                    (click)="decrementQuantity(i)"
                    class="w-6 h-6 rounded-md hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg leading-none pb-0.5"
                  >
                    −
                  </button>
                  <div class="w-8 text-center text-xs font-bold text-slate-900">
                    {{ item.cantidad }}
                  </div>
                  <button
                    (click)="incrementQuantity(i)"
                    class="w-6 h-6 rounded-md hover:bg-[#eaa6b6] hover:text-black text-slate-600 flex items-center justify-center font-bold text-lg leading-none pb-0.5 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  (click)="removeItem(i)"
                  class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar del pedido"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="bg-gray-50 border-t border-slate-200 p-4 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
          <div class="flex justify-between items-center mb-3">
            <span class="text-slate-500 font-bold text-sm">Subtotal</span>
            <span class="text-xl font-black text-slate-700"
              >{{ cartTotal().toFixed(2) }} Bs.</span
            >
          </div>

          <button
            (click)="openPagoModal()"
            [disabled]="cart().length === 0"
            class="w-full bg-white border border-slate-200 py-2.5 px-4 rounded-xl mb-3 font-bold text-slate-700 text-sm flex items-center justify-between hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span class="flex items-center gap-2">
              <span
                class="p-1 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </span>
              Pagar por QR
            </span>
            <span
              class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600"
            >
              {{ pagoDefinido() ? "Definido" : "Efectivo" }}
            </span>
          </button>

          <!-- Total o Desglose -->
          <div class="mb-3 space-y-1" *ngIf="pagoDefinido()">
            <div
              *ngIf="montoEfectivo() > 0"
              class="flex justify-between items-center text-xs"
            >
              <span class="font-bold text-slate-500">Efectivo</span>
              <span class="font-bold text-green-600"
                >{{ montoEfectivo().toFixed(2) }} Bs.</span
              >
            </div>
            <div
              *ngIf="montoQR() > 0"
              class="flex justify-between items-center text-xs"
            >
              <span class="font-bold text-slate-500">QR / Transferencia</span>
              <span class="font-bold text-blue-600"
                >{{ montoQR().toFixed(2) }} Bs.</span
              >
            </div>
          </div>

          <button
            (click)="confirmVenta()"
            [disabled]="cart().length === 0 || isSubmitting()"
            class="w-full bg-[#eaa6b6] text-black font-black py-3.5 rounded-xl shadow-lg shadow-pink-200 hover:bg-[#d68a9a] hover:shadow-pink-300 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-between px-6"
          >
            <span class="text-lg">{{
              isSubmitting() ? "Procesando..." : "Cobrar"
            }}</span>
            <span *ngIf="!isSubmitting()" class="text-2xl"
              >{{ cartTotal().toFixed(2) }} Bs.</span
            >
            <span
              *ngIf="isSubmitting()"
              class="h-6 w-6 border-2 border-black border-t-transparent rounded-full animate-spin"
            ></span>
          </button>
        </div>
      </div>

      <!-- NOTIFICATION TOAST -->
      <div
        *ngIf="notification().show"
        class="fixed bottom-6 right-6 z-[100] transform transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-5 fade-in"
      >
        <div
          [class.bg-green-500]="notification().type === 'success'"
          [class.bg-red-500]="notification().type === 'error'"
          class="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl shadow-gray-200 text-white min-w-[320px]"
        >
          <!-- Icon -->
          <div class="bg-white/20 p-2 rounded-xl">
            <svg
              *ngIf="notification().type === 'success'"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              *ngIf="notification().type === 'error'"
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
          </div>

          <div>
            <h4 class="font-bold text-lg">
              {{ notification().type === "success" ? "¡Éxito!" : "Error" }}
            </h4>
            <p class="text-sm text-white/90 font-medium">
              {{ notification().message }}
            </p>
          </div>

          <button
            (click)="
              notification.set({ show: false, message: '', type: 'success' })
            "
            class="ml-auto text-white/60 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Pago QR/Mixto -->
    <div
      *ngIf="showPagoModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="cancelPagoModal()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-black text-slate-900">Método de Pago</h3>
          <button
            (click)="cancelPagoModal()"
            class="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-slate-500"
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

        <div class="space-y-6">
          <!-- Total de la venta -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span
              class="text-sm font-bold text-slate-600 uppercase tracking-wide"
              >Total de la Venta</span
            >
            <p class="text-3xl font-black text-black mt-1">
              {{ cartTotal().toFixed(2) }} Bs.
            </p>
          </div>

          <!-- Input Monto QR -->
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">
              Monto pagado con QR
            </label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="montoQR"
                (input)="onMontoQRChange()"
                [max]="cartTotal()"
                min="0"
                step="0.01"
                class="w-full px-4 py-3 border-2 border-slate-300 rounded-xl font-bold text-lg focus:border-[#eaa6b6] focus:ring-2 focus:ring-[#eaa6b6]/20 outline-none transition-all"
                placeholder="0.00"
              />
              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                >Bs.</span
              >
            </div>
            <p
              *ngIf="montoQR() > cartTotal()"
              class="text-xs text-red-500 mt-1 font-semibold"
            >
              El monto QR no puede ser mayor al total
            </p>
            <p
              *ngIf="montoQR() < 0"
              class="text-xs text-red-500 mt-1 font-semibold"
            >
              El monto QR no puede ser negativo
            </p>
          </div>

          <!-- Monto Efectivo (calculado) -->
          <div class="bg-pink-50 rounded-xl p-4 border border-pink-200">
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-slate-700"
                >Monto en Efectivo</span
              >
              <span class="text-2xl font-black text-[#eaa6b6]"
                >{{ montoEfectivo().toFixed(2) }} Bs.</span
              >
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-3">
            <button
              (click)="closePagoModal()"
              class="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              (click)="confirmarPago()"
              [disabled]="!isValidPago()"
              class="flex-1 px-6 py-3 rounded-xl bg-[#eaa6b6] text-black font-bold hover:bg-[#d68a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NuevaVentaComponent implements OnInit {
  private ventaService = inject(VentaService);
  private sucursalService = inject(SucursalService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditing = signal<boolean>(false);
  editVentaId = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);

  // Notification State
  notification = signal<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  categorias = signal<CategoriaMenu[]>([]);
  products = signal<MenuVenta[]>([]);
  selectedCategory = signal<number | null>(null);

  cart = signal<CartItem[]>([]);

  // Modal de pago
  showPagoModal = signal<boolean>(false);
  montoQR = signal<number>(0);
  montoEfectivo = signal<number>(0);

  // Mobile State
  showMobileCart = signal<boolean>(false);

  filteredProducts = computed(() => {
    const categoryId = this.selectedCategory();
    const allProducts = this.products();

    if (categoryId === null) {
      return allProducts;
    }

    const filtered = allProducts.filter(
      (p) => p.id_categoria_menu === categoryId,
    );
    console.log("Filtrado:", {
      categoryId,
      totalProducts: allProducts.length,
      filteredCount: filtered.length,
    });
    return filtered;
  });

  cartTotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.subtotal, 0);
  });

  pagoDefinido = computed(() => {
    // El pago está definido si los montos suman el total (con tolerancia de redondeo)
    const qr = this.montoQR();
    const efectivo = this.montoEfectivo();
    const total = this.cartTotal();
    const suma = qr + efectivo;
    return Math.abs(suma - total) < 0.01 && (qr > 0 || efectivo > 0);
  });

  nombreSucursal = computed(() => {
    const user = this.authService.currentUser;
    return user?.id_sucursal
      ? this.sucursalService.getNombreSucursal(user.id_sucursal)
      : "Desconocida";
  });

  ngOnInit() {
    this.checkEditMode();
    this.loadData();

    // Si es nueva venta (no edición), inicializar pago en efectivo por defecto
    if (!this.isEditing()) {
      this.updatePaymentIfNeeded();
    }
  }

  private triggerNotification(
    message: string,
    type: "success" | "error" = "success",
  ) {
    this.notification.set({ show: true, message, type });
    setTimeout(() => {
      this.notification.update((n) => ({ ...n, show: false }));
    }, 3000);
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditing.set(true);
      this.editVentaId.set(Number(id));
      this.loadVentaForEdit(Number(id));
    }
  }

  loadVentaForEdit(id: number) {
    this.ventaService.getVentaDetalle(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const venta = response.data;
          console.log("Venta cargada para edición:", venta);

          // Setear montos de pago
          this.montoEfectivo.set(venta.monto_efectivo);
          this.montoQR.set(venta.monto_qr);

          // Cargar items al carrito
          const cartItems: CartItem[] = venta.detalles.map((detalle) => ({
            id_menu: detalle.id_menu,
            nombre_menu: detalle.nombre_menu,
            precio_unitario: detalle.precio_unitario,
            cantidad: detalle.cantidad,
            subtotal: detalle.total,
            url_foto: detalle.url_foto,
          }));

          this.cart.set(cartItems);
          console.log("Carrito cargado con items:", cartItems);
        }
      },
      error: (err) => {
        console.error("Error cargando venta para editar:", err);
        alert("❌ Error al cargar la venta. Redirigiendo...");
        this.router.navigate(["/ventas"]);
      },
    });
  }

  loadData() {
    // Intentar cargar desde cache primero
    const cachedMenus = this.ventaService.getCachedMenus();
    const cachedCategories = this.ventaService.getCachedCategories();

    if (cachedMenus.length > 0) {
      this.products.set(cachedMenus);
      console.log("Menús cargados del cache:", cachedMenus);
    }
    if (cachedCategories.length > 0) {
      this.categorias.set(cachedCategories);
      console.log("Categorías cargadas del cache:", cachedCategories);
    }

    // Refrescar cache siempre en background
    this.ventaService.loadMenusAndCategories();

    // Si no había cache, esperar y recargar
    if (cachedMenus.length === 0 || cachedCategories.length === 0) {
      setTimeout(() => {
        const newMenus = this.ventaService.getCachedMenus();
        const newCategories = this.ventaService.getCachedCategories();

        if (newMenus.length > 0) {
          this.products.set(newMenus);
          console.log("Menús recargados:", newMenus);
        }
        if (newCategories.length > 0) {
          this.categorias.set(newCategories);
          console.log("Categorías recargadas:", newCategories);
        }
      }, 1500);
    }
  }

  selectCategory(id: number | null) {
    this.selectedCategory.set(id);
  }

  /**
   * Actualiza automáticamente el pago en efectivo si estamos en modo creación
   * Solo se ejecuta si NO estamos editando
   */
  private updatePaymentIfNeeded() {
    if (!this.isEditing()) {
      const total = this.cartTotal();
      this.montoEfectivo.set(total);
      this.montoQR.set(0);
    }
  }

  addToCart(product: MenuVenta) {
    this.cart.update((currentCart) => {
      const existingItemIndex = currentCart.findIndex(
        (item) => item.id_menu === product.id_menu,
      );

      if (existingItemIndex !== -1) {
        // Update quantity
        const updatedCart = [...currentCart];
        const item = updatedCart[existingItemIndex];
        const newQuantity = item.cantidad + 1;
        updatedCart[existingItemIndex] = {
          ...item,
          cantidad: newQuantity,
          subtotal: newQuantity * item.precio_unitario,
        };
        return updatedCart;
      } else {
        // Add new item
        return [
          ...currentCart,
          {
            id_menu: product.id_menu,
            nombre_menu: product.nombre_menu,
            precio_unitario: product.precio_menu,
            cantidad: 1,
            subtotal: product.precio_menu,
            url_foto: product.url_foto,
          },
        ];
      }
    });
    this.updatePaymentIfNeeded();
  }

  incrementQuantity(index: number) {
    this.cart.update((current) => {
      const updated = [...current];
      const item = updated[index];
      const newQty = item.cantidad + 1;
      updated[index] = {
        ...item,
        cantidad: newQty,
        subtotal: newQty * item.precio_unitario,
      };
      return updated;
    });
    this.updatePaymentIfNeeded();
  }

  decrementQuantity(index: number) {
    this.cart.update((current) => {
      const updated = [...current];
      const item = updated[index];
      if (item.cantidad > 1) {
        const newQty = item.cantidad - 1;
        updated[index] = {
          ...item,
          cantidad: newQty,
          subtotal: newQty * item.precio_unitario,
        };
        return updated;
      } else {
        // Remove if q = 1 ? Or just stay at 1? usually remove is explicit button
        return updated;
      }
    });
    this.updatePaymentIfNeeded();
  }

  removeItem(index: number) {
    this.cart.update((current) => current.filter((_, i) => i !== index));
    this.updatePaymentIfNeeded();
  }

  openPagoModal() {
    if (this.cart().length === 0) return;

    // Si ya hay montos definidos, mantenerlos
    // Si no, inicializar con todo en QR (para cambiar el método de pago)
    const currentQR = this.montoQR();
    const currentEfectivo = this.montoEfectivo();
    const total = this.cartTotal();

    // Lógica para QR por defecto:
    // Si el usuario no ha tocado nada (todo efetivo por defecto) O los montos están desfasados
    // seteamos TODO a QR, ya que el botón dice "Pagar por QR"
    const isDefaultCash =
      currentQR === 0 && Math.abs(currentEfectivo - total) < 0.01;

    if (Math.abs(currentQR + currentEfectivo - total) > 0.01 || isDefaultCash) {
      this.montoQR.set(total);
      this.montoEfectivo.set(0);
    }
    // Si ya tienen una definición mixta personalizada, la respetamos

    this.showPagoModal.set(true);
  }

  closePagoModal() {
    this.showPagoModal.set(false);
  }

  cancelPagoModal() {
    this.showPagoModal.set(false);
    // Resetear montos solo al cancelar
    this.montoQR.set(0);
    this.montoEfectivo.set(0);
  }

  onMontoQRChange() {
    const qr = this.montoQR();
    const total = this.cartTotal();

    // Validar límites
    if (qr < 0) {
      this.montoQR.set(0);
    } else if (qr > total) {
      this.montoQR.set(total);
    }

    // Calcular monto efectivo
    const efectivo = total - this.montoQR();
    this.montoEfectivo.set(Math.max(0, efectivo));
  }

  isValidPago(): boolean {
    const qr = this.montoQR();
    const efectivo = this.montoEfectivo();
    const total = this.cartTotal();

    // Validar que los montos sean correctos
    const suma = qr + efectivo;
    return qr >= 0 && efectivo >= 0 && Math.abs(suma - total) < 0.01; // Tolerancia de 1 centavo por redondeo
  }

  confirmarPago() {
    if (!this.isValidPago()) return;

    console.log("Pago confirmado:", {
      monto_qr: this.montoQR(),
      monto_efectivo: this.montoEfectivo(),
      total: this.cartTotal(),
    });

    // Solo cerrar el modal, mantener los montos definidos
    this.showPagoModal.set(false);
  }

  confirmVenta() {
    if (this.cart().length === 0) return;

    // Validar que se hayan definido los montos de pago
    if (this.montoQR() === 0 && this.montoEfectivo() === 0) {
      // Si no se han definido, abrir el modal de pago
      this.openPagoModal();
      return;
    }

    const user = this.authService.currentUser;
    if (!user) {
      console.error("No hay usuario autenticado");
      return;
    }

    this.isSubmitting.set(true);

    // Construir detalles según formato API
    const detalles = this.cart().map((item) => ({
      id_menu: item.id_menu,
      cantidad: item.cantidad,
      precio: item.precio_unitario,
      sub_total: item.subtotal,
      personalizaciones: [], // Vacío por ahora
    }));

    // Construir payload completo
    const payload: CreateVentaPayload = {
      id_usuario: user.id_usuario,
      fecha: getTodayBolivia(),
      id_sucursal: user.id_sucursal || 1,
      monto_efectivo: this.montoEfectivo(),
      monto_qr: this.montoQR(),
      total: this.cartTotal(),
      estado: "ENTREGADO",
      detalles: detalles,
    };

    console.log(
      this.isEditing() ? "Actualizando venta:" : "Enviando venta:",
      payload,
    );

    // Usar PUT si está editando, POST si es nueva
    const request$ = this.isEditing()
      ? this.ventaService.updateVenta(this.editVentaId()!, payload)
      : this.ventaService.createVenta(payload);

    request$.subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          const action = this.isEditing() ? "actualizada" : "creada";
          console.log(`Venta ${action} exitosamente:`, response.data);
          this.triggerNotification(`Venta ${action} exitosamente`);
          // Redirigir a la lista de ventas tras breve pausa
          setTimeout(() => {
            this.router.navigate(["/ventas"]);
          }, 1000);
        } else {
          this.triggerNotification("Error inesperado en el servidor", "error");
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const action = this.isEditing() ? "actualizar" : "crear";
        console.error(`Error ${action}ndo venta:`, err);
        this.triggerNotification(
          `Error al ${action} la venta. Intenta nuevamente.`,
          "error",
        );
      },
    });
  }
}
