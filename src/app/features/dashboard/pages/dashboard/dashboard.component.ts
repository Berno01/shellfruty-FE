import { Component, computed, effect, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DashboardService } from "../../services/dashboard.service";
import {
  SucursalService,
  Sucursal,
} from "../../../../core/services/sucursal.service";
import {
  DashboardFilters,
  DashboardGraphs,
  DashboardKeys,
  IngredientesPorCategoria,
  MenuMasVendido,
  HoraConcurrida,
} from "../../models/dashboard.models";
import { getTodayBolivia } from "../../../../core/utils/date.utils";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./dashboard.component.html",
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private sucursalService = inject(SucursalService);

  // --- State Signals ---
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filters
  sucursales = signal<Sucursal[]>([]);
  selectedSucursalId = signal<number | undefined>(undefined);

  // Date Management
  // Default to today
  dateMode = signal<"single" | "range">("single");
  startDate = signal<string>(getTodayBolivia());
  endDate = signal<string>(getTodayBolivia());

  // Data
  keys = signal<DashboardKeys | null>(null);
  graphs = signal<DashboardGraphs | null>(null);

  // --- Computed for Charts ---

  // 1. Hours Chart (Area/Line)
  hoursChartPath = computed(() => {
    const defaultResult = { line: "", area: "" };
    const data = this.graphs()?.horas_concurridas || [];
    if (data.length === 0) return defaultResult;

    // Sort by hour 0-23
    const sorted = [...data].sort((a, b) => a.hora - b.hora);

    // Fill missing hours with 0 for smoother graph
    const allHours: HoraConcurrida[] = [];
    for (let i = 7; i <= 22; i++) {
      // Show likely business hours 7am - 10pm
      const found = sorted.find((h) => h.hora === i);
      allHours.push(found || { hora: i, cantidad: 0 });
    }

    const maxVal = Math.max(...allHours.map((h) => h.cantidad), 5); // min scale 5
    const width = 1000; // viewBox width
    const height = 300; // viewBox height
    const stepX = width / (allHours.length - 1);

    // Coordinate mapping
    const points = allHours.map((h, i) => {
      const x = i * stepX;
      const y = height - (h.cantidad / maxVal) * (height * 0.8) - 20; // 20px padding bottom
      return { x, y };
    });

    // Generate Smooth Path (Catmull-Rom or Simple Bezier)
    if (points.length === 0) return defaultResult;

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      // Simple cubic bezier using midpoints
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2; // Control point X is same for smooth s-curve
      const cp2y = p1.y;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Close path for area fill
    const areaPath = `${d} L ${width} ${height} L 0 ${height} Z`;

    // Return both for usage: { line: d, area: areaPath }
    return { line: d, area: areaPath };
  });

  // 2. Max Value for Bars
  maxMenuSold = computed(() => {
    const menus = this.graphs()?.menus_mas_vendidos || [];
    if (menus.length === 0) return 10;
    return Math.max(...menus.map((m) => parseInt(m.cantidad)));
  });

  // 3. Category Splitters
  primaryCategories = computed(() => {
    const cats = this.graphs()?.ingredientes_por_categoria || [];
    return cats.slice(0, 2);
  });

  secondaryCategories = computed(() => {
    const cats = this.graphs()?.ingredientes_por_categoria || [];
    return cats.slice(2);
  });

  constructor() {
    this.loadSucursales();

    // Effect API call on filter changes
    effect(() => {
      // Dependencies
      const start = this.startDate();
      const end = this.endDate();
      const sucursal = this.selectedSucursalId();

      // Validation: if range mode, ensure integrity
      if (this.dateMode() === "range" && start > end) return;

      this.fetchData();
    });
  }

  loadSucursales() {
    this.sucursalService.loadSucursales().subscribe({
      next: (response) => {
        if (response.success) this.sucursales.set(response.data);
      },
    });
  }

  parseInt(val: string): number {
    return parseInt(val, 10);
  }

  fetchData() {
    this.loading.set(true);
    const filters: DashboardFilters = {
      fecha_inicio: this.startDate(),
      fecha_fin:
        this.dateMode() === "single" ? this.startDate() : this.endDate(),
      id_sucursal: this.selectedSucursalId(),
    };

    // remove id_sucursal if undefined/null or "0" (if using "Todas" as 0)
    if (!filters.id_sucursal) delete filters.id_sucursal;

    Promise.all([
      new Promise((resolve) =>
        this.dashboardService.getDashboardKeys(filters).subscribe((res) => {
          this.keys.set(res);
          resolve(true);
        }),
      ),
      new Promise((resolve) =>
        this.dashboardService.getDashboardGraphs(filters).subscribe((res) => {
          this.graphs.set(res);
          resolve(true);
        }),
      ),
    ]).finally(() => {
      this.loading.set(false);
    });
  }

  toggleDateMode() {
    if (this.dateMode() === "single") {
      this.dateMode.set("range");
      // Set end date same as start initially
      this.endDate.set(this.startDate());
    } else {
      this.dateMode.set("single");
    }
  }

  // --- Helpers for Charts ---

  // Donut Chart Calculator
  getDonutSegments(
    ingredientes: { nombre_ingrediente: string; cantidad: number }[],
  ) {
    const total = ingredientes.reduce((sum, item) => sum + item.cantidad, 0);
    let cumulativePercent = 0;
    const colors = ["#eaa6b6", "#fbcfe8", "#cbd5e1", "#94a3b8", "#64748b"];

    return ingredientes.map((item, index) => {
      const percent = total === 0 ? 0 : item.cantidad / total;

      // Circumference ~100 for r=15.9155
      // dashArray: "length gap" -> "percent*100 (100-percent*100)"
      const filled = percent * 100;
      const empty = 100 - filled;

      const dashArray = `${filled} ${empty}`;
      // Rotation: Start at -90 (top), plus cumulative * 360
      const rotation = cumulativePercent * 360 - 0; // The SVG transform handles the -90 via rotation or I do it here

      // In CSS/SVG transform: rotate(-90deg) is base.
      // So here we just need the offset in degrees.

      cumulativePercent += percent;

      return {
        ...item,
        percent: Math.round(percent * 100),
        dashArray,
        rotation: rotation, // This will be added to the -90 base
        color: colors[index % colors.length],
      };
    });
  }
}
