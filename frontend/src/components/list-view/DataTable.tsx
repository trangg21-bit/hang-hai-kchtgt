/* eslint-disable @typescript-eslint/no-explicit-any -- DataTable is the adapter for heterogeneous Ant Design records and column renderers. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Table, Dropdown, Button, Empty } from 'antd';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { layout } from '../../theme';
import { tableSortIcon as defaultTableSortIcon } from '../../themetokenchk';
import { useThemeToken, THEME_SCOPE_CLASS, type ThemeToken } from '../../context/ThemeTokenContext';
import EmptyState from '../EmptyState';
import { extractHeaderLabel, isStatusOrConditionColumn } from './columnUtils';
import { getNextSortOrder, resolveSortField, type TableSortOrder } from './sortUtils';

const ACTION_COLUMN_WIDTH = 60;

/**
 * Bề rộng tối thiểu để tiêu đề một cột hiển thị đủ chữ, không bị cắt "...".
 *
 * Tiêu đề render ở `fontSizeMd` (13px), `fontWeightBold`, `textTransform: uppercase`.
 * Chữ hoa đậm 13px rộng trung bình ~8.8px (đã tính biên an toàn); dấu tiếng Việt không làm chữ rộng thêm.
 * Cộng padding ngang của ô tiêu đề (12px mỗi bên) và chỗ cho mũi tên sắp xếp.
 *
 * Có helper này thì màn hình không phải tự canh `width` cho vừa nhãn: cột luôn được nới
 * đủ rộng, nên bỏ được `textOverflow: 'ellipsis'` ở ô tiêu đề.
 */
const HEADER_CHAR_WIDTH = 8.8;
const HEADER_HORIZONTAL_PADDING = 24;
const HEADER_SORTER_WIDTH = 22;

function headerMinWidth(column: any): number {
  const label = extractHeaderLabel(column?.label ?? column?.title);
  if (!label) return 0;
  const isStatusOrCond = isStatusOrConditionColumn(column);
  const sorterSpace = (!isStatusOrCond && (column.sortable || column.sorter)) ? HEADER_SORTER_WIDTH : 0;
  const lines = label.split('\n');
  const maxLineLength = Math.max(...lines.map((l: string) => l.trim().length));
  return Math.ceil(maxLineLength * HEADER_CHAR_WIDTH) + HEADER_HORIZONTAL_PADDING + sorterSpace;
}

/** Nới `width` của cột lên tối thiểu bằng bề rộng tiêu đề của chính nó. */
function withHeaderSafeWidth(column: any): any {
  if (typeof column?.width !== 'number') return column;
  const required = headerMinWidth(column);
  return required > column.width ? { ...column, width: required } : column;
}

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function extractTextFromNode(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).filter(Boolean).join(' ').trim();
  }
  if (React.isValidElement(node)) {
    const type = node.type;
    const typeName = typeof type === 'string' ? type : (type as any)?.displayName || (type as any)?.name || '';
    if (/button|dropdown|input|select|checkbox|radio|icon/i.test(typeName)) {
      return '';
    }
    const props = node.props as any;
    if (props?.title && typeof props.title === 'string' && props.title.trim()) {
      return props.title.trim();
    }
    if (props?.children) {
      return extractTextFromNode(props.children);
    }
  }
  return '';
}

const actionColumnCellStyle: React.CSSProperties = {
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
  paddingInline: 0,
  textAlign: 'center',
  verticalAlign: 'middle',
  background: '#ffffff',
  zIndex: 15,
};

// Header cột action phải có cùng nền với header cột dữ liệu (t.tableHeaderBg).
const actionColumnHeaderCellStyleFor = (t: ThemeToken): React.CSSProperties => ({
  ...actionColumnCellStyle,
  background: t.tableHeaderBg,
  zIndex: 15,
});

