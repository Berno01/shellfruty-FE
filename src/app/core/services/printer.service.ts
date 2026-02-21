import { Injectable } from "@angular/core";
import { VentaDetalle } from "../../features/ventas/models/venta.models";

/**
 * PrinterService — Impresora térmica SAT 80 mm
 *
 * Genera un ticket de texto plano formateado para papel de 80 mm (48 chars),
 * lo codifica en base64 UTF-8 seguro y lo envía a RawBT via deep link.
 *
 * En tablet Android con RawBT instalado: imprime directo por USB OTG.
 * En PC / dispositivos sin RawBT: el error se captura silenciosamente.
 */
@Injectable({
  providedIn: "root",
})
export class PrinterService {
  /**
   * Ancho en caracteres para papel de 80 mm con fuente estándar.
   * Impresora SAT 80 mm → 48 chars por línea.
   */
  private readonly LINE_WIDTH = 48;

  // Columnas de la tabla de productos (deben sumar LINE_WIDTH)
  // | PRODUCTO (26) | CANT (4) |  | P.UNIT (8) |  | TOTAL (8) |
  private readonly COL_NAME  = 26; // Nombre del producto
  private readonly COL_QTY   = 4;  // Cantidad
  private readonly COL_UNIT  = 8;  // Precio unitario "00.00 Bs"  (sin espacio Bs. queda bien)
  private readonly COL_TOTAL = 8;  // Subtotal "000.00 Bs"
  // 26 + 1 + 4 + 1 + 8 + 1 + 8 = 49 → usar separador compacto: 26+1+4+1+8+8 = 48 ✓

  /**
   * Genera el ticket y lo envía a RawBT.
   *
   * @param venta          Detalle completo de la venta (respuesta de la API)
   * @param sucursalNombre Nombre legible de la sucursal
   */
  printReceipt(venta: VentaDetalle, sucursalNombre: string = ""): void {
    try {
      const ticket = this.buildTicket(venta, sucursalNombre);
      const base64 = this.toBase64UTF8(ticket);
      window.location.href = "rawbt:base64," + base64;
    } catch (error) {
      // Fallback silencioso: en PC/dispositivos sin RawBT la app no se rompe
      console.warn(
        "[PrinterService] RawBT no disponible o error al imprimir:",
        error,
      );
    }
  }

  // ─────────────────── Construcción del ticket ───────────────────

  private buildTicket(venta: VentaDetalle, sucursalNombre: string): string {
    const lw   = this.LINE_WIDTH;
    const sep  = "=".repeat(lw);
    const dash = "-".repeat(lw);

    const fecha  = this.formatFecha(venta.fecha);
    const cajero = venta.username ?? "Desconocido";

    const lines: string[] = [];

    // ── Encabezado ──────────────────────────────────────────────
    lines.push(sep);
    lines.push(this.center("SHELLFRUTY", lw));
    if (sucursalNombre) lines.push(this.center(sucursalNombre, lw));
    lines.push(this.center("Punto de Venta", lw));
    lines.push(sep);

    lines.push(this.row("Fecha:",    fecha,               lw));
    lines.push(this.row("Cajero:",   cajero,              lw));
    lines.push(this.row("Venta N°:", String(venta.id_venta), lw));
    lines.push(dash);

    // ── Tabla de productos ───────────────────────────────────────
    lines.push(this.tableHeader());
    lines.push(dash);

    for (const detalle of venta.detalles) {
      lines.push(
        ...this.tableRow(
          detalle.nombre_menu,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.total,
        ),
      );
    }

    lines.push(dash);

    // ── Totales ──────────────────────────────────────────────────
    // Separador visual antes de los totales
    if (venta.monto_efectivo > 0 && venta.monto_qr > 0) {
      lines.push(this.row("  Efectivo:",    this.fmt(venta.monto_efectivo), lw));
      lines.push(this.row("  QR/Transfer:", this.fmt(venta.monto_qr),       lw));
      lines.push(dash);
    } else if (venta.monto_qr > 0) {
      lines.push(this.row("  QR/Transfer:", this.fmt(venta.monto_qr), lw));
      lines.push(dash);
    }

    lines.push(this.row("*** TOTAL:", this.fmt(venta.total), lw));

    // ── Pie de ticket ────────────────────────────────────────────
    lines.push(sep);
    lines.push(this.center("¡Gracias por su compra!", lw));
    lines.push(this.center("Vuelva pronto :)", lw));
    lines.push(sep);

    // Avance de papel para el corte (SAT recomienda 3-5 saltos extra)
    lines.push("\n\n\n\n\n");

    return lines.join("\n");
  }

  // ─────────────────── Encabezado y filas de tabla ───────────────

  /**
   * Cabecera de columnas:
   * PRODUCTO              CANT  P.UNIT  TOTAL
   * 26 chars              4     8       8  = 46 + 2 espacios = 48
   */
  private tableHeader(): string {
    const name  = "PRODUCTO".padEnd(this.COL_NAME);
    const qty   = "CANT".padStart(this.COL_QTY);
    const unit  = "P.UNIT".padStart(this.COL_UNIT);
    const total = "TOTAL".padStart(this.COL_TOTAL);
    return `${name} ${qty} ${unit}${total}`;
  }

  /**
   * Genera las líneas de una fila de producto.
   * La primera línea tiene todos los valores; si el nombre es largo
   * las líneas de continuación solo muestran el texto sobrante.
   */
  private tableRow(
    nombre: string,
    cantidad: number,
    precioUnit: number,
    total: number,
  ): string[] {
    const qtyStr  = String(cantidad).padStart(this.COL_QTY);
    const unitStr = this.fmt(precioUnit).padStart(this.COL_UNIT);
    const totStr  = this.fmt(total).padStart(this.COL_TOTAL);
    const right   = ` ${qtyStr} ${unitStr}${totStr}`;
    // right.length = 1 + 4 + 1 + 8 + 8 = 22  →  nameWidth = 48 - 22 = 26 ✓

    const lines: string[] = [];
    const chunk = this.COL_NAME;

    // Primera línea
    lines.push(nombre.substring(0, chunk).padEnd(chunk) + right);

    // Wrap si el nombre supera el ancho de columna
    let rest = nombre.substring(chunk);
    while (rest.length > 0) {
      lines.push("  " + rest.substring(0, chunk - 2));
      rest = rest.substring(chunk - 2);
    }

    return lines;
  }

  // ─────────────────── Helpers genéricos ─────────────────────────

  private center(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return " ".repeat(pad) + text;
  }

  /** Label izquierda, valor derecha */
  private row(label: string, value: string, width: number): string {
    const space = width - label.length - value.length;
    if (space <= 0) return (label + " " + value).substring(0, width);
    return label + " ".repeat(space) + value;
  }

  /** Formatea un monto como "000.00 Bs." */
  private fmt(monto: number): string {
    return monto.toFixed(2) + " Bs.";
  }

  /** "DD/MM/YYYY HH:MM" desde fecha ISO */
  private formatFecha(isoDate: string): string {
    try {
      const d = new Date(isoDate);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
    } catch {
      return isoDate;
    }
  }

  /**
   * btoa() seguro para UTF-8 (tildes, ñ, etc.).
   * unescape(encodeURIComponent()) re-codifica a Latin-1 antes de btoa.
   */
  private toBase64UTF8(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }
}
