---
id: AM-86c8d1f089044663
kind: decision
topic: buoy-detail-gis-tab-parity
tags: []
importance: 0.8
agent: 
created: 2026-08-19T04:26:40.481Z
updated: 2026-08-19T06:12:20.514Z
---

Tab 'Thông tin vị trí' của BuoyDetailContent (services/buoy) ĐÃ được thêm giống BerthDetailContent (bến cảng): 6 tab general/technical/gis/approval/audit/files, tab gis hiển thị Loại đối tượng + Biểu tượng bản đồ (ảnh qua symbolMap/symbolImageMap) + Hệ quy chiếu + Quy tắc hiển thị + bảng Tọa độ GPS DMS 3 ô InputNumber readOnly (KHÔNG phải text gọn), bỏ dòng Kinh độ/Vĩ độ thập phân ở tab Kỹ thuật, tabBarStyle sticky. BuoyListPage: ddToDms đã có sẵn module-level; symbolMap/symbolImageMap = useMemo từ state symbols (symbolService.list pageSize 1000). Lưu ý: thay đổi này verbose (~110 dòng) nên triage C0 tính theo file nhưng vượt LOC budget 50 → phải re-triage sau tripwire.
