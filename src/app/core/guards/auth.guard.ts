import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const user = this.authService.currentUser;
    if (!user) {
      return this.router.createUrlTree(['/login']);
    }
    // Si es vendedor (id_rol === 2), solo puede acceder a /ventas
    if (user.id_rol === 2) {
      if (state.url.startsWith('/ventas')) {
        return true;
      } else {
        return this.router.createUrlTree(['/ventas']);
      }
    }
    // Otros roles: acceso normal
    return true;
  }
}
