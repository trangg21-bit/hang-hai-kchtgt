import { Skeleton, Card, Row, Col, Space } from 'antd';

interface Props {
  rows?: number;
  type?: 'card' | 'table' | 'form';
}

export default function LoadingSkeleton({ rows = 5, type = 'table' }: Props) {
  if (type === 'card') {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: rows }).map((_, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (type === 'form') {
    return (
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Skeleton.Input active block />
          <Skeleton.Input active block />
          <Skeleton.Input active block />
          <Skeleton.Input active block size="large" style={{ width: 200 }} />
          <Skeleton.Button active style={{ width: 120 }} />
        </Space>
      </Card>
    );
  }

  // table skeleton
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* search bar skeleton */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Skeleton.Input active style={{ width: 240 }} />
          <Skeleton.Input active style={{ width: 140 }} />
          <Skeleton.Button active style={{ width: 80 }} />
        </div>
        {/* table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} active avatar paragraph={{ rows: 0 }} />
        ))}
        {/* pagination skeleton */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Skeleton.Input active style={{ width: 200 }} />
        </div>
      </Space>
    </Card>
  );
}
