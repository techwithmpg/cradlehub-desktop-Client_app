/**
 * Calculates adaptive table page size based on available container height.
 */
export function calculateAdaptivePageSize(
  containerHeight: number,
  rowHeight: number = 48,
  tableHeaderHeight: number = 36,
  minRows: number = 3,
  maxRows: number = 8,
): number {
  if (containerHeight <= 0) return 5;
  const availableForRows = Math.max(0, containerHeight - tableHeaderHeight);
  const calculated = Math.floor(availableForRows / rowHeight);
  return Math.min(maxRows, Math.max(minRows, calculated));
}
