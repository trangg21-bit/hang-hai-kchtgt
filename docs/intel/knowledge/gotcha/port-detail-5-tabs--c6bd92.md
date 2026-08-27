---
id: AM-c6bd92e83666a2e1
kind: gotcha
topic: port-detail-5-tabs
tags: []
importance: 0.8
agent: 
created: 2026-08-21T02:35:04.723Z
updated: 2026-08-21T02:55:00.417Z
---

Drawer chi tiết Cảng biển (PortListPage.tsx) có 5 tab: 'Danh sách kết cấu hạ tầng khác' (lọc 15 loại KCHT; dữ liệu thật chỉ từ berthCRUD.search({portId}) → 'Bến cảng' + waterZoneCRUD.findAll({portId}) → 'Khu neo đậu'), Thông tin quy hoạch, Vận hành khai thác, Bảo trì, Sự cố — 4 tab SAU là bảng rỗng vì backend chưa có entity/API. Nút mắt cột Thao tác MỞ DRAWER LỒNG tại chỗ (không navigate): bến cảng render BerthDetailContent (pages/port/BerthDetailContent.tsx — component đang được BerthList.tsx dùng thật), vùng nước render WaterZoneDetailMini (replicate modal WaterZoneListPage). Không được gán dữ liệu giả cho 4 tab rỗng.
