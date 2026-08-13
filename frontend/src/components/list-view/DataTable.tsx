import React, { useLayoutEffect, useRef } from 'react';
import { Table, Empty, Dropdown, Button, Tooltip } from 'antd';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeMd, fontWeightBold,
  statusOperational, statusCritical, statusDraft, statusAttention,
  radiusPill, borderDefault,
} from '../../tokens';
import { colors, layout } from '../../theme';

const tableHeaderBg = colors.bodyBg;

// Conservative per-row height (px) used to decide when a table with a numeric
// scroll.y cap can auto-fit to its content without risking vertical overflow.
const AUTO_FIT_ROW_HEIGHT = 60;

export interface DataTableColumn {
  key: string; label: string; sortable?: boolean; twoLine?: boolean;
  type?: 'text' | 'status' | 'action' | 'number' | 'date' | 'mono';
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index?: number) => React.ReactNode;
  dataIndex?: string; sorter?: boolean;
  sortOrder?: 'ascend' | 'descend' | null;
  cellTitle?: (record: any) => string;
  fixed?: 'left' | 'right';
}

export interface DataTableProps {
  columns?: DataTableColumn[];
  dataSource: any[];
  rowKey: string | ((record: any) => string);
  loading?: boolean;
  emptyState?: React.ReactNode;
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

const DataTable: React.FC<DataTableProps> = ({
  columns, dataSource, rowKey, loading, emptyState, onSort, rowActions, children, scroll, ...rest
}) => {
  const tableShellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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
  }, [dataSource]);

  // Auto-fit the table body to its content when the rows fit inside a numeric
  // scroll.y cap, so the pagination (and any trailing content) sits directly
  // under the last row instead of leaving a fixed-height gap. String caps
  // (e.g. 'calc(100vh - …)') are kept as-is.
  const requestedScrollY = scroll?.y ?? layout.listTableScrollY;
  const autoFitMaxRows = typeof requestedScrollY === 'number'
    ? Math.floor(requestedScrollY / AUTO_FIT_ROW_HEIGHT)
    : 0;
  const tableScroll = {
    x: scroll?.x ?? layout.listTableMinWidth,
    y: typeof requestedScrollY === 'number' && dataSource.length > 0 && dataSource.length <= autoFitMaxRows
      ? undefined
      : requestedScrollY,
  };

  if (children) {
    return (
      <div ref={tableShellRef} style={{ width: '100%', minWidth: 0 }}>
        <Table dataSource={dataSource} rowKey={rowKey} loading={loading}
          className="list-view-table"
          pagination={false}
          scroll={scroll}
          locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
          {...rest}>{children}</Table>
      </div>
    );
  }

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
      width: col.width,
      sorter: sorterFn,
      sortDirections: ['ascend', 'descend'],
      showSorterTooltip: false,
      align: col.align,
      fixed: col.fixed,
      ellipsis: true,
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
        style: { background: tableHeaderBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', padding: '15px 16px', cursor: col.sortable ? 'pointer' : undefined },
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
  if (rowActions && columns && !columns.some((c) => c.key === 'actions')) {
    antdColumns?.push({
      key: 'actions',
      title: <UnorderedListOutlined />,
      width: 60,
      fixed: 'right' as const,
      align: 'center',
      render: (_: unknown, record: any) => {
        const items = rowActions(record).map((a) => ({
          key: a.key, icon: a.icon, label: a.label, danger: a.danger, disabled: a.disabled,
          onClick: a.onClick,
        }));
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: textSecondary, borderColor: borderDefault, borderRadius: radiusPill, height: 28, width: 28, fontSize: fontSizeMd }}
            />
          </Dropdown>
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
    <div ref={tableShellRef} style={{ width: '100%', minWidth: 0 }}>
      <Table columns={antdColumns} dataSource={dataSource} rowKey={rowKey} loading={loading}
        className="list-view-table"
        pagination={false}
        locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        onChange={handleTableChange}
        scroll={tableScroll}
        {...rest} />
    </div>
  );
};

export default DataTable;
