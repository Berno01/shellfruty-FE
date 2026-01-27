import { Routes } from "@angular/router";
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: "", redirectTo: "menu", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login.component").then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: "dashboard",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/dashboard/pages/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: "menu",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/menu/menu.component").then((m) => m.MenuComponent),
  },
  {
    path: "menu/create",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/menu/pages/menu-create/menu-create.component").then(
        (m) => m.MenuCreateComponent,
      ),
  },
  {
    path: "menu/edit/:id",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/menu/pages/menu-create/menu-create.component").then(
        (m) => m.MenuCreateComponent,
      ),
  },
  // Ventas routes
  {
    path: "ventas/nueva",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/ventas/pages/nueva-venta/nueva-venta.component").then(
        (m) => m.NuevaVentaComponent,
      ),
  },
  {
    path: "ventas/editar/:id",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/ventas/pages/nueva-venta/nueva-venta.component").then(
        (m) => m.NuevaVentaComponent,
      ),
  },
  {
    path: "ventas",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./features/ventas/ventas.component").then(
        (m) => m.VentasComponent,
      ),
  },
  // Placeholder routes
  { path: "reportes", redirectTo: "menu" },
];
