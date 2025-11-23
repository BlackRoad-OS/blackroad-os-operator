export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function toMs(value: number, unit: 'seconds' | 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'seconds':
      return value * SECOND;
    case 'minutes':
      return value * MINUTE;
    case 'hours':
      return value * HOUR;
    case 'days':
      return value * DAY;
    default:
      return value;
  }
}
