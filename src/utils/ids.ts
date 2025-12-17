export function extractDocIdFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const parts = ref.split("/");
  return parts.length ? parts[parts.length - 1] : null;
}

export function saleItemId(saleId: string, index: number): string {
  return `${saleId}-item-${index}`;
}

export function returnItemId(returnId: string, index: number): string {
  return `${returnId}-item-${index}`;
}
