import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  constructor(private http: HttpClient) {}

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, {
      params,
      headers: this.headers,
    });
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  patch<T>(path: string, body: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  delete<T>(path: string, body?: any): Observable<T> {
    const options = body
      ? { body, headers: this.headers }
      : { headers: this.headers };
    return this.http.delete<T>(`${this.apiUrl}${path}`, options);
  }
}
