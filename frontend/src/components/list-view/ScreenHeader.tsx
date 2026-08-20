import React from 'react';
import { Button, Breadcrumb } from 'antd';
import {
  textSecondary, textTertiary, fontWeightBold, fontWeightMedium,
  fontSizeLg, fontSizeXl, fontSizeMd, spaceSm, actionPrimary, borderDefault,
  radiusPill,
} from '../../tokens';
import { colors } from '../../theme';

export interface ScreenHeaderAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'subtle' | 'default';
  onClick: () => void;
  borderColor?: string;
  color?: string;
}

export interface ScreenHeaderProps {
  title?: string;
  breadcrumb?: { label: string; href?: string; path?: string }[];
  breadcrumbs?: { label: string; href?: string; path?: string }[];
  actions?: React.ReactNode | ScreenHeaderAction[];
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: actionPrimary, color: '#FFFFFF', borderRadius: radiusPill, border: 'none', fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
  outline: { background: 'transparent', color: actionPrimary, border: `1px solid ${actionPrimary}`, borderRadius: radiusPill, fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
  subtle: { background: 'transparent', color: textSecondary, border: `1px solid ${borderDefault}`, borderRadius: radiusPill, fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
  default: { background: 'transparent', color: textSecondary, border: `1px solid ${borderDefault}`, borderRadius: radiusPill, fontWeight: fontWeightMedium, height: 40, fontSize: fontSizeMd },
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ breadcrumb, breadcrumbs, actions }) => {
  const items = breadcrumbs || breadcrumb || [];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      {items.length > 0 && (
        <Breadcrumb
          separator={<span style={{ color: textTertiary }}>&gt;</span>}
          items={items.map((item, idx) => ({
            title: (
              <span style={{
                color: idx === items.length - 1 ? colors.sidebarBg : textSecondary,
                fontWeight: idx === items.length - 1 ? fontWeightBold : fontWeightMedium,
                fontSize: idx === items.length - 1 ? 16 : 14,
                lineHeight: '20px',
              }}>
                {item.label}
              </span>
            ),
          }))}
        />
      )}
      {actions && (
        Array.isArray(actions) ? (
          <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0, marginLeft: 'auto' }}>
            {actions.map((action: any) => (
              <Button key={action.key} icon={action.icon} onClick={action.onClick}
                style={{ ...variantStyles[action.variant], ...(action.borderColor ? { borderColor: action.borderColor } : {}), ...(action.color ? { color: action.color } : {}) }}
                type={action.variant === 'primary' ? 'primary' : 'default'}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : (
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            {actions}
          </div>
        )
      )}
    </div>
  );
};

export default ScreenHeader;
