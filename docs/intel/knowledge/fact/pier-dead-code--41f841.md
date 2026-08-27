---
id: AM-41f841196e89f1f6
kind: fact
topic: pier-dead-code
tags: []
importance: 0.7
agent: 
created: 2026-08-22T01:20:16.998Z
updated: 2026-08-22T02:06:47.867Z
---

2026-08-22: Đã áp dụng chuẩn 3 tab (Vận hành khai thác/Bảo trì/Sự cố) cho thêm 2 module: services/buoy-station/BuoyStationDetailContent.tsx (Nhà trạm phao tiêu) + services/buoy/BuoyDetailContent.tsx (Quản lý phao tiêu) — thêm PagedTabTable cục bộ (phân trang 5/page + pageSizeOptions), cột Thao tác '—', empty state FileOutlined 'Chưa có dữ liệu', fallback '—'. Trước đó đã chuẩn hóa: PierDetailContent (4 tab mới), DryPortDetailContent (align style), PortListPage PortRefTable (tên cột ngắn + render chuẩn). Hiện 5 module đều có 3 tab đồng bộ: cảng biển, bến cảng, cầu cảng, phao tiêu, nhà trạm phao tiêu.
