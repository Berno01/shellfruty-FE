
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { UserResponse } from '../models/user-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private readonly storageKey = 'currentUser';
  private readonly apiUrl = environment.apiUrl + 'usuario/login';
  private _user$ = new BehaviorSubject<UserResponse | null>(this.getUserFromStorage());

  get user$() {
    return this._user$.asObservable();
  }

  private getUserFromStorage(): UserResponse | null {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserResponse;
    } catch {
      return null;
    }
  }

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Devuelve el usuario actual desde localStorage, o null si no hay sesión.
   */
  get currentUser(): UserResponse | null {
    return this._user$.value;
  }

  /**
   * Actualiza la sucursal activa del usuario (solo para admins)
   * Esto afecta a toda la aplicación: navbar, nueva venta, filtros, etc.
   */
  setActiveSucursal(idSucursal: number, nombreSucursal?: string): void {
    const user = this.currentUser;
    if (!user) return;
    const updatedUser: UserResponse = {
      ...user,
      id_sucursal: idSucursal,
      nombre_sucursal: nombreSucursal ?? user.nombre_sucursal,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(updatedUser));
    this._user$.next(updatedUser);
  }

  login(username: string, password: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, { username, password }).pipe(
      tap(user => {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        this._user$.next(user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this._user$.next(null);
    this.router.navigate(['/login']);
  }

}
