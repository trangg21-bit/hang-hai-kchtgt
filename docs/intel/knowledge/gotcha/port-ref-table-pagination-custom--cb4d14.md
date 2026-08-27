---
id: AM-cb4d14cb8f7d809d
kind: gotcha
topic: port-ref-table-pagination-custom
tags: []
importance: 0.8
agent: 
created: 2026-08-26T02:45:18.272Z
updated: 2026-08-26T02:45:18.272Z
---

Chi tiết cảng (PortRefTable/PagedTabTable/DryPortRefTable) PHẢI dùng component Pagination custom frontend/src/components/list-view/Pagination.tsx ('Tổng cộng: N' + nút tròn ⏮◀▶⏭ + Select 10/20/50/100), không dùng Pagination antd. DryPortDetailContent từng dùng antd Pagination → giao diện phân trang khác hẳn cảng biển/bến cảng (đã sửa 2026-08-26: import '../../components/list-view/Pagination'). Khi thêm bảng tham chiếu mới vào DetailContent, copy chuẩn PortRefTable.
