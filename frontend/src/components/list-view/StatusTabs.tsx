import React, { useRef, useEffect } from 'react';
import {
  actionPrimary, textSecondary, fontWeightBold, fontWeightMedium,
  badgeBaseStyle, fontSizeMd,
} from '../../themetokenchk';

export interface StatusTab {
  key: string;
  label: string;
  count: number;
  color?: string;
  active?: boolean;
}

export interface StatusTabsProps {
  tabs: StatusTab[];
  onChange: (key: string) => void;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ tabs = [], onChange }) => {
  const safeTabs: StatusTab[] = Array.isArray(tabs)
    ? tabs
    : Array.isArray((tabs as any)?.tabs)
      ? (tabs as any).tabs
      : [];

  const containerRef = useRef<HTMLDivElement>(null);

  // Cuộn ngang bằng con lăn chuột mượt mà
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      <style>{`
        .chk-status-tabs-container {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: center !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
        }
        .chk-status-tabs-container::-webkit-scrollbar {
          height: 6px !important;
          display: block !important;
        }
        .chk-status-tabs-container::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .chk-status-tabs-container::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .chk-status-tabs-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .chk-status-tabs-container > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="chk-status-tabs-container"
        style={{
          display: 'flex',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          flexWrap: 'nowrap',
          justifyContent: 'safe center',
          alignItems: 'center',
          gap: 20,
          padding: '2px 16px 6px 16px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f8fafc',
        }}
      >
      {safeTabs.map((tab) => {
        const tabColor = tab.color || actionPrimary;
        const isActive = tab.active ?? false;
        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontSize: fontSizeMd,
              fontWeight: isActive ? fontWeightBold : fontWeightMedium,
              color: isActive ? actionPrimary : textSecondary,
              borderBottom: isActive ? `2px solid ${actionPrimary}` : '2px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                ...badgeBaseStyle,
                fontSize: fontSizeMd,
                fontWeight: isActive ? fontWeightBold : fontWeightMedium,
                background: `${tabColor}15`,
                color: tabColor,
              }}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
    </>
  );
};

export default StatusTabs;


