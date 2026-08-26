---
id: AM-e988e41b37794817
kind: fact
topic: berth-pages-duplication
tags: []
importance: 0.7
agent: 
created: 2026-08-21T04:33:23.149Z
updated: 2026-08-21T04:33:23.149Z
---

Có HAI trang bến cảng: (1) pages/port/BerthList.tsx + BerthForm.tsx — LÀ trang được route /berth (App.tsx:188), đúng đặc tả CSV 51 trường; (2) app/berth/BerthListPage.tsx — KHÔNG được route (orphan, form nội tuyến cũ). Khi sửa form bến cảng chỉ đụng pages/port/*, không đụng app/berth/*.
