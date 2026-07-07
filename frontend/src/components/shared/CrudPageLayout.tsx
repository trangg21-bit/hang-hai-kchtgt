import { Card, Button, Space, Table, Breadcrumb } from 'antd';
import type { TableProps, BreadcrumbProps } from 'antd';
import type { ReactNode } from 'react';

interface CrudPageLayoutProps {
  title: string;
  breadcrumbs: BreadcrumbProps['items'];
  filterBar: ReactNode;
  tableProps: TableProps<unknown>;
  canCreate?: boolean;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export default function CrudPageLayout({
  title,
  breadcrumbs,
  filterBar,
  tableProps,
  canCreate = false,
  onCreateClick,
  createButtonText = 'Thêm mới',
}: CrudPageLayoutProps) {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />

      {/* Title */}
      <h1 style={{ marginBottom: '24px' }}>{title}</h1>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '24px' }}>
        {filterBar}
      </Card>

      {/* Table */}
      <Card>
        <Space style={{ marginBottom: '16px' }}>
          {canCreate && (
            <Button type="primary" onClick={onCreateClick}>
              {createButtonText}
            </Button>
          )}
        </Space>

        <Table
          {...tableProps}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            ...tableProps.pagination,
          }}
        />
      </Card>
    </div>
  );
}
