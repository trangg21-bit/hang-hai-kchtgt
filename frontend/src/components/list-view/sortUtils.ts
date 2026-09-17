export type TableSortOrder = 'ascend' | 'descend' | null | undefined;

/** Advances a server-side table column through ascending, descending, then default order. */
export function getNextSortOrder(currentOrder: TableSortOrder): 'asc' | 'desc' | null {
  if (currentOrder === 'ascend') return 'desc';
  if (currentOrder === 'descend') return null;
  return 'asc';
}
