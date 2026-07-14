import { Card, Skeleton, Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import {
  statusCritical,
  radiusSm,
  radiusMd,
  spaceSm,
  spaceMd,
  spaceLg,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontWeightMedium,
  textSecondary,
  cardStyle,
} from '../tokens-dashboard';

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
    padding: spaceMd,
  };

  const outerCardStyle: React.CSSProperties = {
    ...cardStyle,
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
            gap: spaceSm,
          }}
        >
          <WarningOutlined style={{ fontSize: fontSizeXl, color: statusCritical }} />
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>Đã xảy ra lỗi</span>
          {onRetry && (
            <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
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
            gap: spaceSm,
          }}
        >
          <span style={{ fontSize: fontSizeXl, opacity: 0.3 }}>📭</span>
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>Không có dữ liệu</span>
        </div>
      );
    }

    return children;
  };

  return (
    <Card
      title={
        <span style={{ fontSize: fontSizeLg, fontWeight: fontWeightMedium }}>{title}</span>
      }
      style={outerCardStyle}
      styles={{ body: cardBodyStyle }}
    >
      {/* Custom legend */}
      {legendItems && legendItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: spaceLg,
            marginBottom: spaceMd,
            flexWrap: 'wrap',
          }}
        >
          {legendItems.map((item, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: radiusSm,
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content area */}
      {renderContent()}
    </Card>
  );
}
