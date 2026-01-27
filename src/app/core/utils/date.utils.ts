/**
 * Utilidades para manejo de fechas en timezone de Bolivia/Tarija (UTC-4)
 */

/**
 * Obtiene la fecha actual en Bolivia/Tarija timezone formateada como YYYY-MM-DD
 * @returns string - Fecha en formato YYYY-MM-DD
 */
export function getTodayBolivia(): string {
  // Bolivia/Tarija está en UTC-4 (sin horario de verano)
  const UTC_OFFSET_BOLIVIA = -4;

  const now = new Date();

  // Obtener timestamp en UTC
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

  // Aplicar offset de Bolivia
  const boliviaTime = new Date(utcTime + UTC_OFFSET_BOLIVIA * 3600000);

  return formatDateToYYYYMMDD(boliviaTime);
}

/**
 * Formatea una fecha a formato YYYY-MM-DD
 * @param date - Fecha a formatear
 * @returns string - Fecha en formato YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a objeto Date
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date
 */
export function parseYYYYMMDD(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Obtiene el primer día del mes actual en Bolivia
 * @returns string - Fecha en formato YYYY-MM-DD
 */
export function getFirstDayOfMonthBolivia(): string {
  const today = getTodayBolivia();
  const [year, month] = today.split("-");
  return `${year}-${month}-01`;
}

/**
 * Valida que fecha_fin sea mayor o igual a fecha_inicio
 * @param inicio - Fecha inicio YYYY-MM-DD
 * @param fin - Fecha fin YYYY-MM-DD
 * @returns boolean
 */
export function isValidDateRange(inicio: string, fin: string): boolean {
  const dateInicio = parseYYYYMMDD(inicio);
  const dateFin = parseYYYYMMDD(fin);
  return dateFin >= dateInicio;
}
