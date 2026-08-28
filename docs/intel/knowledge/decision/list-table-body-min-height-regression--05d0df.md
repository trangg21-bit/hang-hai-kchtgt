---
id: AM-05d0df0466ac5a3f
kind: decision
topic: list-table-body-min-height-regression
tags: []
importance: 0.8
agent: 
created: 2026-08-20T05:16:27.305Z
updated: 2026-08-20T05:16:27.305Z
---

index.css từng có rule .list-view-table .ant-table-body { min-height: var(--list-table-scroll-y) } (calc(100vh-410px)) — vì min-height thắng max-height trong CSS nên thân bảng luôn cao cố định dù ít bản ghi → khoảng trống lớn dưới bản ghi cuối (user phàn nàn 2026-08-20). Đã XÓA rule này; thân bảng giờ co sát nội dung khi ít bản ghi (max-height = scroll.y chỉ chặn trên), cuộn trong bảng khi nhiều. Empty state vẫn giữ chiều cao đầy đủ qua .ant-table-placeholder > td height var (convention AGENTS.md giữ nguyên). Verify: npm run build (vite) pass. KHÔNG thêm lại min-height viewport vào .ant-table-body.
