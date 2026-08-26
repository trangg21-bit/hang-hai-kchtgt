---
id: AM-3d4cfa34135d26f0
kind: gotcha
topic: frontend-typecheck-baseline
tags: []
importance: 0.8
agent: 
created: 2026-08-17T09:44:02.672Z
updated: 2026-08-17T09:44:02.672Z
---

Frontend KHÔNG typecheck sạch được: `npx tsc --noEmit -p tsconfig.app.json` exit 2 với ~90 file lỗi (baseline cũ: TS6133 unused, TS7006 implicit any, TS2322 columns->DataTableColumn[] khắp dự án). package.json KHÔNG có script typecheck — gate thực tế là `npm run build` (vite build, không typecheck). VtsSystemList.tsx có sẵn 7 lỗi TS (Space/ErrorState/statusDraft/formatDate/errorMessage unused, param s implicit any, columns type mismatch). Khi verify frontend, dùng vite build làm gate, đừng lấy tsc --noEmit làm tiêu chí pass.
