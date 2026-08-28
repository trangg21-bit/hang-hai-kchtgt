import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table, Empty, Dropdown, Button, Tooltip } from 'antd';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { layout } from '../../theme';
import { useThemeToken, THEME_SCOPE_CLASS, type ThemeToken } from '../../context/ThemeTokenContext';

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

// Header cột action phải có cùng nền với header cột dữ liệu (t.tableHeaderBg).
const actionColumnHeaderCellStyleFor = (t: ThemeToken): React.CSSProperties => ({
  ...actionColumnCellStyle,
  background: t.tableHeaderBg,
  zIndex: 10,
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
  cellTitle?: (record: any) => string;
  fixed?: 'left' | 'right';
  /** Mặc định true (cắt chữ "..."); đặt false để header/cell wrap hiển thị đủ chữ. */
  ellipsis?: boolean;
  /**
   * Đặt true để bỏ cột khỏi bảng. Dùng khi bộ cột thay đổi theo ngữ cảnh — ví dụ
   * màn CHK ẩn cột "Trạng thái" ở mọi tab trừ tab "Tất cả". Cột bị ẩn không tính
   * vào tổng bề rộng nên scroll ngang vẫn khớp.
   */
  hidden?: boolean;
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

const DataTable: React.FC<DataTableProps> = ({
  columns: rawColumns, dataSource = [], rowKey = 'id', loading, emptyState, fill = true, dense, onSort, rowActions, children, scroll, ...rest
}) => {
  const t = useThemeToken();
  const {
    textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeSm, fontSizeMd, fontWeightBold,
    tableHeaderBg, tableHeaderColor, tableHeaderPadding, tableCellPadding, tableRowStripeBg,
    tableSortableByDefault, tableSortIcon, tableEmptyState,
  } = t;
  const STATUS_COLOR_MAP = statusColorMapFor(t);
  const actionColumnHeaderCellStyle = actionColumnHeaderCellStyleFor(t);

  const tableShellRef = useRef<HTMLDivElement>(null);
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
  const columns = (rawColumns as any[] | undefined)
    ?.filter((column) => !column?.hidden)
    .map(withHeaderSafeWidth) as typeof rawColumns;

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
    // Theme quyết định có bật sắp xếp sẵn hay không. Chỉ áp cho cột có
    // `dataIndex` — STT và cột thao tác không có nên luôn nằm ngoài, đúng như chk.
    const isSortable = col.sortable ?? Boolean(col.sorter || (tableSortableByDefault && col.dataIndex));
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
      ...(tableSortIcon ? { sortIcon: tableSortIcon } : null),
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
          padding: col.key === 'stt' ? '10px 4px' : tableHeaderPadding,
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
        onClick: isSortable ? () => {
          if (onSort && dataKey) {
            const nextOrder = col.sortOrder === 'ascend' ? 'desc' : 'asc';
            onSort(dataKey, nextOrder);
          }
        } : undefined,
      }),
      title: <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{((col as any).title ?? col.label)}</span>,
      onCell: () => ({
        style: {
          fontSize: dense ? fontSizeSm : fontSizeMd,
          color: textPrimary,
          padding: col.key === 'stt' ? '8px 4px' : (tableCellPadding || undefined),
          whiteSpace: 'nowrap',
          overflow: col.key === 'stt' ? 'visible' : 'hidden',
          textOverflow: (col.key === 'stt' || col.ellipsis === false) ? 'clip' : 'ellipsis',
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
        locale={{ emptyText: emptyState || tableEmptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        onChange={handleTableChange}
        scroll={tableScroll}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }}
        {...rest} />
    </div>
  );
};

export default DataTable;
