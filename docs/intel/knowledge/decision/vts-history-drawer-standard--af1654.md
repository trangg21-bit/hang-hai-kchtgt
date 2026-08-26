---
id: AM-af16546738ca9671
kind: decision
topic: vts-history-drawer-standard
tags: []
importance: 0.7
agent: 
created: 2026-08-17T09:40:38.349Z
updated: 2026-08-17T09:51:42.489Z
---

Drawer lịch sử Hệ thống VTS (VtsSystemList.tsx) đã khớp 100% cấu trúc Cảng biển (PortListPage.tsx): title Space + HistoryOutlined + fontSizeXl + badge 'Tổng cộng N', Radio.Group tab 'Bản ghi hiện tại' ẩn trong div display:none kèm Tag đếm nhóm, nút Tìm kiếm + popupClassName history-dt-popup, fmtTime 'HH:mm DD/MM/YYYY', badge Thêm mới/Chỉnh sửa (isCreate), label Người cập nhật/Đơn vị đậm, card gradient bar actionPrimary thay borderLeft, informationTitle fontSizeMd+1, create 2 cột/edit 4 cột, formatHistoryValue cho array/số, HISTORY_FIELD_ORDER theo thứ tự form VTS. Tab 'Tất cả bản ghi' vẫn ẩn vì VTS chưa có backend getAllHistory.
