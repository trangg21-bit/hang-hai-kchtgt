---
id: AM-e677d0fc94344417
kind: decision
topic: tab-table-pagination-20-and-select-caret
tags: []
importance: 0.8
agent: 
created: 2026-08-22T06:50:09.939Z
updated: 2026-08-22T06:50:09.939Z
---

Các bảng con trong tab (PagedTabTable trong DetailContent + PagedTable dùng chung) đã đổi phân trang mặc định từ 5 lên 20 (pageSizeOptions [10,20,50]) — áp dụng cho Cảng biển (PortListPage), Bến cảng (BerthDetailContent), Cầu cảng (PierDetailContent), Cảng cạn (DryPortDetailContent), Nhà trạm phao tiêu (BuoyStationDetailContent), Phao tiêu (BuoyDetailContent) + các form (Port/Berth/Pier/DryPort/BuoyStation/Buoy FormContent dùng PagedTable). CSS ẩn caret Select đã thêm vào theme.ts globalCssVars: .ant-select:has(.ant-select-selection-item) .ant-select-selection-search-input { caret-color: transparent; }
