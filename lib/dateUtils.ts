/**
 * Utilidades para formateo de fechas sin causar hydration mismatch
 * Usa formato ISO y conversión manual para evitar diferencias entre servidor y cliente
 */

/**
 * Formatea una fecha en formato dd/mm/yyyy
 * @param dateString - String de fecha ISO
 * @returns Fecha formateada
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Formatea una fecha en formato largo (1 de enero de 2024)
 * @param dateString - String de fecha ISO
 * @returns Fecha formateada
 */
export function formatDateLong(dateString: string): string {
  try {
    const date = new Date(dateString);
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Formatea una hora en formato 24h (14:30)
 * @param dateString - String de fecha ISO
 * @returns Hora formateada
 */
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Formatea una fecha y hora juntas (01/12/2024 14:30)
 * @param dateString - String de fecha ISO
 * @returns Fecha y hora formateadas
 */
export function formatDateTime(dateString: string): string {
  try {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Formatea una fecha relativa (hace 2 días, hace 3 horas, etc.)
 * @param dateString - String de fecha ISO
 * @returns Fecha relativa formateada
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'hace un momento';
    } else if (diffMin < 60) {
      return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
    } else if (diffHour < 24) {
      return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
    } else if (diffDay < 30) {
      return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    return dateString;
  }
}
