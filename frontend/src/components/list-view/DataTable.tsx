import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table, Empty, Dropdown, Button, Tooltip } from 'antd';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeMd, fontWeightBold,
  statusOperational, statusCritical, statusDraft, statusAttention,
  radiusPill, borderDefault,
} from '../../tokens';
import { colors, layout } from '../../theme';

const tableHeaderBg = colors.bodyBg;
const ACTION_COLUMN_WIDTH = 60;

const actionColumnCellStyle: React.CSSProperties = {
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
  paddingInline: 0,
  textAlign: 'center',
  verticalAlign: 'middle',
};


// Stable, order-insensitive fingerprint of the rows currently shown. It lets the
// scroll-reset effect tell a real data change (new page / filter / reload) apart
// from a client-side re-sort, so sorting no longer snaps the horizontal scroll
// back to the first column while the user is scrolled right.
function computeRowSetSignature(dataSource: any[], rowKey: string | ((record: any) => string)): string {
  return dataSource
    .map((record) => {
      if (typeof rowKey === 'function') return String(rowKey(record));
      const v = record?.[rowKey];
      return v != null ? String(v) : '';
    })
    .sort()
    .join('|');
}

export interface DataTableColumn {
  key: string; label: React.ReactNode; sortable?: boolean; twoLine?: boolean;
  type?: 'text' | 'status' | 'action' | 'number' | 'date' | 'mono';
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index?: number) => React.ReactNode;
  dataIndex?: string; sorter?: boolean;
  sortOrder?: 'ascend' | 'descend' | null;
  cellTitle?: (record: any) => string;
  fixed?: 'left' | 'right';
  /** Mặc định true (cắt chữ "..."); đặt false để header/cell wrap hiển thị đủ chữ. */
  ellipsis?: boolean;
}

export interface DataTableProps {
  columns?: DataTableColumn[];
  dataSource: any[];
  rowKey: string | ((record: any) => string);
  loading?: boolean;
  emptyState?: React.ReactNode;
  /** Khi true (và scroll.y là số): thân bảng LUÔN lấp đầy chiều cao khả dụng,
      scrollbar ngang nằm sát mép dưới bảng, kể cả khi ít bản ghi. */
  fill?: boolean;
  rowActions?: (record: any) => {
    key: string; label: string; icon?: React.ReactNode;
    onClick: () => void; danger?: boolean; disabled?: boolean;
  }[];
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  children?: React.ReactNode;
  [key: string]: any;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  active: statusOperational,
  operational: statusOperational,
  locked: statusCritical,
  rejected: statusCritical,
  inactive: statusDraft,
  draft: statusDraft,
  pending: statusAttention,
};

// Auto-close the row action menu when the page or the table body scrolls.
const RowActionDropdown: React.FC<{ items: MenuProps['items'] }> = ({ items }) => {
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
    <Dropdown menu={{ items }} trigger={['click']} open={open} onOpenChange={setOpen}>
      <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()}
        style={{ color: textSecondary, borderColor: borderDefault, borderRadius: radiusPill, height: 28, width: 28, fontSize: fontSizeMd }} />
    </Dropdown>
  );
};

