import { Prisma } from "@prisma/client";

export function toDate(value: any): Date | null {
  if (!value) return null;

  // Firestore Timestamp object
  if (typeof value?.toDate === "function") return value.toDate();

  // ISO string (e.g. "2025-07-22T12:11:16.370Z")
  if (typeof value === "string") return new Date(value);

  // Already a JS Date
  if (value instanceof Date) return value;

  return null;
}

export function toDecimal(value: any): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") return new Prisma.Decimal(value.toFixed(2));
  if (typeof value === "string") return new Prisma.Decimal(value);

  return null;
}

export function toInt(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function toBool(value: any, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}
