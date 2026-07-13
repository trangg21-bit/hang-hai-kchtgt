import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import {
  actionPrimary,
  statusOperational,
  statusCritical,
  statusAttention,
  textPrimary,
  textSecondary,
  surfaceCard,
  borderDefault,
  radiusLg,
  shadowSm,
  spaceXs,
  spaceSm,
  spaceMd,
  fontSizeSm,
  fontSizeStat,
  fontWeightMedium,
  fontWeightBold,
} from '../tokens-dashboard';

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
    background: isWarning ? `${statusAttention}18` : surfaceCard,
    border: isAction
      ? `0.5px solid ${actionPrimary}`
      : isWarning
        ? `0.5px solid ${statusAttention}`
        : `0.5px solid ${borderDefault}`,
    borderRadius: radiusLg,
    padding: spaceMd,
    cursor: isAction ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease',
  };

  const valueColor = isWarning ? statusAttention : isAction ? actionPrimary : textPrimary;

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isAction) (e.currentTarget as HTMLDivElement).style.boxShadow = shadowSm;
      }}
      onMouseLeave={(e) => {
        if (isAction) (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Label */}
      <div style={{ fontSize: fontSizeSm, color: textSecondary, marginBottom: spaceXs }}>
        {label}
      </div>

      {/* Value */}
      <div style={{ fontSize: fontSizeStat, fontWeight: fontWeightMedium, color: valueColor, lineHeight: 1.3 }}>
        {formatNumber(value)}
      </div>

      {/* Sub-label */}
      {subLabel && (
        <div style={{ fontSize: fontSizeSm, color: textSecondary, marginTop: spaceXs }}>
          {subLabel}
        </div>
      )}

      {/* Trend arrow + percentage */}
      {trend && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spaceXs,
            fontSize: fontSizeSm,
            fontWeight: fontWeightBold,
            color: trend.isUp ? statusOperational : statusCritical,
            marginTop: spaceSm,
          }}
        >
          {trend.isUp ? (
            <ArrowUpOutlined style={{ fontSize: fontSizeSm }} />
          ) : (
            <ArrowDownOutlined style={{ fontSize: fontSizeSm }} />
          )}
          {trend.value.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
