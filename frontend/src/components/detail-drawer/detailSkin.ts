// ── detail-drawer skin: SINGLE SOURCE of the KCHT detail-drawer visual grammar ─────────
// Chuẩn giao diện chi tiết thống nhất (BerthDetailContent làm tài liệu nguồn đang duy trì).
// Mọi *DetailContent của các module KCHT PHẢI import từ đây — KHÔNG tự định nghĩa lại
// sectionBox/sectionHeader/detailLabel/scroll trong từng file (tránh lệch giữa các màn).
import type { CSSProperties } from 'react';
import { colors, fontWeightBold } from '../../themetokenchk';

// Berth render chuẩn dùng nền chữ 13.5 (BerthDetailContent:22). Giữ cố định để section/title —> khớp.
const fontSizeMd = 13.5;

// Nhãn đề mục (vd "File đính kèm", "Thông tin vị trí GPS", "Người thay đổi") — nhất quán toàn drawer.
export const detailLabelStyle: CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: 13.5,
};

// Thẻ phân nhóm (Section Card) — nền trắng + viền bo 8 + đổ bóng nhẹ. Chuẩn Berth.
export const sectionBoxStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

// Đầu thẻ: hàng tiêu đề ngang, ngăn cách bằng vạch mảnh.
export const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

// Dòng tiêu đề nằm trong sectionHeaderStyle (màu chữ + cỡ + icon kề chữ).
export const sectionTitleStyle: CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// Nội dung cuộn của tab "Thông tin chung" (padding ngang + trục cuộn dọc dành drawer 190px đỉnh).
export const generalScrollerStyle: CSSProperties = {
  paddingTop: 6,
  paddingRight: 4,
  overflowY: 'auto',
  overflowX: 'hidden',
  maxHeight: 'calc(100vh - 190px)',
  minHeight: 350,
};
