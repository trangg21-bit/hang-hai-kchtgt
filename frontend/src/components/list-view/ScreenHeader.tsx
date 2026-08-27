import React from 'react';
import { Button, Breadcrumb } from 'antd';
import { useThemeToken } from '../../context/ThemeTokenContext';

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

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ breadcrumb, breadcrumbs, actions }) => {
  const t = useThemeToken();
  const items = breadcrumbs || breadcrumb || [];

  const base: React.CSSProperties = {
    borderRadius: t.buttonRadius,
    fontWeight: t.fontWeightMedium,
    height: 40,
    fontSize: t.fontSizeMd,
  };
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: t.actionPrimary, color: '#FFFFFF', border: 'none' },
    outline: { ...base, background: 'transparent', color: t.actionPrimary, border: `1px solid ${t.actionPrimary}` },
    subtle: { ...base, background: 'transparent', color: t.textSecondary, border: `1px solid ${t.borderDefault}` },
    default: { ...base, background: 'transparent', color: t.textSecondary, border: `1px solid ${t.borderDefault}` },
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      {items.length > 0 && (
        <Breadcrumb
          separator={<span style={{ color: t.textTertiary }}>&gt;</span>}
          items={items.map((item, idx) => ({
            title: (
              <span style={{
                color: idx === items.length - 1 ? t.colors.sidebarBg : t.textSecondary,
                fontWeight: idx === items.length - 1 ? t.fontWeightBold : t.fontWeightMedium,
                fontSize: idx === items.length - 1 ? t.fontSizeBreadcrumbLast : t.fontSizeBreadcrumb,
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
          <div style={{ display: 'flex', gap: t.spaceSm, flexShrink: 0, marginLeft: 'auto' }}>
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