export interface DataTableColumn {
  key?: string;
  label?: React.ReactNode;
  title?: React.ReactNode;
  sortable?: boolean;
  twoLine?: boolean;
  type?: 'text' | 'status' | 'action' | 'number' | 'date' | 'mono';
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index?: number) => React.ReactNode;
  dataIndex?: string;
  sorter?: boolean | ((a: any, b: any) => number);
  sortOrder?: 'ascend' | 'descend' | null;
  cellTitle?: ((record: any) => string) | ((value: any, record: any) => string) | string | false;
  fixed?: 'left' | 'right';
  /** Mặc định true (cắt chữ "..."); đặt false để header/cell wrap hiển thị đủ chữ. */
  ellipsis?: boolean;
  /**
   * Đặt true để bỏ cột khỏi bảng. Dùng khi bộ cột thay đổi theo ngữ cảnh — ví dụ
   * màn CHK ẩn cột "Trạng thái" ở mọi tab trừ tab "Tất cả". Cột bị ẩn không tính
   * vào tổng bề rộng nên scroll ngang vẫn khớp.
   */
  hidden?: boolean;
  /** Internal use only */
  isDummy?: boolean;
}

export interface DataTableProps {
  columns?: DataTableColumn[] | ColumnsType<any>;
  dataSource?: any[];
  rowKey?: string | ((record: any) => string);
  loading?: boolean;
  emptyState?: React.ReactNode;
  fill?: boolean;
  dense?: boolean;
  onSort?: (field: string, order: 'asc' | 'desc' | null) => void;
  rowActions?: (record: any) => { key: string; label: string; icon?: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }[];
  children?: React.ReactNode;
  scroll?: { x?: number | string; y?: number | string };
  resetScrollKey?: any;
  [key: string]: any;
}

const statusColorMapFor = (t: ThemeToken): Record<string, string> => ({
  active: t.statusOperational,
  operational: t.statusOperational,
  locked: t.statusCritical,
  rejected: t.statusCritical,
  inactive: t.statusDraft,
  draft: t.statusDraft,
  pending: t.statusAttention,
});

