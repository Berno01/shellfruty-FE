import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { MenuConfigService } from "../../services/menu-config.service";
import { MenuService, CategoriaMenu } from "../../services/menu.service";
import { CloudinaryService } from "../../../../core/services/cloudinary.service";
import {
  Category,
  Ingredient,
  MenuCreateDto,
  RuleCreateDto,
  Rule,
} from "../../models/menu.models";

interface CategoryConfig {
  id_regla?: number; // For keeping track of existing rule in Edit Mode
  cant_gratis: number;
  costo_extra: number;
  combinacion: boolean;
  ingredients: {
    id_ingrediente: number;
    nombre: string;
    selected: boolean;
    costo_extra: number;
    disponible: boolean; // estado global del ingrediente
    url_foto?: string | null;
  }[];
}

@Component({
  selector: "app-menu-create",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50/50 pb-20">
      <!-- Top Bar / Header -->
      <div
        class="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30"
      >
        <div
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 md:gap-4">
            <a
              routerLink="/menu"
              class="p-2 -ml-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </a>
            <div>
              <h1
                class="text-lg md:text-2xl font-extrabold text-gray-900 leading-none"
              >
                {{ isEditMode() ? "Editar Vaso" : "Nuevo Vaso" }}
              </h1>
              <p class="hidden md:block text-xs text-gray-500 mt-1 font-medium">
                Configuración de producto
              </p>
            </div>
          </div>
          <button
            (click)="saveAll()"
            [disabled]="isSaving()"
            class="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="isSaving()">Guardando...</span>
            <span *ngIf="!isSaving()" class="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span class="hidden sm:inline">Guardar Cambios</span>
              <span class="sm:hidden">Guardar</span>
            </span>
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <!-- 1. Basic Info Section -->
        <section
          class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h2 class="text-lg font-bold text-gray-900 mb-4">
            Información Básica
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Nombre del Menu</label
              >
              <input
                type="text"
                [(ngModel)]="menuBasicInfo.nombre_menu"
                class="w-full rounded-xl border-gray-200 px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 bg-white shadow-sm"
                placeholder="Ej: Vaso Grande"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Precio Base (Bs.)</label
              >
              <input
                type="number"
                [(ngModel)]="menuBasicInfo.precio_menu"
                class="w-full rounded-xl border-gray-200 px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 bg-white shadow-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Categoría</label
              >
              <div class="flex gap-2">
                <select
                  [(ngModel)]="menuBasicInfo.id_categoria_menu"
                  (change)="onCategoryChange($event)"
                  class="w-full rounded-xl border-gray-200 px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 bg-white shadow-sm appearance-none"
                >
                  <option [ngValue]="null" disabled>
                    Selecciona una categoría
                  </option>
                  <option
                    *ngFor="let cat of menuCategories()"
                    [ngValue]="cat.id_categoria_menu"
                  >
                    {{ cat.nombre_categoria_menu }}
                  </option>
                  <option
                    [ngValue]="-1"
                    class="font-bold text-pink-600 border-t bg-pink-50"
                  >
                    + Crear Nueva Categoría
                  </option>
                </select>

                <button
                  *ngIf="
                    menuBasicInfo.id_categoria_menu &&
                    menuBasicInfo.id_categoria_menu !== -1
                  "
                  (click)="
                    openMenuCategoryModal(menuBasicInfo.id_categoria_menu)
                  "
                  class="p-3 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-400 hover:text-pink-500 transition-all shadow-sm"
                  title="Editar categoría"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="md:col-span-3">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Foto del vaso</label
              >
              <div class="flex flex-col md:flex-row gap-4">
                <div
                  class="w-full md:w-56 h-56 rounded-3xl border border-dashed flex items-center justify-center overflow-hidden transition-colors"
                  [ngClass]="{
                    'border-pink-300 bg-pink-50': isDraggingMenuFile(),
                    'border-gray-200 bg-gray-50': !isDraggingMenuFile(),
                  }"
                  (dragover)="handleMenuImageDragOver($event)"
                  (dragleave)="handleMenuImageDragLeave($event)"
                  (drop)="handleMenuImageDrop($event)"
                >
                  <ng-container *ngIf="menuImagePreview(); else menuEmptyImage">
                    <img
                      [src]="menuImagePreview()!"
                      alt="Vista previa del menú"
                      class="w-full h-full object-cover"
                    />
                  </ng-container>
                  <ng-template #menuEmptyImage>
                    <div class="text-center px-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-10 w-10 mx-auto text-gray-400 mb-2"
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
                      <p class="text-sm font-semibold text-gray-600">
                        Arrastra una imagen aquí
                      </p>
                      <p class="text-xs text-gray-400">
                        JPG / PNG / WEBP hasta 5MB
                      </p>
                    </div>
                  </ng-template>
                </div>
                <div class="flex-1 space-y-3">
                  <p class="text-sm text-gray-500">
                    Dale identidad visual a este vaso. Recomendamos imágenes
                    cuadradas de al menos 800x800 px con fondo uniforme.
                  </p>
                  <div class="flex flex-wrap gap-3">
                    <label
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 10h16"
                        />
                      </svg>
                      Subir imagen
                      <input
                        type="file"
                        class="hidden"
                        accept="image/*,.webp"
                        (change)="onMenuImageSelected($event)"
                      />
                    </label>
                    <button
                      type="button"
                      (click)="removeMenuImage()"
                      [disabled]="!menuImageUrl() || isUploadingMenuImage()"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:text-red-500 hover:border-red-200 disabled:opacity-40"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Quitar foto
                    </button>
                  </div>
                  <p
                    *ngIf="isUploadingMenuImage()"
                    class="text-xs font-semibold text-pink-600"
                  >
                    Subiendo imagen...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Main Layout -->
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- LEFT SIDEBAR: Categories -->
          <aside class="w-full lg:w-1/4 space-y-4">
            <div
              class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit"
            >
              <h3 class="text-lg font-bold text-gray-900 mb-2">Categorías</h3>
              <p class="text-xs text-gray-500 mb-6">
                Selecciona un grupo para editar
              </p>

              <div class="space-y-2">
                <div
                  *ngFor="let cat of categories()"
                  (click)="selectCategory(cat)"
                  [class.bg-pink-50]="
                    selectedCategory()?.id_categoria === cat.id_categoria
                  "
                  [class.border-pink-100]="
                    selectedCategory()?.id_categoria === cat.id_categoria
                  "
                  [class.border-transparent]="
                    selectedCategory()?.id_categoria !== cat.id_categoria
                  "
                  class="group flex items-center justify-between p-3 rounded-2xl cursor-pointer border hover:bg-gray-50 transition-all duration-200"
                >
                  <div class="flex items-center gap-3 overflow-hidden">
                    <!-- Icon placeholder based on name or default -->
                    <div
                      [class.bg-pink-100]="
                        selectedCategory()?.id_categoria === cat.id_categoria
                      "
                      [class.text-pink-600]="
                        selectedCategory()?.id_categoria === cat.id_categoria
                      "
                      [class.bg-gray-100]="
                        selectedCategory()?.id_categoria !== cat.id_categoria
                      "
                      [class.text-gray-500]="
                        selectedCategory()?.id_categoria !== cat.id_categoria
                      "
                      class="p-2 rounded-xl transition-colors"
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <span
                      [class.font-bold]="
                        selectedCategory()?.id_categoria === cat.id_categoria
                      "
                      [class.text-gray-900]="
                        selectedCategory()?.id_categoria === cat.id_categoria
                      "
                      [class.text-gray-600]="
                        selectedCategory()?.id_categoria !== cat.id_categoria
                      "
                      class="truncate text-sm transition-colors"
                    >
                      {{ cat.nombre_categoria }}
                    </span>
                  </div>

                  <!-- Actions (Edit/Delete) -->
                  <div
                    class="flex opacity-0 group-hover:opacity-100 transition-opacity"
                    (click)="$event.stopPropagation()"
                  >
                    <button
                      (click)="openCategoryModal(cat)"
                      class="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                      title="Editar Categoría"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        ></path>
                      </svg>
                    </button>
                    <!-- Deleted Category button removed via replacement -->
                  </div>
                </div>

                <!-- Add Category Button -->
                <div
                  (click)="openCategoryModal()"
                  class="flex items-center justify-center p-3 rounded-2xl cursor-pointer border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-gray-400 hover:text-pink-500 group"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      ></path>
                    </svg>
                    <span class="text-sm font-bold">Nueva Categoría</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- RIGHT PANEL: Config -->
          <main
            class="w-full lg:w-3/4 space-y-8"
            *ngIf="selectedCategory(); else noSelectionTpl"
          >
            <!-- 3. General Rules Card -->
            <div
              class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <div class="flex items-center gap-3 mb-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <h3 class="text-xl font-bold text-gray-900">
                  Reglas Generales ({{ selectedCategory()?.nombre_categoria }})
                </h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Cantidad Gratis -->
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2"
                    >Cantidad Gratis</label
                  >
                  <div class="relative">
                    <input
                      type="number"
                      [ngModel]="currentConfig?.cant_gratis"
                      (ngModelChange)="updateConfigField('cant_gratis', $event)"
                      class="block w-full pl-4 pr-16 py-3 rounded-xl border-gray-200 bg-gray-50 focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 font-medium text-gray-900 shadow-sm"
                    />
                    <div
                      class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"
                    >
                      <span
                        class="text-gray-400 text-xs font-bold uppercase tracking-wide"
                        >Porciones</span
                      >
                    </div>
                  </div>
                  <p class="mt-2 text-xs text-pink-700">
                    Cantidad incluida en el precio base.
                  </p>
                </div>

                <!-- Costo Extra -->
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2"
                    >Costo Extra Adicional</label
                  >
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <span class="text-gray-400 font-bold text-xs">Bs.</span>
                    </div>
                    <input
                      type="number"
                      [ngModel]="currentConfig?.costo_extra"
                      (ngModelChange)="updateConfigField('costo_extra', $event)"
                      class="block w-full pl-8 pr-4 py-3 rounded-xl border-gray-200 bg-gray-50 focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 font-medium text-gray-900 shadow-sm"
                    />
                  </div>
                  <p class="mt-2 text-xs text-pink-700">
                    Precio por porción extra.
                  </p>
                </div>

                <!-- Combinaciones -->
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2"
                    >Permitir Combinaciones</label
                  >
                  <div class="flex items-center h-[50px]">
                    <button
                      type="button"
                      (click)="
                        updateConfigField(
                          'combinacion',
                          !currentConfig?.combinacion
                        )
                      "
                      class="relative inline-flex flex-shrink-0 h-7 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      [ngClass]="
                        currentConfig?.combinacion
                          ? 'bg-pink-500'
                          : 'bg-gray-200'
                      "
                    >
                      <span class="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        [ngClass]="
                          currentConfig?.combinacion
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        "
                        class="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                      >
                      </span>
                    </button>
                    <span class="ml-3 text-sm font-medium text-gray-900">
                      {{
                        currentConfig?.combinacion
                          ? "Habilitado"
                          : "Deshabilitado"
                      }}
                    </span>
                  </div>
                  <p class="mt-2 text-xs text-pink-700">
                    El cliente puede mezclar opciones.
                  </p>
                </div>
              </div>
            </div>

            <!-- 4. Availability & Inventory -->
            <div
              class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <div
                class="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4"
              >
                <div>
                  <h3 class="text-xl font-bold text-gray-900">
                    Disponibilidad e Inventario
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Selecciona los ingredientes disponibles para este tamaño.
                  </p>
                </div>

                <div class="relative w-full sm:w-64">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  >
                    <svg
                      class="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    class="block w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 shadow-sm"
                    placeholder="Buscar ingrediente..."
                  />
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr
                      class="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100"
                    >
                      <th class="pb-3 pl-2">Ingrediente</th>
                      <!-- <th class="pb-3">Estado</th> Removed as requested -->
                      <th class="pb-3">Costo Premium (Base)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr
                      *ngFor="let item of currentConfig?.ingredients"
                      class="group hover:bg-gray-50 transition-colors"
                    >
                      <!-- Checkbox + Info -->
                      <td class="py-4 pl-2">
                        <div class="flex items-center gap-4">
                          <div class="relative flex items-center">
                            <input
                              type="checkbox"
                              [checked]="item.selected"
                              (change)="toggleIngredient(item)"
                              class="h-6 w-6 text-pink-500 border-gray-300 rounded focus:ring-pink-400 cursor-pointer transition-all"
                            />
                          </div>
                          <div class="flex items-center gap-3">
                            <div
                              class="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden"
                            >
                              <ng-container
                                *ngIf="
                                  item.url_foto;
                                  else ingredientPlaceholder
                                "
                              >
                                <img
                                  [src]="item.url_foto"
                                  [alt]="item.nombre"
                                  class="w-full h-full object-cover"
                                />
                              </ng-container>
                              <ng-template #ingredientPlaceholder>
                                <svg
                                  class="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  ></path>
                                </svg>
                              </ng-template>
                            </div>
                            <div>
                              <div class="flex items-center gap-2">
                                <p
                                  class="font-bold text-gray-900 group-hover:text-pink-600 transition-colors cursor-pointer"
                                  (click)="
                                    openIngredientModal(item);
                                    $event.stopPropagation()
                                  "
                                >
                                  {{ item.nombre }}
                                </p>
                                <button
                                  (click)="
                                    openIngredientModal(item);
                                    $event.stopPropagation()
                                  "
                                  class="text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg
                                    class="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    ></path>
                                  </svg>
                                </button>
                              </div>
                              <p class="text-xs text-gray-400">
                                ID: ING-{{ item.id_ingrediente }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Status Badge Removed -->
                      <!-- <td class="py-4">
                        <span ... > ... </span>
                      </td> -->

                      <!-- Premium Price Input -->
                      <td class="py-4">
                        <div class="relative max-w-[140px]">
                          <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                          >
                            <span class="text-gray-400 font-bold text-xs"
                              >Bs.</span
                            >
                          </div>
                          <input
                            type="number"
                            [disabled]="!item.selected"
                            [ngModel]="item.costo_extra"
                            (ngModelChange)="
                              updateIngredientPrice(item, $event)
                            "
                            [class.opacity-50]="!item.selected"
                            class="block w-full pl-9 pr-3 py-2 rounded-lg border-gray-200 text-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 font-bold text-gray-700 shadow-sm text-right"
                          />

                          <div
                            *ngIf="item.costo_extra > 0"
                            class="absolute inset-y-0 right-[-80px] flex items-center pointer-events-none"
                          >
                            <span
                              class="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded uppercase"
                              >Premium</span
                            >
                          </div>
                        </div>
                      </td>
                    </tr>

                    <!-- Add Ingredient Row -->
                    <tr>
                      <td colspan="3" class="py-4">
                        <div
                          (click)="openIngredientModal()"
                          class="flex items-center justify-center p-3 rounded-xl cursor-pointer border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-gray-400 hover:text-pink-500 group"
                        >
                          <div class="flex items-center gap-2">
                            <svg
                              class="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                              ></path>
                            </svg>
                            <span class="text-sm font-bold"
                              >Nuevo Ingrediente en
                              {{ selectedCategory()?.nombre_categoria }}</span
                            >
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          <ng-template #noSelectionTpl>
            <div
              class="w-full lg:w-3/4 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 border-dashed min-h-[400px]"
            >
              <div class="bg-gray-50 p-6 rounded-full mb-4">
                <svg
                  class="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">
                Ninguna categoría seleccionada
              </h3>
              <p class="text-gray-500 text-center max-w-sm mt-2">
                Selecciona un grupo del panel izquierdo para configurar sus
                reglas, ingredientes y precios para este vaso.
              </p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- SIMPLE MODAL OVERLAYS -->

      <!-- Menu Category Modal -->
      <div
        *ngIf="showMenuCategoryModal()"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200"
        >
          <h3 class="text-xl font-extrabold text-gray-900 mb-4">
            {{
              editingMenuCategory()
                ? "Editar Categoría de Menú"
                : "Nueva Categoría de Menú"
            }}
          </h3>
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Nombre de la Categoría</label
            >
            <input
              type="text"
              [(ngModel)]="menuCategoryName"
              (keydown.enter)="saveMenuCategory()"
              placeholder="Ej: Bebidas, Postres..."
              class="w-full rounded-xl border-gray-200 px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all font-medium text-lg"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              (click)="showMenuCategoryModal.set(false)"
              class="px-5 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              (click)="saveMenuCategory()"
              class="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <!-- Category Modal -->
      <div
        *ngIf="showCategoryModal()"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200"
        >
          <h3 class="text-xl font-extrabold text-gray-900 mb-4">
            {{ editingItem() ? "Editar Categoría" : "Nueva Categoría" }}
          </h3>
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Nombre de la Categoría</label
            >
            <input
              type="text"
              [ngModel]="modalInputValue()"
              (ngModelChange)="modalInputValue.set($event)"
              class="w-full rounded-xl border-gray-300 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 px-4 py-3 shadow-sm"
              placeholder="Ej: Frutas"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              (click)="showCategoryModal.set(false)"
              class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              (click)="saveCategory()"
              class="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition-transform active:scale-95"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <!-- Ingredient Modal -->
      <div
        *ngIf="showIngredientModal()"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200"
        >
          <h3 class="text-xl font-extrabold text-gray-900 mb-4">
            {{ editingItem() ? "Editar Ingrediente" : "Nuevo Ingrediente" }}
          </h3>
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Nombre del Ingrediente</label
            >
            <input
              type="text"
              [ngModel]="modalInputValue()"
              (ngModelChange)="modalInputValue.set($event)"
              class="w-full rounded-xl border-gray-300 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-200 px-4 py-3 shadow-sm"
              placeholder="Ej: Mango"
            />
          </div>
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Foto del Ingrediente</label
            >
            <div
              class="flex items-center gap-4"
              (dragover)="handleImageDragOver($event)"
              (dragleave)="handleImageDragLeave($event)"
              (drop)="handleIngredientImageDrop($event)"
            >
              <div
                class="w-24 h-24 rounded-2xl border border-dashed flex items-center justify-center overflow-hidden transition-colors"
                [ngClass]="{
                  'bg-pink-50 border-pink-300': isDraggingFile(),
                  'bg-gray-50 border-gray-300': !isDraggingFile(),
                }"
              >
                <ng-container
                  *ngIf="ingredientImagePreview(); else emptyIngredientImage"
                >
                  <img
                    [src]="ingredientImagePreview()!"
                    alt="Vista previa del ingrediente"
                    class="object-cover w-full h-full"
                  />
                </ng-container>
                <ng-template #emptyIngredientImage>
                  <svg
                    class="w-8 h-8 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </ng-template>
              </div>
              <div class="flex-1 space-y-2">
                <label
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="file"
                    accept="image/*,.webp"
                    class="hidden"
                    (change)="onIngredientImageSelected($event)"
                  />
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
                      d="M4 4v16h16V8l-6-4H4zm8 5v6m-3-3h6"
                    />
                  </svg>
                  <span>Seleccionar imagen</span>
                </label>
                <p class="text-xs text-gray-500">
                  Arrastra una imagen (JPG, PNG, WEBP) o haz clic para
                  seleccionar. Se sube automáticamente a Cloudinary.
                </p>
                <p
                  *ngIf="isUploadingImage()"
                  class="text-xs font-semibold text-pink-600"
                >
                  Subiendo imagen, por favor espera...
                </p>
                <button
                  type="button"
                  *ngIf="ingredientImagePreview() && !isUploadingImage()"
                  (click)="removeIngredientImage()"
                  class="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Quitar imagen
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button
              (click)="closeIngredientModal()"
              class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              (click)="saveIngredient()"
              [disabled]="isUploadingImage()"
              class="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isUploadingImage() ? "Subiendo..." : "Guardar" }}
            </button>
          </div>
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
  `,
})
export class MenuCreateComponent implements OnInit {
  private menuConfigService = inject(MenuConfigService);
  private menuService = inject(MenuService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cloudinaryService = inject(CloudinaryService);

  // State Signals
  categories = signal<Category[]>([]);
  menuCategories = signal<CategoriaMenu[]>([]); // New list for menu categories
  selectedCategory = signal<Category | null>(null);
  isSaving = signal(false);

  // Edit Mode
  isEditMode = signal(false);
  menuId = signal<number | null>(null);
  private loadedRulesMap = new Map<number, Rule>();

  // Modals State
  showCategoryModal = signal(false);
  showMenuCategoryModal = signal(false); // New modal for menu categories
  showIngredientModal = signal(false);
  editingItem = signal<any>(null); // Guardará el objeto completo (Categoría o Ingrediente) si es edición, null si es creación
  editingMenuCategory = signal<CategoriaMenu | null>(null); // New state for menu category edit
  modalInputValue = signal(""); // Input para el nombre en el modal
  menuCategoryName = signal(""); // New input for menu category modal
  ingredientImageUrl = signal<string | null>(null);
  ingredientImagePreview = signal<string | null>(null);
  isUploadingImage = signal(false);
  isDraggingFile = signal(false);
  menuImageUrl = signal<string | null>(null);
  menuImagePreview = signal<string | null>(null);
  isUploadingMenuImage = signal(false);
  isDraggingMenuFile = signal(false);

  // Notification State
  notification = signal<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Basic Menu Info
  menuBasicInfo = {
    nombre_menu: "",
    precio_menu: 0,
    id_categoria_menu: null as number | null, // New field
    url_foto: null as string | null,
  };

  // Store configuration for each category (Draft state)
  // Key: Category ID, Value: Configuration Object
  private configState = new Map<number, CategoryConfig>();

  // Expose current config for the template
  get currentConfig(): CategoryConfig | undefined {
    const cat = this.selectedCategory();
    return cat ? this.configState.get(cat.id_categoria) : undefined;
  }

  ngOnInit() {
    this.loadMenuCategories(); // Load menu categories first
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode.set(true);
      this.menuId.set(+id);
      this.loadMenuData(+id);
    } else {
      this.loadCategories();
    }
  }

  loadMenuData(id: number) {
    this.menuConfigService.getMenuById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menuBasicInfo.nombre_menu = res.data.nombre_menu;
          this.menuBasicInfo.precio_menu = res.data.precio_menu;
          this.menuBasicInfo.id_categoria_menu =
            res.data.id_categoria_menu || null; // Populate category
          this.resetMenuImageState(res.data.url_foto || null);

          if (res.data.reglas_activas) {
            res.data.reglas_activas.forEach((rule) => {
              this.loadedRulesMap.set(rule.id_categoria, rule);
            });
          }
          this.loadCategories();
        }
      },
      error: () => this.router.navigate(["/"]),
    });
  }

  loadCategories() {
    this.menuConfigService.getCategorias().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
          // Auto-select first category if available
          if (res.data.length > 0) {
            this.selectCategory(res.data[0]);
          }
        }
      },
    });
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

  // ==========================================
  // MENU CATEGORY MANAGEMENT
  // ==========================================

  loadMenuCategories() {
    this.menuService.getCategoriesMenu().subscribe({
      next: (res) => {
        if (res.success) {
          this.menuCategories.set(res.data);
        }
      },
      error: () => console.error("Error loading menu categories"),
    });
  }

  onCategoryChange(event: any) {
    const selectedValue = this.menuBasicInfo.id_categoria_menu;
    if (selectedValue === -1) {
      // Create New
      this.menuBasicInfo.id_categoria_menu = null; // Reset selection
      this.openMenuCategoryModal();
    }
  }

  openMenuCategoryModal(categoryId?: number) {
    if (categoryId) {
      const cat = this.menuCategories().find(
        (c) => c.id_categoria_menu === categoryId,
      );
      if (cat) {
        this.editingMenuCategory.set(cat);
        this.menuCategoryName.set(cat.nombre_categoria_menu);
      }
    } else {
      this.editingMenuCategory.set(null);
      this.menuCategoryName.set("");
    }
    this.showMenuCategoryModal.set(true);
  }

  saveMenuCategory() {
    const name = this.menuCategoryName();
    if (!name.trim()) return;

    if (this.editingMenuCategory()) {
      // Update
      const id = this.editingMenuCategory()!.id_categoria_menu;
      this.menuService.updateCategoryMenu(id, name).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Ensure res.data is returned and valid
            this.loadMenuCategories();
            this.showMenuCategoryModal.set(false);
            // Verify if we need to update current selection or list
            this.triggerNotification("Categoría actualizada");
          }
        },
        error: () =>
          this.triggerNotification("Error al actualizar categoría", "error"),
      });
    } else {
      // Create
      this.menuService.createCategoryMenu(name).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.loadMenuCategories();
            this.showMenuCategoryModal.set(false);
            // Select the newly created category
            this.menuBasicInfo.id_categoria_menu = res.data.id_categoria_menu;
            this.triggerNotification("Categoría creada");
          }
        },
        error: () =>
          this.triggerNotification("Error al crear categoría", "error"),
      });
    }
  }

  // ==========================================
  // CONFIGURATION LOGIC (Draft State)
  // ==========================================

  selectCategory(category: Category) {
    this.selectedCategory.set(category);

    // If we haven't initialized config for this category yet, do it now
    if (!this.configState.has(category.id_categoria)) {
      // Check for existing rule in Edit Mode
      const existingRule = this.loadedRulesMap.get(category.id_categoria);

      // 1. Initialize with defaults
      const initialConfig: CategoryConfig = {
        id_regla: existingRule?.id_regla,
        cant_gratis: existingRule ? existingRule.cant_gratis : 0,
        costo_extra: existingRule ? existingRule.costo_extra : 0,
        combinacion: existingRule ? existingRule.combinacion : false,
        ingredients: [],
      };
      this.configState.set(category.id_categoria, initialConfig);

      // 2. Load available ingredients for this category from backend
      this.menuConfigService
        .getIngredientesByCategoria(category.id_categoria)
        .subscribe({
          next: (res) => {
            if (res.success) {
              const current = this.configState.get(category.id_categoria);
              if (current) {
                // Map active ingredients for Edit Mode
                const activeIngIds = new Set<number>();
                const activeIngCosts = new Map<number, number>();

                if (existingRule && existingRule.detalles_activos) {
                  existingRule.detalles_activos.forEach((d) => {
                    activeIngIds.add(d.id_ingrediente);
                    activeIngCosts.set(d.id_ingrediente, d.costo_extra);
                  });
                }

                current.ingredients = res.data.map((ing) => ({
                  id_ingrediente: ing.id_ingrediente,
                  nombre: ing.nombre_ingrediente,
                  selected: activeIngIds.has(ing.id_ingrediente),
                  costo_extra: activeIngCosts.get(ing.id_ingrediente) || 0,
                  disponible: ing.estado ?? true,
                  url_foto: this.sanitizeImageUrl(ing.url_foto),
                }));

                this.configState.set(category.id_categoria, current);

                // Force update map reference or rely on mutation if signal checks content?
                // Since configState is a Map (not a signal), and we use a getter currentConfig() that depends on selectedCategory signal...
                // The view updates because selectedCategory changed?
                // Actually, fetching is async. View might render empty list first.
                // Trigger a shallow update on selectedCategory to force view refresh if needed
                this.selectedCategory.set({ ...category });
              }
            }
          },
        });
    }
  }

  updateConfigField(field: keyof CategoryConfig, value: any) {
    const cat = this.selectedCategory();
    if (!cat) return;

    const config = this.configState.get(cat.id_categoria);
    if (config) {
      (config as any)[field] = value;
    }
  }

  toggleIngredient(item: any) {
    item.selected = !item.selected;
  }

  updateIngredientPrice(item: any, price: number) {
    item.costo_extra = price;
  }

  // ==========================================
  // FINAL SAVE
  // ==========================================

  saveAll() {
    // Validate Basic Info
    if (
      !this.menuBasicInfo.nombre_menu ||
      this.menuBasicInfo.precio_menu <= 0
    ) {
      alert("Por favor completa el nombre del vaso y el precio base.");
      return;
    }

    if (!this.menuBasicInfo.id_categoria_menu) {
      alert("Por favor selecciona una categoría para el menú.");
      return;
    }

    if (this.isUploadingMenuImage()) {
      this.triggerNotification(
        "Espera a que la imagen del vaso termine de subir",
        "error",
      );
      return;
    }

    this.isSaving.set(true);

    const sanitizedMenuImage = this.sanitizeImageUrl(this.menuImageUrl());
    this.menuBasicInfo.url_foto = sanitizedMenuImage;

    const menuData: MenuCreateDto = {
      nombre_menu: this.menuBasicInfo.nombre_menu,
      precio_menu: this.menuBasicInfo.precio_menu,
      id_categoria_menu: this.menuBasicInfo.id_categoria_menu!, // Asserting non-null as validation should happen before
      url_foto: sanitizedMenuImage,
    };

    if (this.isEditMode() && this.menuId()) {
      // UPDATE
      this.menuConfigService.updateMenu(this.menuId()!, menuData).subscribe({
        next: (res) => {
          if (res.success) {
            this.saveRules(this.menuId()!);
          } else {
            this.triggerNotification("Error al actualizar el menú", "error");
            this.isSaving.set(false);
          }
        },
        error: () => {
          this.triggerNotification("Error de conexión al actualizar", "error");
          this.isSaving.set(false);
        },
      });
    } else {
      // CREATE
      this.menuConfigService.createMenu(menuData).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const newMenuId = res.data.id_menu;
            this.saveRules(newMenuId);
          } else {
            this.triggerNotification("Error al crear el menú", "error");
            this.isSaving.set(false);
          }
        },
        error: () => {
          this.triggerNotification(
            "Error de conexión al crear el menú",
            "error",
          );
          this.isSaving.set(false);
        },
      });
    }
  }

  private saveRules(menuId: number) {
    const rulePromises: Promise<any>[] = [];

    this.configState.forEach((config, catId) => {
      const payload: RuleCreateDto = {
        id_menu: menuId,
        id_categoria: catId,
        cant_gratis: config.cant_gratis,
        costo_extra: config.costo_extra,
        combinacion: config.combinacion,
        detalles: config.ingredients
          .filter((i) => i.selected)
          .map((i) => ({
            id_ingrediente: i.id_ingrediente,
            costo_extra: i.costo_extra,
          })),
      };

      const p = new Promise((resolve) => {
        if (config.id_regla) {
          // UPDATE EXISTING RULE
          this.menuConfigService
            .updateRegla(config.id_regla, payload)
            .subscribe({
              next: () => resolve(true),
              error: () => resolve(false),
            });
        } else {
          // CREATE NEW RULE
          this.menuConfigService.createRegla(payload).subscribe({
            next: () => resolve(true),
            error: () => resolve(false),
          });
        }
      });
      rulePromises.push(p);
    });

    Promise.all(rulePromises).then(() => {
      this.isSaving.set(false);
      this.triggerNotification(
        this.isEditMode()
          ? "Menú actualizado correctamente"
          : "Menú creado correctamente",
      );
      setTimeout(() => {
        this.router.navigate(["/"]);
      }, 1000);
    });
  }

  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================

  openCategoryModal(category?: Category) {
    this.editingItem.set(category || null);
    this.modalInputValue.set(category ? category.nombre_categoria : "");
    this.showCategoryModal.set(true);
  }

  saveCategory() {
    const name = this.modalInputValue();
    if (!name) return;

    if (this.editingItem()) {
      // Update
      this.menuConfigService
        .updateCategoria(this.editingItem().id_categoria, {
          nombre_categoria: name,
        })
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.loadCategories();
              this.showCategoryModal.set(false);
            }
          },
        });
    } else {
      // Create
      this.menuConfigService
        .createCategoria({ nombre_categoria: name })
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.loadCategories();
              this.showCategoryModal.set(false);
            }
          },
        });
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`¿Desactivar categoría "${category.nombre_categoria}"?`)) {
      this.menuConfigService.deleteCategoria(category.id_categoria).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadCategories();
            if (
              this.selectedCategory()?.id_categoria === category.id_categoria
            ) {
              this.selectedCategory.set(null);
            }
          }
        },
      });
    }
  }

  // ==========================================
  // INGREDIENT MANAGEMENT
  // ==========================================

  private resetIngredientImageState(url: string | null = null) {
    const sanitizedUrl = this.sanitizeImageUrl(url);
    this.ingredientImageUrl.set(sanitizedUrl);
    this.ingredientImagePreview.set(sanitizedUrl);
    this.isUploadingImage.set(false);
    this.isDraggingFile.set(false);
  }

  private sanitizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/\\/g, "");
  }

  private isValidImageFile(file: File): boolean {
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    const extension = file.name?.split(".").pop()?.toLowerCase() ?? "";
    const isValid =
      file.type.startsWith("image/") || allowedExtensions.includes(extension);

    if (!isValid) {
      this.triggerNotification(
        "Selecciona un archivo de imagen válido (JPG, PNG o WEBP)",
        "error",
      );
    }
    return isValid;
  }

  private resetMenuImageState(url: string | null = null) {
    const sanitizedUrl = this.sanitizeImageUrl(url);
    this.menuImageUrl.set(sanitizedUrl);
    this.menuImagePreview.set(sanitizedUrl);
    this.menuBasicInfo.url_foto = sanitizedUrl;
    this.isUploadingMenuImage.set(false);
    this.isDraggingMenuFile.set(false);
  }

  onMenuImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.processMenuImageFile(file);
    }
    if (input) {
      input.value = "";
    }
  }

  handleMenuImageDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    if (!this.isDraggingMenuFile()) {
      this.isDraggingMenuFile.set(true);
    }
  }

  handleMenuImageDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const current = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement | null;
    if (current && related && current.contains(related)) {
      return;
    }
    this.isDraggingMenuFile.set(false);
  }

  handleMenuImageDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingMenuFile.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.processMenuImageFile(file);
  }

  private processMenuImageFile(file: File) {
    if (!this.isValidImageFile(file)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.menuImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.isUploadingMenuImage.set(true);

    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url) => {
        if (url) {
          const sanitized = this.sanitizeImageUrl(url);
          this.menuImageUrl.set(sanitized);
          this.menuImagePreview.set(sanitized);
          this.menuBasicInfo.url_foto = sanitized;
          this.triggerNotification("Imagen del menú subida correctamente");
        } else {
          this.triggerNotification(
            "No se recibió una URL válida desde Cloudinary",
            "error",
          );
        }
        this.isUploadingMenuImage.set(false);
      },
      error: () => {
        this.isUploadingMenuImage.set(false);
        this.triggerNotification("Error al subir la imagen del menú", "error");
      },
    });
  }

  removeMenuImage() {
    if (this.isUploadingMenuImage()) return;
    this.resetMenuImageState(null);
  }

  closeIngredientModal() {
    this.showIngredientModal.set(false);
    this.editingItem.set(null);
    this.modalInputValue.set("");
    this.resetIngredientImageState(null);
  }

  onIngredientImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.processIngredientImageFile(file);
    }

    if (input) {
      input.value = "";
    }
  }

  handleImageDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    if (!this.isDraggingFile()) {
      this.isDraggingFile.set(true);
    }
  }

  handleImageDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const current = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement | null;
    if (current && related && current.contains(related)) {
      return; // Still inside the drop zone
    }
    this.isDraggingFile.set(false);
  }

  handleIngredientImageDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.processIngredientImageFile(file);
  }

  private processIngredientImageFile(file: File) {
    if (!this.isValidImageFile(file)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      this.ingredientImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.isUploadingImage.set(true);

    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url) => {
        if (url) {
          const sanitized = this.sanitizeImageUrl(url);
          this.ingredientImageUrl.set(sanitized);
          this.ingredientImagePreview.set(sanitized);
          this.triggerNotification("Imagen subida correctamente");
        } else {
          this.triggerNotification(
            "No se recibió una URL válida desde Cloudinary",
            "error",
          );
        }
        this.isUploadingImage.set(false);
      },
      error: () => {
        this.isUploadingImage.set(false);
        this.triggerNotification("Error al subir la imagen", "error");
      },
    });
  }

  removeIngredientImage() {
    if (this.isUploadingImage()) return;
    this.resetIngredientImageState(null);
  }

  openIngredientModal(ingredient?: any) {
    this.editingItem.set(ingredient || null);
    this.modalInputValue.set(ingredient ? ingredient.nombre : "");
    this.resetIngredientImageState(
      this.sanitizeImageUrl(ingredient?.url_foto || null),
    );
    this.showIngredientModal.set(true);
  }

  saveIngredient() {
    const name = this.modalInputValue();
    const currentCat = this.selectedCategory();
    if (!name || !currentCat) return;

    if (this.isUploadingImage()) {
      this.triggerNotification(
        "Espera a que la imagen termine de subir antes de guardar",
        "error",
      );
      return;
    }

    const imageUrl = this.sanitizeImageUrl(
      this.ingredientImageUrl() ?? this.editingItem()?.url_foto ?? null,
    );
    const payload = {
      nombre_ingrediente: name,
      id_categoria: currentCat.id_categoria,
      url_foto: imageUrl,
    };

    if (this.editingItem()) {
      // Update
      this.menuConfigService
        .updateIngrediente(this.editingItem().id_ingrediente, payload)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.reloadIngredients(currentCat);
              this.closeIngredientModal();
            }
          },
        });
    } else {
      // Create
      this.menuConfigService.createIngrediente(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.reloadIngredients(currentCat);
            this.closeIngredientModal();
          }
        },
      });
    }
  }

  deleteIngredient(ingredient: any) {
    // Note: Use delete endpoint to deactivate
    if (
      confirm(
        `¿${ingredient.disponible ? "Desactivar" : "Activar"} disponibilidad de "${ingredient.nombre}"?`,
      )
    ) {
      // Since we only have DELETE to deactivate, and no explicit endpoint documented to Activate in this prompt
      // (usually standard CRUD is PUT to reactivate or toggle), I will use DELETE as requested for now.
      // But for "toggling" visual state in this view before saving the menu, we might just be toggling the 'disponible' flag
      // However, the prompt says "Checkboxes to activate/deactivate in this specific menu" which is the table checkbox.
      // The badge is global status.
      // Assuming DELETE soft-deletes (sets status = false).

      this.menuConfigService
        .deleteIngrediente(ingredient.id_ingrediente)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.reloadIngredients(this.selectedCategory()!);
            }
          },
        });
    }
  }

  // Helper to refresh ingredients keeping user selection
  private reloadIngredients(category: Category) {
    this.menuConfigService
      .getIngredientesByCategoria(category.id_categoria)
      .subscribe({
        next: (res) => {
          if (res.success) {
            const catId = category.id_categoria;
            const currentConf = this.configState.get(catId);

            // Map new ingredients but PRESERVE selected state and prices from draft config
            const mergedIngredients = res.data.map((serverIng) => {
              const existingDraft = currentConf?.ingredients.find(
                (d) => d.id_ingrediente === serverIng.id_ingrediente,
              );
              return {
                id_ingrediente: serverIng.id_ingrediente,
                nombre: serverIng.nombre_ingrediente,
                selected: existingDraft ? existingDraft.selected : false,
                costo_extra: existingDraft ? existingDraft.costo_extra : 0,
                disponible: serverIng.estado ?? true,
                url_foto: this.sanitizeImageUrl(
                  existingDraft?.url_foto ?? serverIng.url_foto ?? null,
                ),
              };
            });

            if (currentConf) {
              currentConf.ingredients = mergedIngredients;
              this.configState.set(catId, currentConf);
            } else {
              // Should not happen if we are reloading active category
            }
          }
        },
      });
  }
}
