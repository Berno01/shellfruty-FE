import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet, Router } from "@angular/router";
import { ShellNavbarComponent } from "./shared/components/navbar/shell-navbar.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, ShellNavbarComponent],
  template: `
    <app-navbar *ngIf="!isLoginRoute()"></app-navbar>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = "shellfruty-front";
  constructor(private router: Router) {}
  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
