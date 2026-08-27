---
id: AM-baf7809c932c0ac5
kind: decision
topic: port-list-csv-sync
tags: []
importance: 0.8
agent: 
created: 2026-08-21T01:25:00.512Z
updated: 2026-08-21T02:43:37.902Z
---

Màn hình Quản lý cảng biển (PortListPage.tsx): bộ lọc Đơn vị quản lý dùng OrgUnitTreeSelect + showPath — thanh select hiển thị đường dẫn đầy đủ 'Cấp cao / Cấp con / Cấp cháu' sau khi chọn (dropdown vẫn tên ngắn). Các thay đổi khác đã làm: gộp filter tên/mã (param search), thứ tự cột STT/Đơn vị/Tên/Nhóm/Phân cấp/Tỉnh-Thành phố/Người cập nhật/Ngày cập nhật(170px)/Trạng thái(fixed right). Màn cùng menu (Pier, DryPort, WaterZone) chưa đồng bộ.
