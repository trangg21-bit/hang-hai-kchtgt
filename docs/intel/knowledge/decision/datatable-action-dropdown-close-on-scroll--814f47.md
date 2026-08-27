---
id: AM-814f47258c5d1e60
kind: decision
topic: datatable-action-dropdown-close-on-scroll
tags: []
importance: 0.7
agent: 
created: 2026-08-14T01:38:46.534Z
updated: 2026-08-14T01:38:46.534Z
---

Dropdown action (cột ⋮) trong DataTable.tsx (frontend/src/components/list-view) đã chuyển sang controlled `open` state + `document.addEventListener('scroll', handler, true)` (capture để bắt scroll của .ant-table-body) để tự đóng menu khi cuộn. Không dùng getPopupContainer. Fix 2026-08-14: component RowActionDropdown, bỏ qua scroll có target nằm trong .ant-dropdown.
