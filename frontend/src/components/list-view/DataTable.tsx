import React from 'react';
import { Table, Empty, Dropdown, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  textPrimary, textSecondary, textTertiary, fontWeightMedium, fontSizeMd, fontWeightBold,
  statusOperational, statusCritical, statusDraft, statusAttention,
  radiusPill, borderDefault,
} from '../../tokens';
import { colors } from '../../theme';

const tableHeaderBg = colors.bodyBg;

export interface DataTableColumn {
  key: string; label: string; sortable?: boolean; twoLine?: boolean;
  type?: 'text' | 'status' | 'action' | 'number' | 'date' | 'mono';
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => React.ReactNode;
  dataIndex?: string; sorter?: boolean;
  sortOrder?: 'ascend' | 'descend' | null;
}

export interface DataTableProps {
  columns?: DataTableColumn[];
  dataSource: any[];
  rowKey: string | ((record: any) => string);
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowActions?: (record: any) => {
    key: string; label: string; icon?: React.ReactNode;
    onClick: () => void; danger?: boolean;
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
  columns, dataSource, rowKey, loading, emptyState, onSort, rowActions, children, ...rest
}) => {
  if (children) {
    return (
      <Table dataSource={dataSource} rowKey={rowKey} loading={loading}
        className="list-view-table"
        pagination={false}
        locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        {...rest}>{children}</Table>
    );
  }

  const antdColumns: ColumnsType<any> | undefined = columns?.map((col) => ({
    key: col.key, dataIndex: col.dataIndex || col.key, title: col.label,
    width: col.width, sorter: col.sortable || col.sorter, sortOrder: col.sortOrder,
    align: col.align,
    render: col.render ? col.render
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
      style: { background: tableHeaderBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, whiteSpace: 'nowrap', textTransform: 'uppercase', padding: '16px 16px' },
    }),
    onCell: () => ({
      style: { fontSize: fontSizeMd, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    }),
  }));

  // Auto-append actions column when rowActions is provided and no actions column already exists
  if (rowActions && columns && !columns.some((c) => c.key === 'actions')) {
    antdColumns?.push({
      key: 'actions',
      title: '',
      width: 60,
      align: 'center',
      render: (_: unknown, record: any) => {
        const items = rowActions(record).map((a) => ({
          key: a.key, icon: a.icon, label: a.label, danger: a.danger,
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

  return (
    <Table columns={antdColumns} dataSource={dataSource} rowKey={rowKey} loading={loading}
      className="list-view-table"
      pagination={false}
        locale={{ emptyText: emptyState || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" /> }}
        onChange={(_pagination, _filters, sorter: any) => {
          if (onSort && sorter.field) onSort(sorter.field as string, sorter.order === 'ascend' ? 'asc' : 'desc');
        }}
      {...rest} />
  );
};

export default DataTable;
