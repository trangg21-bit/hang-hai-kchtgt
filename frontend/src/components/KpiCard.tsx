import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

// ============================================================
// Types
// ============================================================
export interface KpiCardProps {
  label: string;
  value: number;
  subLabel?: string;
  trend?: { value: number; isUp: boolean };
  variant?: 'default' | 'warning' | 'action';
  onClick?: () => void;
}

// ============================================================
// Helpers
// ============================================================
function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

// ============================================================
// KpiCard
// ============================================================
export default function KpiCard({ label, value, subLabel, trend, variant = 'default', onClick }: KpiCardProps) {
  const isAction = variant === 'action';
  const isWarning = variant === 'warning';

  const cardStyle: React.CSSProperties = {
    background: isWarning ? '#FFF8E1' : '#FFFFFF',
    border: isWarning ? '0.5px solid #FFD54F' : '0.5px solid #E5E7EB',
    borderRadius: 12,
    padding: 14,
    cursor: isAction ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease',
    ...(isAction ? {} : {}),
  };

  const valueColor = isWarning ? '#F57F17' : '#1F2937';

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isAction) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        if (isAction) (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Label */}
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
        {label}
      </div>

      {/* Value */}
      <div style={{ fontSize: 24, fontWeight: 500, color: valueColor, lineHeight: 1.3 }}>
        {formatNumber(value)}
      </div>

      {/* Sub-label */}
      {subLabel && (
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
          {subLabel}
        </div>
      )}

      {/* Trend arrow + percentage */}
      {trend && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: trend.isUp ? '#1BAF7A' : '#E34948',
            marginTop: 6,
          }}
        >
          {trend.isUp ? (
            <ArrowUpOutlined style={{ fontSize: 10 }} />
          ) : (
            <ArrowDownOutlined style={{ fontSize: 10 }} />
          )}
          {trend.value.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
