import React from 'react';
import { Button, Breadcrumb } from 'antd';
import {
  textSecondary, textTertiary, fontWeightBold, fontWeightMedium,
  fontSizeLg, fontSizeMd, spaceSm, actionPrimary, borderDefault,
  radiusPill,
} from '../../tokens';
import { colors } from '../../theme';

export interface ScreenHeaderProps {
  breadcrumb: { label: string; path?: string }[];
  actions?: { key: string; label: string; icon?: React.ReactNode; variant: 'primary' | 'outline' | 'subtle'; onClick: () => void; borderColor?: string; color?: string; }[];
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: actionPrimary, color: '#FFFFFF', borderRadius: radiusPill, border: 'none', fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
  outline: { background: 'transparent', color: actionPrimary, border: `1px solid ${actionPrimary}`, borderRadius: radiusPill, fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
  subtle: { background: 'transparent', color: textSecondary, border: `1px solid ${borderDefault}`, borderRadius: radiusPill, fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ breadcrumb, actions }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
    <Breadcrumb
      separator={<span style={{ color: textTertiary }}>&gt;</span>}
      items={breadcrumb.map((item, idx) => ({
        title: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{item.label}</span>,
      }))}
    />
    {actions && actions.length > 0 && (
      <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0, marginLeft: 'auto' }}>
        {actions.map((action) => (
          <Button key={action.key} icon={action.icon} onClick={action.onClick}
            style={{ ...variantStyles[action.variant], ...(action.borderColor ? { borderColor: action.borderColor } : {}), ...(action.color ? { color: action.color } : {}) }}
            type={action.variant === 'primary' ? 'primary' : 'default'}>
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
);

export default ScreenHeader;
