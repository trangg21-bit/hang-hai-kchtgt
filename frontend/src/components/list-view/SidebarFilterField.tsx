import React from 'react';
import { filterLabelStyle, spaceFormField, spaceXs } from '../../tokens';

export interface SidebarFilterFieldProps {
  /** Nhãn trường lọc — hiển thị theo `filterLabelStyle` (navy, đậm, 13px). */
  label: React.ReactNode;
  /** Control của trường lọc: Input, Select, TreeSelect, RangePicker... */
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Một trường trong panel lọc của màn hình danh sách: nhãn + control.
 *
 * Gom phần nhãn/khoảng cách vào đây để mọi màn hình dùng chung một kiểu, thay vì
 * mỗi màn tự viết `<div><div style={filterLabelStyle}>...</div><Control/></div>`
 * rồi trôi dạt sang `fontSizeSm` / `textSecondary` / `spaceMd` khác nhau.
 */
export default function SidebarFilterField({ label, children, style }: SidebarFilterFieldProps) {
  return (
    <div style={{ marginBottom: spaceFormField, ...style }}>
      <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>{label}</div>
      {children}
    </div>
  );
}
