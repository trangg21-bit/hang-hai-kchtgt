import React from 'react';
import {
  actionPrimary, textSecondary, fontWeightBold, fontWeightMedium,
  spaceLg, badgeBaseStyle, fontSizeMd,
} from '../../tokens';

export interface StatusTab {
  key: string;
  label: string;
  count: number;
  color?: string;
  active?: boolean;
}

export interface StatusTabsProps {
  tabs?: StatusTab[];
  items?: Array<{ key: string; label: string; count?: number; color?: string }>;
  activeKey?: string;
  onChange: (key: string) => void;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ tabs, items, activeKey, onChange }) => {
  const rawList: StatusTab[] = tabs ?? (items ? items.map((i) => ({
    key: i.key,
    label: i.label,
    count: i.count ?? 0,
    color: i.color ?? textSecondary,
    active: i.key === activeKey,
  })) : []);

  return (
    <div style={{
      display: 'flex', gap: spaceLg, justifyContent: 'center', flexWrap: 'wrap',
    }}>
      {rawList.map((tab) => {
        const isActive = tab.active ?? (tab.key === activeKey);
        const color = tab.color || textSecondary;
        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: 'none', background: 'none', cursor: 'pointer',
              padding: '4px 0', fontSize: fontSizeMd,
              fontWeight: isActive ? fontWeightBold : fontWeightMedium,
              color: isActive ? actionPrimary : textSecondary,
              borderBottom: isActive ? `2px solid ${actionPrimary}` : '2px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
            }}>
            <span>{tab.label}</span>
            <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd,
              background: `${color}15`, color }}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusTabs;