// Auto-close the row action menu when the page or the table body scrolls.
const RowActionDropdown: React.FC<{ items: MenuProps['items'] }> = ({ items }) => {
  const { rowActionButtonStyle } = useThemeToken();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnScroll = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && typeof t.closest === 'function' && t.closest('.ant-dropdown')) return;
      setOpen(false);
    };
    document.addEventListener('scroll', closeOnScroll, true);
    return () => document.removeEventListener('scroll', closeOnScroll, true);
  }, [open]);
  return (
    <Dropdown menu={{ items }} trigger={['click']} open={open} onOpenChange={setOpen}
      rootClassName={THEME_SCOPE_CLASS}>
      <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()}
        style={rowActionButtonStyle} />
    </Dropdown>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  columns: rawColumns, dataSource = [], rowKey = 'id', loading, emptyState, fill = true, dense, onSort, rowActions, children, scroll, resetScrollKey, ...rest
}) => {
  void fill;
  const t = useThemeToken();
  const {
    textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeSm, fontSizeMd, fontWeightBold,
    tableHeaderBg, tableHeaderPadding, tableCellPadding, tableRowStripeBg,
    tableSortableByDefault, tableSortIcon, tableEmptyState,
  } = t;
  const STATUS_COLOR_MAP = statusColorMapFor(t);
  const actionColumnHeaderCellStyle = actionColumnHeaderCellStyleFor(t);

  const tableShellRef = useRef<HTMLDivElement>(null);
  const isSortingRef = useRef(false);
  // Uncontrolled server-side sort state: holds active sort field & direction
  // when the list page supplies `onSort` but does not pass `sortOrder` on columns.
  const [serverSort, setServerSort] = useState<{ field?: string; order: TableSortOrder }>({ order: null });
  // Pages without an `onSort` callback use AntD's local comparator. Keep its
  // order controlled as well; otherwise AntD only cycles between two states
  // and never gives us a reliable third "clear sort" action.
  const [localSort, setLocalSort] = useState<{ field?: string; order: TableSortOrder }>({ order: null });
  const [measuredTableWidth, setMeasuredTableWidth] = useState<number>();
  const resolvedScroll = scroll;

  const resetHorizontalScroll = () => {
    tableShellRef.current?.querySelectorAll<HTMLElement>(
      '.ant-table-header, .ant-table-body, .ant-table-content, .ant-table-container, .ant-table, .ant-table-sticky-scroll',
    ).forEach((element) => {
      element.scrollLeft = 0;
      element.scrollTo?.({ left: 0, behavior: 'auto' });
    });
  };

  useEffect(() => {
    // Horizontal position belongs to the user's current table context. A
    // server-side sort also toggles `loading`; resetting on that transition
    // made a click on a right-hand header jump visually back to Name/Code.
    if (isSortingRef.current) {
      isSortingRef.current = false;
      return;
    }
    if (resetScrollKey !== undefined) {
      resetHorizontalScroll();
      const frameId = window.requestAnimationFrame(resetHorizontalScroll);
      const timer = setTimeout(resetHorizontalScroll, 100);
      return () => {
        window.cancelAnimationFrame(frameId);
        clearTimeout(timer);
      };
    }
  }, [resetScrollKey]);

  useLayoutEffect(() => {
    const shell = tableShellRef.current;
    if (!shell) return;

    const measureWidth = () => {
      const nextWidth = shell.clientWidth;
      if (nextWidth > 0) {
        setMeasuredTableWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
      }
    };

    measureWidth();
    const resizeObserver = new ResizeObserver(measureWidth);
    resizeObserver.observe(shell);
    return () => resizeObserver.disconnect();
  }, []);

  // Nới bề rộng cột cho vừa tiêu đề TRƯỚC mọi phép tính bề rộng phía dưới, để tổng bề
  // rộng bảng và scroll ngang khớp với bề rộng cột thực tế.
  const columns = useMemo(
    () => (rawColumns as any[] | undefined)
      ?.filter((column) => !column?.hidden)
      .map(withHeaderSafeWidth) as typeof rawColumns,
    [rawColumns],
  );

  // Trạng thái sort do page truyền vào là dữ liệu dẫn xuất, không đồng bộ ngược
  // bằng effect. Việc setState trong effect ở đây từng tạo vòng lặp render vô hạn
  // khi `rawColumns` được tạo lại, làm các màn quản lý KCHT không thể mở.
  const controlledServerSort = useMemo(() => {
    const activeColumn = (columns as DataTableColumn[] | undefined)?.find(
      (column) => !isStatusOrConditionColumn(column) && (column.sortOrder === 'ascend' || column.sortOrder === 'descend'),
    );
    if (activeColumn) {
      return {
        field: activeColumn.key ?? activeColumn.dataIndex,
        order: activeColumn.sortOrder,
      };
    }
    const hasExplicitNull = (columns as DataTableColumn[] | undefined)?.some(
      (column) => column.sortOrder === null,
    );
    return hasExplicitNull ? { order: null as TableSortOrder } : undefined;
  }, [columns]);
  const effectiveServerSort = controlledServerSort ?? serverSort;

  const hasFixedColumns = Boolean(columns?.some((c: any) => c.fixed));
  const hasGeneratedActionColumn = Boolean(
    rowActions && columns && !columns.some((column: any) => column.key === 'actions'),
  );
  const declaredColumnsWidth = columns?.reduce(
    (totalWidth: number, column: any) => totalWidth + (typeof column.width === 'number' ? column.width : 0),
    0,
  ) ?? 0;
  const totalDeclaredWidth = declaredColumnsWidth + (hasGeneratedActionColumn ? ACTION_COLUMN_WIDTH : 0);
  const numericScrollNeedsOverflow = typeof scroll?.x === 'number'
    && measuredTableWidth !== undefined
    && scroll.x > measuredTableWidth;
  const shouldStretchColumns = Boolean(
    columns?.length
      && measuredTableWidth
      && totalDeclaredWidth < measuredTableWidth
      && !numericScrollNeedsOverflow,
  );

  const resolvedScrollX = typeof scroll?.x === 'number'
    ? scroll.x
    : scroll?.x === 'max-content'
      ? Math.max(totalDeclaredWidth, measuredTableWidth ?? layout.listTableMinWidth)
      : (shouldStretchColumns || scroll?.x === '100%')
        ? (measuredTableWidth ?? layout.listTableMinWidth)
        : (scroll?.x ?? ((hasFixedColumns || hasGeneratedActionColumn) ? Math.max(totalDeclaredWidth, layout.listTableMinWidth) : undefined));

  const tableScroll = {
    ...scroll,
    x: resolvedScrollX,
  };
  const tableLayout = 'fixed' as const;

  if (children) {
    return (
      <div ref={tableShellRef} className="list-view-table-shell" style={{ width: '100%', minWidth: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {tableRowStripeBg !== 'transparent' && (
        <style>{`
          .list-view-row-stripe > td { background: ${tableRowStripeBg}; }
          .list-view-row-stripe > td.ant-table-cell-fix-left,
          .list-view-row-stripe > td.ant-table-cell-fix-right { background: ${tableRowStripeBg} !important; }
        `}</style>
      )}
        <Table dataSource={dataSource} rowKey={rowKey} loading={loading}
          rowClassName={(_: any, index: number) => (index % 2 === 1 ? 'list-view-row-stripe' : '')}
          className="list-view-table"
          pagination={false}
          tableLayout={tableLayout}
          scroll={resolvedScroll}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          locale={{ emptyText: emptyState || tableEmptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
          {...rest}>{children}</Table>
      </div>
    );
  }

  // Không mutate mảng `columns` đã memoize khi cần chèn cột giả cố định.
  const cols = [...((columns as any[]) || [])];

  if (rest.rowSelection?.fixed && !hasFixedColumns) {
    cols.unshift({
      key: '_dummy_fixed',
      fixed: rest.rowSelection.fixed,
      width: 0,
      isDummy: true,
      title: '',
      render: () => null,
    });
  }

  const widthlessStretchColumns = shouldStretchColumns
    ? cols.filter((column) => column.width == null && !column.fixed && column.key !== 'actions')
    : [];
  const candidateStretchColumns = shouldStretchColumns && widthlessStretchColumns.length === 0
    ? cols.filter((column) =>
        !column.fixed &&
        column.key !== 'actions' &&
        column.key !== 'status' &&
        column.key !== 'stt' &&
        column.key !== 'icon' &&
        column.key !== 'image' &&
        column.type !== 'mono' &&
        !isStatusOrConditionColumn(column) &&
        typeof column.width === 'number' &&
        column.width > 0,
      )
    : [];
  const candidateTotalWidth = candidateStretchColumns.reduce(
    (sum, column) => sum + (typeof column.width === 'number' ? column.width : 0),
    0,
  );
  const explicitStretchColumn = shouldStretchColumns && widthlessStretchColumns.length === 0 && candidateStretchColumns.length === 0
    ? cols
      .filter((column) => !column.fixed && column.key !== 'actions' && column.key !== 'status')
      .reduce<any>((widestColumn, column) => {
        if (!widestColumn) return column;
        const currentWidth = typeof column.width === 'number' ? column.width : 0;
        const widestWidth = typeof widestColumn.width === 'number' ? widestColumn.width : 0;
        return currentWidth > widestWidth ? column : widestColumn;
      }, undefined)
    : undefined;
  const remainingViewportWidth = measuredTableWidth
    ? measuredTableWidth - totalDeclaredWidth
    : undefined;
  const widthlessStretchColumnWidth = remainingViewportWidth !== undefined && widthlessStretchColumns.length > 0
    ? remainingViewportWidth / widthlessStretchColumns.length
    : undefined;
  const explicitStretchColumnWidth = explicitStretchColumn && remainingViewportWidth !== undefined
    ? (typeof explicitStretchColumn.width === 'number' ? explicitStretchColumn.width : 0) + remainingViewportWidth
    : undefined;

  const computeColumnWidth = (column: any) => {
    if (widthlessStretchColumns.some((c) => c.key === column.key)) {
      return widthlessStretchColumnWidth;
    }
    if (candidateStretchColumns.length > 0 && remainingViewportWidth !== undefined && remainingViewportWidth > 0 && candidateTotalWidth > 0) {
      const isCandidate = candidateStretchColumns.some((c) => c.key === column.key);
      if (isCandidate) {
        const ratio = (typeof column.width === 'number' ? column.width : 0) / candidateTotalWidth;
        const extra = Math.floor(remainingViewportWidth * ratio);
        return (typeof column.width === 'number' ? column.width : 0) + extra;
      }
      return column.width;
    }
    if (column.key === explicitStretchColumn?.key) {
      return explicitStretchColumnWidth;
    }
    return column.width;
  };

  const antdColumns: ColumnsType<any> | undefined = cols.map((col: any) => {
    const dataKey = col.dataIndex || col.key;
    // Theme quyết định có bật sắp xếp sẵn hay không. Chỉ áp cho cột có
    // `dataIndex` — STT và cột thao tác không có nên luôn nằm ngoài, đúng như chk.
    const isStatusOrCond = isStatusOrConditionColumn(col);
    const isSortable = isStatusOrCond ? false : (col.sortable ?? Boolean(col.sorter || (tableSortableByDefault && col.dataIndex)));
    // Khi màn hình truyền `onSort`, mọi thứ tự phải do API quyết định. Không dùng
    // comparator tại client vì AntD sẽ vừa đổi thứ tự cục bộ vừa phát event sort,
    // làm một lần click bị xử lý hai lần và trạng thái icon nhảy sang cột khác.
    const sorterFn = isSortable
      ? (onSort
          ? true
          : typeof col.sorter === 'function'
            ? col.sorter
            : (a: any, b: any) => {
                const aVal = a[dataKey] ?? '';
                const bVal = b[dataKey] ?? '';
                if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
                return String(aVal).localeCompare(String(bVal), 'vi');
              }
        )
      : undefined;

    const colObj: any = {
      key: col.key,
      dataIndex: dataKey,
      width: computeColumnWidth(col),
      sorter: isSortable ? sorterFn : undefined,
      // AntD supplies the standard sorter affordance. Server-side columns
      // intercept the click below, because AntD itself has only two concrete
      // directions and cannot reliably represent the third cleared state.
      sortDirections: isSortable ? ['ascend', 'descend'] : undefined,
      ...(isSortable ? { sortIcon: tableSortIcon || defaultTableSortIcon } : null),
      showSorterTooltip: false,
      align: col.align,
      fixed: col.fixed,
      ellipsis: col.ellipsis === true,
      render: col.render ? (val: any, record: any, index: number) => col.render!(val, record, index)
        : col.type === 'mono'
          ? (val: any) => <span style={{ color: textSecondary, fontSize: fontSizeMd, whiteSpace: 'nowrap' }}>{val}</span>
          : col.type === 'date'
            ? (val: any) => <span style={{ color: textSecondary, whiteSpace: 'nowrap' }}>{val}</span>
            : col.type === 'status'
              ? (val: any) => {
                  const color = STATUS_COLOR_MAP[val?.toLowerCase()] || textTertiary;
                  return (
                    <span style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: 999,
                      fontSize: fontSizeMd, fontWeight: fontWeightMedium,
                      background: `${color}15`, color, whiteSpace: 'nowrap',
                    }}>{val}</span>
                  );
                }
              : undefined,
      onHeaderCell: () => ({
        className: isSortable ? (col.sortOrder ? 'ant-table-column-has-sorters ant-table-column-sort' : 'ant-table-column-has-sorters') : undefined,
        style: {
          fontWeight: fontWeightBold,
          textTransform: 'uppercase',
          padding: col.isDummy ? 0 : (col.key === 'stt' ? '10px 4px' : tableHeaderPadding),
          cursor: isSortable ? 'pointer' : undefined,
          // Tiêu đề cột BẮT BUỘC hiển thị đủ chữ, không cắt "..." — bề rộng cột đã được nới
          // tối thiểu bằng `headerMinWidth()` nên chữ không tràn sang cột bên cạnh.
          whiteSpace: 'nowrap',
          overflow: 'visible',
          zIndex: col.fixed ? 10 : undefined,
          background: col.fixed ? (tableHeaderBg || '#f8fafc') : undefined,
          textAlign: col.align || 'left',
userSelect: 'none',
        },
        // Own the server-side cycle instead of deriving it from AntD's
        // two-state event. Capture runs before AntD's header click handler,
        // so the third click always clears sorting and cannot be reinterpreted
        // as a fresh ascending click.
        onClickCapture: isSortable && onSort && dataKey ? (event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
          event.stopPropagation();
          const field = col.key ?? dataKey;
          const currentOrder = col.sortOrder !== undefined
            ? col.sortOrder
            : (effectiveServerSort.field === field ? effectiveServerSort.order : null);
          const nextOrder = getNextSortOrder(currentOrder);
          const nextTableOrder: TableSortOrder = nextOrder === 'asc' ? 'ascend' : nextOrder === 'desc' ? 'descend' : null;
          setServerSort({
            field: nextTableOrder ? field : undefined,
            order: nextTableOrder,
          });
          isSortingRef.current = true;
          onSort(field, nextOrder);
        } : undefined,
      }),
      title: <span style={{ whiteSpace: 'nowrap' }}>{((col as any).title ?? col.label)}</span>,
      onCell: (record: any, rowIndex?: number) => {
        let cellTitleText: string | undefined = undefined;
        const dataKey = col.dataIndex || col.key;
        const isControlCol = col.key === 'actions' || col.key === 'stt' || col.key === 'selection' || col.isDummy;

        if (!isControlCol) {
          if (col.cellTitle !== undefined) {
            if (typeof col.cellTitle === 'function') {
              try {
                const val = dataKey && record ? record[dataKey] : undefined;
                if (col.cellTitle.length >= 2) {
                  cellTitleText = (col.cellTitle as any)(val, record);
                } else {
                  cellTitleText = col.cellTitle(record);
                }
              } catch {
                cellTitleText = undefined;
              }
            } else if (typeof col.cellTitle === 'string') {
              cellTitleText = col.cellTitle;
            }
          } else {
            // Intelligent fallback matching /berth standard:
            // 1) If col.render is defined, extract text from rendered node
            if (col.render) {
              try {
                const val = dataKey && record ? record[dataKey] : undefined;
                const rendered = col.render(val, record, rowIndex ?? 0);
                const extracted = extractTextFromNode(rendered);
                if (extracted && extracted !== '—' && extracted !== '-' && !isUuid(extracted)) {
                  cellTitleText = extracted;
                }
              } catch {
                cellTitleText = undefined;
              }
            }
            // 2) If still undefined, fallback to record[dataKey] if primitive
            if (!cellTitleText && dataKey && record && record[dataKey] != null && typeof record[dataKey] !== 'object' && typeof record[dataKey] !== 'boolean') {
              const raw = String(record[dataKey]).trim();
              if (raw && raw !== '—' && raw !== '-' && !isUuid(raw)) {
                cellTitleText = raw;
              }
            }
          }
        }
        return {
          title: cellTitleText,
          style: {
            fontSize: dense ? fontSizeSm : fontSizeMd,
            color: textPrimary,
            padding: col.isDummy ? 0 : (col.key === 'stt' ? '8px 4px' : (tableCellPadding || undefined)),
            whiteSpace: 'nowrap',
            overflow: col.key === 'stt' ? 'visible' : 'hidden',
            textOverflow: col.key === 'stt' ? 'clip' : 'ellipsis',
            background: col.fixed ? '#ffffff' : undefined,
            zIndex: col.fixed ? 9 : undefined,
          },
        };
      },
    };

    if (col.sortOrder !== undefined) {
      colObj.sortOrder = col.sortOrder;
    } else if (onSort && isSortable) {
      const field = col.key ?? dataKey;
      colObj.sortOrder = effectiveServerSort.field === field ? effectiveServerSort.order ?? null : null;
    } else if (isSortable) {
      colObj.sortOrder = localSort.field === dataKey ? localSort.order ?? null : null;
    }

    return colObj;
  });

  // Auto-append actions column when rowActions is provided and no actions column already exists
  if (rowActions && columns && !columns.some((column) => column.key === 'actions')) {
    antdColumns?.push({
      key: 'actions',
      title: (
        <span style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <UnorderedListOutlined />
        </span>
      ),
      width: ACTION_COLUMN_WIDTH,
      fixed: 'right' as const,
      align: 'center',
      onHeaderCell: () => ({ style: actionColumnHeaderCellStyle }),
      onCell: () => ({ style: actionColumnCellStyle }),
      render: (_: unknown, record: any) => {
        const rawActions = rowActions(record);
        if (!rawActions || rawActions.length === 0) {
          return (
            <span style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', color: textTertiary }}>
              —
            </span>
          );
        }
        const items = rawActions.map((a) => ({
          key: a.key, icon: a.icon, label: a.label, danger: a.danger, disabled: a.disabled,
          onClick: a.onClick,
        }));
        return (
          <span style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <RowActionDropdown items={items} />
          </span>
        );
      },
    });
  }

  const handleTableChange = (pagination: any, filters: any, sorter: any, extra: any) => {
    // AntD phát chính xác một event cho mỗi lần người dùng click header. Lấy
    // `field` từ dataIndex/key thay vì tự gắn thêm onClick vào header để không
    // tạo hai luồng sort cạnh tranh nhau.
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (activeSorter) {
      // Prefer `columnKey`: every generated column gives it the page-defined
      // key, whereas `field` is an AntD-derived value and has caused sort to
      // jump to Name/Code on columns rendered from composite data.
      const field =
        resolveSortField(activeSorter, columns as DataTableColumn[] | undefined) ??
        (!onSort ? localSort.field : effectiveServerSort.field);
      const sourceColumn = field
        ? (columns as DataTableColumn[] | undefined)?.find(
            (column) => column.key === field || column.dataIndex === field,
          )
        : undefined;
      if (typeof field === 'string' && field) {
        const currentOrder = sourceColumn?.sortOrder !== undefined
          ? sourceColumn.sortOrder
          : !onSort && localSort.field === field
            ? localSort.order
            : effectiveServerSort.field === field
              ? effectiveServerSort.order
              : null;
        const nextOrder = getNextSortOrder(currentOrder);
        if (onSort) {
          isSortingRef.current = true;
          setServerSort({
            field: nextOrder ? field : undefined,
            order: nextOrder === 'asc' ? 'ascend' : nextOrder === 'desc' ? 'descend' : null,
          });
          onSort(field, nextOrder);
        } else {
          setLocalSort({
            field: nextOrder ? field : undefined,
            order: nextOrder === 'asc' ? 'ascend' : nextOrder === 'desc' ? 'descend' : null,
          });
        }
      }
    }
    if (rest.onChange) {
      rest.onChange(pagination, filters, sorter, extra);
    }
  };

  return (
    <div ref={tableShellRef} className="list-view-table-shell" style={{ width: '100%', minWidth: 0, minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
      {tableRowStripeBg !== 'transparent' && (
        <style>{`
          .list-view-row-stripe > td { background: ${tableRowStripeBg}; }
          .list-view-row-stripe > td.ant-table-cell-fix-left,
          .list-view-row-stripe > td.ant-table-cell-fix-right { background: ${tableRowStripeBg} !important; }
        `}</style>
      )}
      <Table columns={antdColumns} dataSource={dataSource} rowKey={rowKey} loading={loading}
        rowClassName={(_: any, index: number) => (index % 2 === 1 ? 'list-view-row-stripe' : '')}
        className="list-view-table"
        pagination={false}
        tableLayout={tableLayout}
        locale={{ emptyText: emptyState || tableEmptyState || <EmptyState description="Không có dữ liệu" /> }}
        onChange={handleTableChange}
        scroll={tableScroll}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }}
        {...rest} />
    </div>
  );
};

export default DataTable;
