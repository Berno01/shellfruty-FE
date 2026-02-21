import { Injectable } from "@angular/core";
import { VentaDetalle } from "../../features/ventas/models/venta.models";

/**
 * PrinterService — Impresora termica SAT 80 mm
 *
 * Ticket de texto plano (48 chars) → base64 → RawBT deep link.
 * Todo el texto pasa por ascii() para quedarse en caracteres ASCII puro
 * (sin tildes, n~, signos invertidos) ya que la SAT usa CP437 y no UTF-8.
 */
@Injectable({
  providedIn: "root",
})
export class PrinterService {
  /** Papel 80 mm con fuente estandar = 48 caracteres por linea */
  private readonly LINE_WIDTH = 48;

  /**
   * Columnas de la tabla de productos.
   * NOMBRE(27) + sp(1) + CANT(4) + sp(1) + P/U(7) + sp(1) + TOTAL(7) = 48
   * Montos sin "Bs." en celdas para no desbordar (max "9999.99" = 7 chars).
   */
  private readonly COL_NAME  = 27;
  private readonly COL_QTY   = 4;
  private readonly COL_UNIT  = 7;
  private readonly COL_TOTAL = 7;

  // ─────────────────── API publica ───────────────────────────────

  printReceipt(venta: VentaDetalle, sucursalNombre: string = ""): void {
    try {
      const ticket = this.buildTicket(venta, sucursalNombre);
      const base64 = this.toBase64UTF8(ticket);
      window.location.href = "rawbt:base64," + base64;
    } catch (error) {
      console.warn("[PrinterService] RawBT no disponible:", error);
    }
  }

  // ─────────────────── Construccion del ticket ───────────────────

  private buildTicket(venta: VentaDetalle, sucursalNombre: string): string {
    const lw   = this.LINE_WIDTH;
    const sep  = "=".repeat(lw);
    const dash = "-".repeat(lw);
    const fecha = this.formatFecha(venta.fecha);

    const lines: string[] = [];

    // ── Encabezado compacto ──────────────────────────────────────
    lines.push(sep);
    lines.push(this.center("SHELLFRUTY", lw));
    if (sucursalNombre) {
      lines.push(this.center(this.ascii(sucursalNombre), lw));
    }
    lines.push(sep);

    // ── ID de venta prominente + fecha ───────────────────────────
    lines.push(this.center("# VENTA " + String(venta.id_venta), lw));
    lines.push(this.center(fecha, lw));
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
    if (venta.monto_efectivo > 0 && venta.monto_qr > 0) {
      lines.push(this.row("  Efectivo:", this.fmtBs(venta.monto_efectivo), lw));
      lines.push(this.row("  QR/Transfer:", this.fmtBs(venta.monto_qr), lw));
      lines.push(dash);
    } else if (venta.monto_qr > 0) {
      lines.push(this.row("  QR/Transfer:", this.fmtBs(venta.monto_qr), lw));
      lines.push(dash);
    }

    lines.push(this.row("*** TOTAL:", this.fmtBs(venta.total), lw));

    // ── Pie ──────────────────────────────────────────────────────
    lines.push(sep);
    lines.push(this.center("!Gracias por su compra case!", lw));
    lines.push(sep);

    // Avance de papel para corte SAT
    lines.push("\n\n\n\n\n");

    return lines.join("\n");
  }

  // ─────────────────── Tabla ─────────────────────────────────────

  /**
   * PRODUCTO                    CANT  P/UNIT   TOTAL
   * (27)                        (4)   (7)      (7)   = 48
   */
  private tableHeader(): string {
    const lw = this.LINE_WIDTH;
    const right =
      "CANT".padStart(this.COL_QTY) +
      " " +
      "P/UNIT".padStart(this.COL_UNIT) +
      " " +
      "TOTAL".padStart(this.COL_TOTAL);
    // right.length = 4+1+7+1+7 = 20  → name col = 48-1-20 = 27 ✓
    return "PRODUCTO".padEnd(lw - right.length - 1) + " " + right;
  }

  /**
   * Fila de producto. Montos solo numericos en celdas ("999.99"),
   * sin "Bs." para no desbordar. Wrap automatico del nombre.
   */
  private tableRow(
    nombre: string,
    cantidad: number,
    precioUnit: number,
    total: number,
  ): string[] {
    const qtyStr  = String(cantidad).padStart(this.COL_QTY);
    const unitStr = this.fmtNum(precioUnit).padStart(this.COL_UNIT);
    const totStr  = this.fmtNum(total).padStart(this.COL_TOTAL);
    const right   = " " + qtyStr + " " + unitStr + " " + totStr;
    // right.length = 1+4+1+7+1+7 = 21  →  nameCol = 48-21 = 27 ✓

    const nameClean = this.ascii(nombre);
    const chunk     = this.COL_NAME;
    const lines: string[] = [];

    lines.push(nameClean.substring(0, chunk).padEnd(chunk) + right);

    let rest = nameClean.substring(chunk);
    while (rest.length > 0) {
      lines.push("  " + rest.substring(0, chunk - 2));
      rest = rest.substring(chunk - 2);
    }

    return lines;
  }

  // ─────────────────── Helpers ───────────────────────────────────

  private center(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return " ".repeat(pad) + text;
  }

  private row(label: string, value: string, width: number): string {
    const space = width - label.length - value.length;
    if (space <= 0) return (label + " " + value).substring(0, width);
    return label + " ".repeat(space) + value;
  }

  /** Monto con "Bs." para filas de totales: "9999.99 Bs." (11 chars max) */
  private fmtBs(monto: number): string {
    return monto.toFixed(2) + " Bs.";
  }

  /** Monto solo numerico para celdas de tabla: "9999.99" (7 chars max) */
  private fmtNum(monto: number): string {
    return monto.toFixed(2);
  }

  /** DD/MM/YYYY HH:MM */
  private formatFecha(isoDate: string): string {
    try {
      const d  = new Date(isoDate);
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
   * Convierte caracteres no-ASCII a equivalentes seguros para CP437.
   * Imprescindible para impresoras termicas que no entienden UTF-8:
   *   n~ -> n,  tildes -> vocal sin tilde,  signos invertidos -> equivalente.
   */
  private ascii(text: string): string {
    return text
      .replace(/[áàäâã]/gi, (c) => (/[A-Z]/.test(c) ? "A" : "a"))
      .replace(/[éèëê]/gi,  (c) => (/[A-Z]/.test(c) ? "E" : "e"))
      .replace(/[íìïî]/gi,  (c) => (/[A-Z]/.test(c) ? "I" : "i"))
      .replace(/[óòöôõ]/gi, (c) => (/[A-Z]/.test(c) ? "O" : "o"))
      .replace(/[úùüû]/gi,  (c) => (/[A-Z]/.test(c) ? "U" : "u"))
      .replace(/[ñ]/g, "n")
      .replace(/[Ñ]/g, "N")
      .replace(/[¡]/g, "!")
      .replace(/[¿]/g, "?")
      .replace(/[°]/g, "#")
      .replace(/[«»""'']/g, '"')
      .replace(/[–—]/g, "-");
  }

  /**
   * btoa seguro para strings con caracteres fuera de Latin-1.
   * El ticket ya viene sanitizado por ascii() asi que esto es solo
   * un segundo nivel de seguridad.
   */
  private toBase64UTF8(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }
}
