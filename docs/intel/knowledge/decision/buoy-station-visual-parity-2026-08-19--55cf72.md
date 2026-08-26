---
id: AM-55cf72833a5a6394
kind: decision
topic: buoy-station-visual-parity-2026-08-19
tags: []
importance: 0.8
agent: 
created: 2026-08-19T09:14:03.498Z
updated: 2026-08-19T09:14:03.498Z
---

Visual parity chi tiết Nhà trạm phao tiêu vs phao tiêu ĐÃ SỬA (2026-08-19): (1) BuoyStationList: cột Tên/Mã gộp 1 cột như buoy (link bold actionPrimary + code mờ 0.85), bỏ cột Mã Tag; create/edit Drawer dùng {drawerProps}+drawerTitleStyle+drawerCloseBtnStyle+drawerFooterStyle (footer căn GIỮA gap spaceSm)+outlineButtonStyle/primaryButtonStyle+{...primaryButtonStyle, background: statusOperational} + <style>{requiredMarkStyle}</style>; thêm Submit Modal 'Xác nhận gửi Cảng vụ phê duyệt' (trước đây gửi thẳng); Approve modal title 'Xác nhận Cảng vụ/Cục phê duyệt', nút Xác nhận bg statusAttention(L1)/statusOperational(L2); delete/reject modal text chuẩn 'Vui lòng nhập...'. (2) FormContent: GPS+files table size middle bordered list-view-table + onHeaderCell header style; DatePicker popupClassName buoy-station-date-picker + style today-btn colors.info. (3) DetailContent: Mã pill actionPrimary, Tên bold, collapse '▼ Thông tin hệ thống' theo mẫu buoy (marginTop 10, paddingLeft 12, màu #1677ff khi mở, fontSizeMd+1), GPS DMS InputNumber readOnly, tabBar surfaceCard. CÒN LẠI: Nội dung phê duyệt input (cần backend level1/2ApprovalContent+migration), province→mã TCTK (user hoãn). Gate: npm run build exit 0.
