import React from 'react';
import { listPageContainerStyle } from '../../tokens';

export interface ListPageContainerProps {
  children: React.ReactNode;
  /** Ghi đè bổ sung khi màn hình có nhu cầu đặc biệt (hiếm khi cần). */
  style?: React.CSSProperties;
}

/**
 * Khung ngoài chuẩn của mọi màn hình danh sách.
 *
 * `FilterTableLayout` dùng `flex: 1` + `minHeight: 0` nên khung cha bắt buộc phải
 * là flex column có chiều cao ràng buộc; nếu không, panel lọc và bảng sẽ co lại
 * theo nội dung và màn hình trông lệch hẳn so với các màn còn lại.
 *
 * Trước đây mỗi màn tự lặp lại `height: 'calc(100% - 32px)'`; gom về đây để chỉ
 * còn một nguồn duy nhất.
 */
export default function ListPageContainer({ children, style }: ListPageContainerProps) {
  return <div style={{ ...listPageContainerStyle, ...style }}>{children}</div>;
}
