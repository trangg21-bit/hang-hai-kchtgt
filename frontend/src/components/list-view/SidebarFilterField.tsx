import React from 'react';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface SidebarFilterFieldProps {
  /** Nhãn trường lọc — hiển thị theo `filterLabelStyle` (navy, đậm, 13px). */
  label: React.ReactNode;
  /** Control của trường lọc: Input, Select, TreeSelect, RangePicker... */
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Khoảng cách dọc giữa nhãn và control. Mặc định 4px (spaceXs). */
  labelGap?: number;
}

/**
 * Một trường trong panel lọc của màn hình danh sách: nhãn + control.
 *
 * Gom phần nhãn/khoảng cách vào đây để mọi màn hình dùng chung một kiểu, thay vì
 * mỗi màn tự viết `<div><div style={filterLabelStyle}>...</div><Control/></div>`
 * rồi trôi dạt sang `fontSizeSm` / `textSecondary` / `spaceMd` khác nhau.
 */
export default function SidebarFilterField({ label, children, style, labelGap }: SidebarFilterFieldProps) {
  const { filterLabelStyle, spaceFormField, spaceXs } = useThemeToken();
  const labelGapValue = labelGap ?? spaceXs;
  return (
    <div style={{ marginBottom: spaceFormField, ...style }}>
      <div style={{ ...filterLabelStyle, marginBottom: labelGapValue }}>{label}</div>
      {children}
    </div>
  );
}
