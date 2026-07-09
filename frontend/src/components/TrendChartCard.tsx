import { Card, Skeleton, Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

// ============================================================
// Types
// ============================================================
export interface TrendChartCardProps {
  title: string;
  legendItems?: { color: string; label: string }[];
  loading?: boolean;
  empty?: boolean;
  error?: boolean;
  onRetry?: () => void;
  height?: number;
  children: ReactNode;
}

// ============================================================
// TrendChartCard
// ============================================================
export default function TrendChartCard({
  title,
  legendItems,
  loading = false,
  empty = false,
  error = false,
  onRetry,
  height = 240,
  children,
}: TrendChartCardProps) {
  const cardBodyStyle: React.CSSProperties = {
    padding: 14,
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: '0.5px solid #E5E7EB',
    height: '100%',
  };

  const renderContent = () => {
    if (loading) {
      return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height,
            gap: 8,
          }}
        >
          <WarningOutlined style={{ fontSize: 24, color: '#E34948' }} />
          <span style={{ fontSize: 13, color: '#6B7280' }}>Đã xảy ra lỗi</span>
          {onRetry && (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Thử lại
            </Button>
          )}
        </div>
      );
    }

    if (empty) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24, opacity: 0.3 }}>📭</span>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Không có dữ liệu</span>
        </div>
      );
    }

    return children;
  };

  return (
    <Card
      title={
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
      }
      style={cardStyle}
      styles={{ body: cardBodyStyle }}
    >
      {/* Custom legend */}
      {legendItems && legendItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {legendItems.map((item, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: '#6B7280' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content area */}
      {renderContent()}
    </Card>
  );
}
