import { Table, Button, Space, Tooltip, Tag } from "antd";
import type { TableProps } from "antd/es/table";
import { EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
interface ActionButton {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: (record: any) => void;
  tooltip?: string;
}

interface DataTableProps<T> {
  columns: TableProps<T>['columns'];
  dataSource: T[];
  loading?: boolean;
  rowKey?: string | ((record: T) => string);
  scroll?: { x?: number; y?: number };
  actions?: ActionButton[];
  onRowClick?: (record: T) => void;
  showHeader?: boolean;
  pagination?: false | any;
  size?: 'small' | 'middle' | 'default';
  sticky?: boolean;
  emptyText?: ReactNode;
}

/**
 * DataTable component v?i sticky header, hover row, v� action column.
 * H? tr? c�c h�nh d?ng edit/delete trong action column.
 */
export default function DataTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  loading,
  rowKey = 'id',
  scroll,
  actions,
  onRowClick,
  showHeader = true,
  pagination,
  size = 'middle',
  sticky = true,
  emptyText,
}: DataTableProps<T>) {
  const actionColumn = actions
    ? ({
        title: 'Thao t�c',
        key: 'actions',
        width: 120,
        fixed: 'right' as const,
        render: (_: unknown, record: T) => (
          <Space size="small">
            {actions.map((action) => (
              <Tooltip key={action.key} title={action.tooltip || action.label}>
                <Button
                  type="text"
                  danger={action.danger}
                  loading={action.loading}
                  disabled={action.disabled}
                  icon={action.icon}
                  size="small"
                  onClick={() => action.onClick(record)}
                >
                  {!action.icon && action.label}
                </Button>
              </Tooltip>
            ))}
          </Space>
        ),
      } as any)
    : undefined;

  const allColumns = actionColumn ? [...(columns || []), actionColumn] : columns;

  const rowHoverStyle: React.CSSProperties = {
    cursor: onRowClick ? 'pointer' : 'default',
  };

  return (
    <Table<T>
      columns={allColumns}
      dataSource={dataSource}
      loading={loading}
      rowKey={rowKey}
      scroll={scroll || { x: 'max-content' }}
      size={size as any}
      sticky={sticky}
      bordered
      rowClassName={(record, index) => {
        const baseClass = 'data-table-row';
        if (onRowClick) return `${baseClass} hoverable`;
        return baseClass;
      }}
      onRow={(record) => ({
        onClick: onRowClick ? () => onRowClick(record) : undefined,
        style: onRowClick ? rowHoverStyle : undefined,
      })}
      pagination={pagination === false ? false : {
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total) => `Tổng ${total} mục`,
        ...pagination,
        current: pagination?.current,
        pageSize: pagination?.pageSize,
        total: pagination?.total,
        onChange: pagination?.onChange,
      }}
      locale={{
        emptyText: emptyText || (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
            Kh�ng c� d? li?u
          </div>
        ),
      }}
    />
  );
}