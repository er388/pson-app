import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function matchesSearch(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const words = q.split(/\s+/);
  const t = text.toLowerCase();
  return words.every(w => t.includes(w));
}