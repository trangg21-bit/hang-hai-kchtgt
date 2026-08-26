---
id: AM-ff65cee5fe41f8bf
kind: decision
topic: antd-sort-icon-after-title-override
tags: []
importance: 0.7
agent: 
created: 2026-08-14T07:23:42.460Z
updated: 2026-08-14T07:23:42.460Z
---

antd v6 default CSS: .ant-table-column-sorters { justify-content: space-between } + .ant-table-column-title { flex: 1 } đẩy icon sort ra mép phải cột, tạo khoảng trống khi cột thừa chiều rộng. Đã override trong theme.ts globalCssVars (block .list-view-table): .list-view-table .ant-table-thead .ant-table-column-sorters { justify-content: flex-start } + .ant-table-thead .ant-table-column-title { flex: 0 0 auto } để gắn icon sort ngay sau title. DataTable (components/list-view) gắn className list-view-table.
