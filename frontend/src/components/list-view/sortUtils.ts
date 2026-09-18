export type TableSortOrder = 'ascend' | 'descend' | null | undefined;

/** Advances a server-side table column through ascending, descending, then default order. */
export function getNextSortOrder(currentOrder: TableSortOrder): 'asc' | 'desc' | null {
  if (currentOrder === 'ascend') return 'desc';
  if (currentOrder === 'descend') return null;
  return 'asc';
}

export interface SortableColumnIdentity {
  key?: string;
  dataIndex?: string;
}

/**
 * Resolve the page-defined sort field from an AntD sorter event.
 *
 * `columnKey` is the explicit column identity; `field` can be a derived
 * dataIndex and can briefly refer to the prior column in a controlled table.
 * Resolving against the declared columns prevents a composite column such as
 * "Cán bộ cập nhật" from falling back to Name/Code.
 */
export function resolveSortField(
  sorter: { columnKey?: unknown; field?: unknown },
  columns: readonly SortableColumnIdentity[] | undefined,
): string | undefined {
  const eventKey = typeof sorter.columnKey === 'string'
    ? sorter.columnKey
    : typeof sorter.field === 'string'
      ? sorter.field
      : undefined;
  if (!eventKey) return undefined;

  const sourceColumn = columns?.find(
    (column) => column.key === eventKey || column.dataIndex === eventKey,
  );
  return sourceColumn?.key ?? sourceColumn?.dataIndex;
}
