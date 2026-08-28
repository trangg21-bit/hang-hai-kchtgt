import React, { useState } from 'react';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface StatusTab {
  key: string;
  label: string;
  count: number;
  /**
   * Màu ngữ nghĩa của tab, dùng cho badge (chế độ 'badge') hoặc cho con số
   * trong ngoặc (chế độ 'text'). Bỏ trống thì con số lấy màu của nhãn — chk làm
   * vậy với tab "Tất cả trạng thái".
   */
  color?: string;
  active?: boolean;
}

export interface StatusTabsProps {
  tabs: StatusTab[];
  onChange: (key: string) => void;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ tabs = [], onChange }) => {
  const {
    actionPrimary, fontWeightBold, fontWeightMedium,
    spaceLg, badgeBaseStyle, fontSizeMd, statusTabsCountMode,
  } = useThemeToken();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const mutedZeroColor = '#A1A5B7'; // Gợi ý 1: Màu xám mờ nhẹ khi số lượng = 0
  const inactiveTextColor = '#5E6278'; // Gợi ý 2: Màu xám vừa cho tab chưa chọn
  const baselineBorderColor = '#F1F1F4'; // Gợi ý 3: Đường kẻ đáy toàn hàng siêu mờ

  return (
    <div
      style={{
        display: 'flex',
        gap: spaceLg,
        justifyContent: 'center',
        flexWrap: 'wrap',
        borderBottom: `1px solid ${baselineBorderColor}`,
        paddingBottom: 0,
        position: 'relative',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.active ?? false;
        const isHovered = hoveredKey === tab.key;
        const tabColor = tab.color || actionPrimary;

        // Phân cấp màu chữ & viền chân theo trạng thái active/hover
        const labelColor = isActive ? tabColor : isHovered ? tabColor : inactiveTextColor;
        const countColor = tab.count === 0 ? mutedZeroColor : tabColor;

        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.key)}
            onMouseEnter={() => setHoveredKey(tab.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: isActive ? `${tabColor}10` : 'transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              padding: '6px 12px 8px 12px',
              marginBottom: -1, // Đè 1px gạch chân lên đường kẻ viền đáy
              fontSize: fontSizeMd,
              fontWeight: isActive ? fontWeightBold : fontWeightMedium,
              color: labelColor,
              borderBottom: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span>{tab.label}</span>
            {statusTabsCountMode === 'text' ? (
              // Kiểu CHK: `(5)` ngay sau nhãn. (0) màu xám mờ, > 0 màu ngữ nghĩa.
              <span
                style={{
                  color: countColor,
                  fontWeight: isActive || tab.count > 0 ? fontWeightBold : fontWeightMedium,
                  transition: 'color 0.2s ease',
                }}
              >
                ({tab.count})
              </span>
            ) : (
              <span
                style={{
                  ...badgeBaseStyle,
                  fontSize: fontSizeMd,
                  fontWeight: isActive ? fontWeightBold : fontWeightMedium,
                  background: tab.count === 0 ? '#F1F1F4' : `${tabColor}15`,
                  color: countColor,
                  border: `1px solid ${tab.count === 0 ? '#E2E8F0' : `${tabColor}30`}`,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StatusTabs;

