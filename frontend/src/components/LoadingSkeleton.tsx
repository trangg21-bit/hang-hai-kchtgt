import { Skeleton, Card, Space } from 'antd';

interface Props {
  rows?: number;
  rowCount?: number;
  columnCount?: number;
  type?: 'card' | 'table' | 'form';
}

export default function LoadingSkeleton({ rows = 5, rowCount, columnCount = 1, type = 'table' }: Props) {
  const actualRows = rowCount ?? rows;

  if (type === 'form') {
    return (
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Skeleton.Input active block />
          <Skeleton.Input active block />
          <Skeleton.Input active block size="large" style={{ width: 200 }} />
          <Skeleton.Button active style={{ width: 120 }} />
        </Space>
      </Card>
    );
  }

  if (type === 'card') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {Array.from({ length: actualRows }).map((_, index) => (
          <Card key={index}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </Space>
    );
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          {Array.from({ length: columnCount }).map((_, index) => (
            <Skeleton.Input key={index} active style={{ width: index === 0 ? 240 : 140 }} />
          ))}
          <Skeleton.Button active style={{ width: 80 }} />
        </Space>
        {Array.from({ length: actualRows }).map((_, index) => (
          <Skeleton key={index} active avatar paragraph={{ rows: 0 }} />
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton.Input active style={{ width: 200 }} />
        </div>
      </Space>
    </Card>
  );
}
