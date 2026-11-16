import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decodes a dynamic route segment. Depending on how the page was reached
 * (prerendered, ISR, client navigation) Next can hand over the segment
 * encoded once or twice ("Aula%2012" or "Aula%252012"), so decode until the
 * value stops changing. Room and professor names never contain a literal
 * "%", so this cannot over-decode real names.
 */
export function decodeRouteParam(value: string): string {
  let current = value;
  for (let i = 0; i < 3 && current.includes("%"); i++) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}
