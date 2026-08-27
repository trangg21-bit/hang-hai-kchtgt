---
id: AM-077712f715c799b2
kind: gotcha
topic: antd-table-pagination-empty
tags: []
importance: 0.7
agent: 
created: 2026-08-21T06:46:06.954Z
updated: 2026-08-21T06:46:06.954Z
---

antd Table ẩn thanh phân trang khi dataSource rỗng — muốn thanh phân trang LUÔN hiển thị (kể cả bảng trống) phải dùng component Pagination dùng chung frontend/src/components/list-view/Pagination.tsx bên dưới bảng (pagination={false} trên Table) và tự slice trang. Mẫu: PagedTabTable trong BerthDetailContent.tsx.
