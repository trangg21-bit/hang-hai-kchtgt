import React from 'react';
import { colors, fontWeightBold, fontSizeMd } from '../../tokens';

/**
 * Nhãn chuẩn cho `Form.Item` trên form thêm/sửa hồ sơ KCHT.
 *
 * Cụm `label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold,
 * fontSize: fontSizeMd }}>…</span>` đang được chép tay ở hơn 18 màn dưới tên `labelProps`.
 * Màn nào quên chép (ví dụ Đài vệ tinh Inmarsat) thì nhãn rơi về mặc định của Ant Design —
 * xám, chữ thường, 14px — nên nhìn lệch hẳn so với các màn còn lại.
 *
 * Dùng:
 * ```tsx
 * <Form.Item name="orgUnitId" {...formLabelProps('Đơn vị quản lý')} rules={[...]}>
 * ```
 */
export function formLabelProps(text: React.ReactNode) {
  return {
    label: (
      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
        {text}
      </span>
    ),
  };
}

export default formLabelProps;
