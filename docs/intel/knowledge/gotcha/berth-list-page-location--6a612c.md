---
id: AM-6a612c0d09661bad
kind: gotcha
topic: berth-list-page-location
tags: []
importance: 0.9
agent: 
created: 2026-08-21T05:09:23.569Z
updated: 2026-08-21T05:59:50.360Z
---

Route /berth (Quản lý bến cảng) render frontend/src/pages/port/BerthListPage.tsx (lazy import App.tsx:49; đã đổi tên từ BerthList.tsx). Thư mục app/berth/ (BerthListPage cũ, types, api, schema) là DEAD CODE — không được import ở đâu.
