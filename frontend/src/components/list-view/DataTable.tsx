import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table, Empty, Dropdown, Button, Tooltip } from 'antd';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeSm, fontSizeMd, fontWeightBold,
  statusOperational, statusCritical, statusDraft, statusAttention,
  radiusPill, borderDefault,
} from '../../tokens';
import { colors, layout } from '../../theme';

const tableHeaderBg = colors.bodyBg;
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
  const label = typeof column?.label === 'string'
    ? column.label
    : typeof column?.title === 'string' ? column.title : '';
  if (!label) return 0;
  const sorterSpace = (column.sortable || column.sorter) ? HEADER_SORTER_WIDTH : 0;
  return Math.ceil(label.length * HEADER_CHAR_WIDTH) + HEADER_HORIZONTAL_PADDING + sorterSpace;
}

/** Nới `width` của cột lên tối thiểu bằng bề rộng tiêu đề của chính nó. */
function withHeaderSafeWidth(column: any): any {
  if (typeof column?.width !== 'number') return column;
  const required = headerMinWidth(column);
  return required > column.width ? { ...column, width: required } : column;
}

const actionColumnCellStyle: React.CSSProperties = {
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
  paddingInline: 0,
  textAlign: 'center',
  verticalAlign: 'middle',
  background: '#ffffff',
  zIndex: 10,
};

// Header cột action phải có cùng nền với header cột dữ liệu (tableHeaderBg).
const actionColumnHeaderCellStyle: React.CSSProperties = {
  ...actionColumnCellStyle,
  background: tableHeaderBg,
  zIndex: 10,
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
  cellTitle?: (record: any) => string;
  fixed?: 'left' | 'right';
  /** Mặc định true (cắt chữ "..."); đặt false để header/cell wrap hiển thị đủ chữ. */
  ellipsis?: boolean;
}

export interface DataTableProps {
  columns?: DataTableColumn[] | ColumnsType<any>;
  dataSource?: any[];
  rowKey?: string | ((record: any) => string);
  loading?: boolean;
  emptyState?: React.ReactNode;
  fill?: boolean;
  dense?: boolean;
  onSort?: (field: string, order: any) => void;
  rowActions?: (record: any) => { key: string; label: string; icon?: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }[];
  children?: React.ReactNode;
  scroll?: { x?: number | string; y?: number | string };
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
  columns: rawColumns, dataSource = [], rowKey = 'id', loading, emptyState, fill = true, dense, onSort, rowActions, children, scroll, ...rest
}) => {
  const tableShellRef = useRef<HTMLDivElement>(null);
  const dataSignatureRef = useRef<string | null>(null);
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
    resetHorizontalScroll();
    const frameId = window.requestAnimationFrame(resetHorizontalScroll);
    const timer = setTimeout(resetHorizontalScroll, 100);
    return () => {
      window.cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const signature = computeRowSetSignature(dataSource, rowKey);
    if (dataSignatureRef.current !== null && signature === dataSignatureRef.current) {
      return;
    }
    dataSignatureRef.current = signature;

    resetHorizontalScroll();
    const frameId = window.requestAnimationFrame(resetHorizontalScroll);
    const timer = setTimeout(resetHorizontalScroll, 50);
    return () => {
      window.cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
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

  // Nới bề rộng cột cho vừa tiêu đề TRƯỚC mọi phép tính bề rộng phía dưới, để tổng bề
  // rộng bảng và scroll ngang khớp với bề rộng cột thực tế.
  const columns = (rawColumns as any[] | undefined)?.map(withHeaderSafeWidth) as typeof rawColumns;

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
    x: resolvedScrollX,
  };
  const tableLayout = 'fixed' as const;

  if (children) {
    return (
      <div ref={tableShellRef} className="list-view-table-shell" style={{ width: '100%', minWidth: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Table dataSource={dataSource} rowKey={rowKey} loading={loading}
          className="list-view-table"
          pagination={false}
          tableLayout={tableLayout}
          scroll={resolvedScroll}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
          {...rest}>{children}</Table>
      </div>
    );
  }

  const cols = (columns as any[]) || [];

  const widthlessStretchColumns = shouldStretchColumns
    ? cols.filter((column) => column.width == null && !column.fixed && column.key !== 'actions')
    : [];
  const explicitStretchColumn = shouldStretchColumns && widthlessStretchColumns.length === 0
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

  const antdColumns: ColumnsType<any> | undefined = cols.map((col: any) => {
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
        style: {
          background: tableHeaderBg,
          color: colors.sidebarBg,
          fontWeight: fontWeightBold,
          fontSize: fontSizeMd,
          textTransform: 'uppercase',
          padding: '10px 12px',
          cursor: col.sortable ? 'pointer' : undefined,
          // Tiêu đề cột BẮT BUỘC hiển thị đủ chữ, không cắt "..." — bề rộng cột đã được nới
          // tối thiểu bằng `headerMinWidth()` nên chữ không tràn sang cột bên cạnh.
          whiteSpace: 'nowrap',
          overflow: 'visible',
          zIndex: col.fixed ? 10 : undefined,
          textAlign: col.align || 'left',
        },
        onClick: col.sortable ? () => {
          if (onSort && dataKey) {
            const nextOrder = col.sortOrder === 'ascend' ? 'desc' : 'asc';
            onSort(dataKey, nextOrder);
          }
        } : undefined,
      }),
      title: col.sortable ? (
        <Tooltip title={<span style={{ fontSize: 12 }}>{col.sortOrder === 'ascend' ? 'Nhấn để sắp xếp giảm dần' : 'Nhấn để sắp xếp tăng dần'}</span>}>
          <span style={{ whiteSpace: 'nowrap' }}>{(col as any).title ?? col.label}</span>
        </Tooltip>
      ) : <span style={{ whiteSpace: 'nowrap' }}>{((col as any).title ?? col.label)}</span>,
      onCell: () => ({
        style: {
          fontSize: dense ? fontSizeSm : fontSizeMd,
          color: textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: col.ellipsis === false ? 'clip' : 'ellipsis',
          background: col.fixed ? '#ffffff' : undefined,
          zIndex: col.fixed ? 9 : undefined,
        },
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
      onHeaderCell: () => ({ style: actionColumnHeaderCellStyle }),
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
    // Một lần click header phát `onSort` hai lần: một từ `onHeaderCell.onClick`,
    // một từ đây. Chu kỳ nội bộ của antd là ascend → descend → không sắp xếp, nên
    // phải quy "không sắp xếp" về `asc` thì hai đường mới ra cùng kết quả ở mọi
    // bước; nếu quy về `desc` thì lần click thứ ba bị kẹt ở giảm dần.
    if (onSort && sorter.field) {
      onSort(sorter.field as string, sorter.order === 'descend' ? 'desc' : 'asc');
    }
    if (rest.onChange) {
      rest.onChange(pagination, filters, sorter, extra);
    }
  };

  return (
    <div ref={tableShellRef} className="list-view-table-shell" style={{ width: '100%', minWidth: 0, minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Table columns={antdColumns} dataSource={dataSource} rowKey={rowKey} loading={loading}
        className="list-view-table"
        pagination={false}
        tableLayout={tableLayout}
        locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        onChange={handleTableChange}
        scroll={tableScroll}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }}
        {...rest} />
    </div>
  );
};

export default DataTable;
