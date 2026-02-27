import { Injectable, OnDestroy } from "@angular/core";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";

/** ID de usuario del bot de WhatsApp en el backend */
export const BOT_USER_ID = 3;

/** Estructura exacta del payload que emite el servidor en el evento "nueva_venta" */
export interface NuevaVentaPayload {
  origen: string;        // "bot" cuando viene del bot de WhatsApp
  id_venta: number;
  total: number;
  fecha: string;         // "YYYY-MM-DD" o ISO
  id_sucursal: number;
  detalles: unknown[];   // array de ítems (no usado en la lista, sólo en detalle)
}

@Injectable({
  providedIn: "root",
})
export class VentasSocketService implements OnDestroy {
  private socket: Socket;

  /** Emite cada vez que el servidor envía el evento "nueva_venta" */
  readonly nuevaVenta$: Observable<NuevaVentaPayload>;

  constructor() {
    this.socket = io("http://132.145.165.40:3001", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on("connect", () =>
      console.log("[Socket] Conectado al servidor de ventas"),
    );
    this.socket.on("disconnect", (reason) =>
      console.warn("[Socket] Desconectado:", reason),
    );
    this.socket.on("connect_error", (err) =>
      console.error("[Socket] Error de conexión:", err.message),
    );

    this.nuevaVenta$ = new Observable<NuevaVentaPayload>((observer) => {
      const handler = (payload: NuevaVentaPayload) => observer.next(payload);
      this.socket.on("nueva_venta", handler);
      // Cleanup cuando el Observable se desuscribe
      return () => this.socket.off("nueva_venta", handler);
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