const DataTable: React.FC<DataTableProps> = ({
  columns, dataSource, rowKey, loading, emptyState, fill, onSort, rowActions, children, scroll, ...rest
}) => {
  const tableShellRef = useRef<HTMLDivElement>(null);
  const dataSignatureRef = useRef<string | null>(null);
  const [measuredTableWidth, setMeasuredTableWidth] = useState<number>();
  // Preserve a content-sized table when the page explicitly requests
  // `max-content`. For lists whose columns are narrower than the common
  // minimum width, replacing it with a larger fixed width leaves an empty
  // area after the last column. At the far-right scroll position that area
  // makes the action column look detached from the table.
  const resolvedScroll = scroll;

  useLayoutEffect(() => {
    // A client-side re-sort produces a brand-new `dataSource` array with the SAME
    // rows in a different order. Reset the horizontal scroll only when the set of
    // rows actually changes (filter / pagination / reload) — otherwise clicking a
    // sortable header while scrolled right would snap back to the first column.
    const signature = computeRowSetSignature(dataSource, rowKey);
    if (dataSignatureRef.current !== null && signature === dataSignatureRef.current) {
      return; // same rows, just re-ordered — keep the current scroll position
    }
    dataSignatureRef.current = signature;

    const resetHorizontalScroll = () => {
      tableShellRef.current?.querySelectorAll<HTMLElement>(
        '.ant-table-header, .ant-table-body, .ant-table-content, .ant-table-sticky-scroll',
      ).forEach((element) => {
        element.scrollLeft = 0;
        element.scrollTo?.({ left: 0, behavior: 'auto' });
      });
    };

    resetHorizontalScroll();
    const frameId = window.requestAnimationFrame(resetHorizontalScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [dataSource, rowKey]);

  useLayoutEffect(() => {
    const shell = tableShellRef.current;
    if (!shell) return;

    const measureWidth = () => {
      const nextWidth = shell.clientWidth;
      if (nextWidth > 0) {
        setMeasuredTableWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth);
      }
    };

    measureWidth();
    const resizeObserver = new ResizeObserver(measureWidth);
    resizeObserver.observe(shell);
    return () => resizeObserver.disconnect();
  }, []);

  const requestedScrollY = scroll?.y ?? layout.listTableScrollY;
  const isNumericScrollY = typeof requestedScrollY === 'number';
  // Đo chiều cao thực tế để quyết định chế độ thân bảng thay vì LUÔN lấp đầy:
  //  - Nội dung cao hơn vùng trống (availH) → scroll.y = availH − header:
  //    thân bảng lấp đầy, mép dưới thẳng hàng panel filter, cuộn TRONG bảng.
  //  - Nội dung vừa vùng trống → scroll.y = undefined + shell co sát nội dung:
  //    pagination nằm ngay dưới bảng, mép dưới KHÔNG thẳng hàng panel filter.
  // Chỉ áp dụng khi scroll.y là số, có dữ liệu và shell nằm trong flex container.
  const [fitMode, setFitMode] = useState<number | 'content' | null>(null);
  useLayoutEffect(() => {
    const el = tableShellRef.current;
    if (!el || !el.parentElement) return;
    const parent = el.parentElement;
    if (!isNumericScrollY || dataSource.length === 0) return;
    if (!getComputedStyle(parent).display.includes('flex')) return;
    const measure = () => {
      // Vùng trống cho bảng = chiều cao parent − tổng sibling (pagination; thẻ <style> = 0).
      let availH = parent.clientHeight;
      for (const sib of Array.from(parent.children)) {
        if (sib !== el) availH -= (sib as HTMLElement).offsetHeight;
      }
      const header = el.querySelector<HTMLElement>('.ant-table-header')
        || el.querySelector<HTMLElement>('.ant-table-thead');
      const tbody = el.querySelector<HTMLElement>('.ant-table-tbody');
      const headerH = header ? header.offsetHeight : 0;
      // Chiều cao tự nhiên của nội dung = header + tbody. KHÔNG dùng
      // body.scrollHeight: ở chế độ split (scroll.y đã đặt) body bị ép cao đúng
      // scroll.y nên scrollHeight luôn ≥ scroll.y → đo sai khi ít bản ghi
      // (làm bảng vẫn lấp đầy dù nội dung ngắn).
      const contentH = headerH + (tbody ? tbody.offsetHeight : 0);
      // `fill`: luôn lấp đầy vùng trống (scrollbar ngang nằm sát mép dưới bảng),
      // không bao giờ rơi về chế độ 'content' dù nội dung ít bản ghi.
      if (fill || contentH > availH + 1) {
        setFitMode(Math.max(80, availH - headerH));
      } else {
        setFitMode('content');
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [dataSource.length, isNumericScrollY, fill]);
  const hasGeneratedActionColumn = Boolean(
    rowActions && columns && !columns.some((column) => column.key === 'actions'),
  );
  const hasFixedColumns = Boolean(columns?.some((column) => Boolean(column.fixed)));
  const declaredColumnsWidth = columns?.reduce(
    (totalWidth, column) => totalWidth + (typeof column.width === 'number' ? column.width : 0),
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
    x: resolvedScrollX,
    y: isNumericScrollY && fitMode != null
      ? (fitMode === 'content' ? undefined : fitMode)
      : requestedScrollY,
  };
  // Keep column positions stable between populated and empty states. When the
  // declared columns are narrower than the viewport, one content column absorbs
  // the remainder so status/actions stay at the right edge instead of leaving a
  // blank header segment.
  const tableLayout = 'fixed' as const;

  if (children) {
    return (
      <div ref={tableShellRef} className="list-view-table-shell" style={{ width: '100%', minWidth: 0 }}>
        <Table dataSource={dataSource} rowKey={rowKey} loading={loading}
          className="list-view-table"
          pagination={false}
          tableLayout={tableLayout}
          scroll={resolvedScroll}
          locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
          {...rest}>{children}</Table>
      </div>
    );
  }

  const widthlessStretchColumns = shouldStretchColumns
    ? columns?.filter((column) => column.width == null && !column.fixed && column.key !== 'actions') ?? []
    : [];
  const explicitStretchColumn = shouldStretchColumns && widthlessStretchColumns.length === 0
    ? columns
      ?.filter((column) => !column.fixed && column.key !== 'actions' && column.key !== 'status')
      .reduce<DataTableColumn | undefined>((widestColumn, column) => {
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

  const antdColumns: ColumnsType<any> | undefined = columns?.map((col) => {
    const dataKey = col.dataIndex || col.key;
    const isSortable = Boolean(col.sortable || col.sorter);
    const sorterFn = typeof col.sorter === 'function'
      ? col.sorter
      : isSortable
        ? (a: any, b: any) => {
            const aVal = a[dataKey] ?? '';
            const bVal = b[dataKey] ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
            return String(aVal).localeCompare(String(bVal), 'vi');
          }
        : undefined;

    const colObj: any = {
      key: col.key,
      dataIndex: dataKey,
      width: widthlessStretchColumns.some((column) => column.key === col.key)
        ? widthlessStretchColumnWidth
        : (col.key === explicitStretchColumn?.key ? explicitStretchColumnWidth : col.width),
      sorter: sorterFn,
      sortDirections: ['ascend', 'descend'],
      showSorterTooltip: false,
      align: col.align,
      fixed: col.fixed,
      ellipsis: col.ellipsis !== false,
      render: col.render ? (val: any, record: any, index: number) => col.render!(val, record, index)
        : col.type === 'mono'
          ? (val: any) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{val}</span>
          : col.type === 'date'
            ? (val: any) => <span style={{ color: textSecondary }}>{val}</span>
            : col.type === 'status'
              ? (val: any) => {
                  const color = STATUS_COLOR_MAP[val?.toLowerCase()] || textTertiary;
                  return (
                    <span style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: 999,
                      fontSize: fontSizeMd, fontWeight: fontWeightMedium,
                      background: `${color}15`, color,
                    }}>{val}</span>
                  );
                }
              : undefined,
      onHeaderCell: () => ({
        style: { background: tableHeaderBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', padding: '15px 16px', cursor: col.sortable ? 'pointer' : undefined, whiteSpace: col.ellipsis === false ? 'normal' : undefined, lineHeight: col.ellipsis === false ? 1.35 : undefined },
        onClick: col.sortable ? () => {
          if (onSort && dataKey) {
            const nextOrder = col.sortOrder === 'ascend' ? 'desc' : 'asc';
            onSort(dataKey, nextOrder);
          }
        } : undefined,
      }),
      title: col.sortable ? (
        <Tooltip title={<span style={{ fontSize: 12 }}>{col.sortOrder === 'ascend' ? 'Nhấn để sắp xếp giảm dần' : 'Nhấn để sắp xếp tăng dần'}</span>}>
          <span>{col.label}</span>
        </Tooltip>
      ) : col.label,
      onCell: (record: any) => ({
        style: { fontSize: fontSizeMd, color: textPrimary },
      }),
    };

    if (col.sortOrder !== undefined) {
      colObj.sortOrder = col.sortOrder;
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
      onHeaderCell: () => ({ style: actionColumnCellStyle }),
      onCell: () => ({ style: actionColumnCellStyle }),
      render: (_: unknown, record: any) => {
        const items = rowActions(record).map((a) => ({
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
    if (onSort && sorter.field) {
      onSort(sorter.field as string, sorter.order === 'ascend' ? 'asc' : 'desc');
    }
    if (rest.onChange) {
      rest.onChange(pagination, filters, sorter, extra);
    }
  };

  return (
    <div ref={tableShellRef} style={{ width: '100%', minWidth: 0, flex: fitMode === 'content' ? '0 0 auto' : 1, minHeight: 0 }}>
      <Table columns={antdColumns} dataSource={dataSource} rowKey={rowKey} loading={loading}
        className="list-view-table"
        pagination={false}
        tableLayout={tableLayout}
        locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        onChange={handleTableChange}
        scroll={tableScroll}
        {...rest} />
    </div>
  );
};

export default DataTable;
