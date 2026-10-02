import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pull a usable message off an unknown thrown value. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

/** The `name` of a thrown DOMException (e.g. "NotAllowedError"), else "". */
export function errorName(error: unknown): string {
  return error instanceof DOMException || error instanceof Error ? error.name : "";
}
