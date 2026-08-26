---
id: AM-6946f61e1a7da3c5
kind: gotcha
topic: frontend-typecheck-gate
tags: []
importance: 0.85
agent: 
created: 2026-08-22T10:17:07.111Z
updated: 2026-08-22T10:17:07.111Z
---

Typecheck 'npx tsc --noEmit -p tsconfig.app.json' trong frontend/ LUÔN exit 2 với lỗi trải khắp ~100 file toàn repo (Guard.tsx, theme.ts, GISChartView, test files...) — đây là trạng thái CÓ SẴN, repo không bao giờ pass tsc clean. Gate thực tế của dự án là 'npx vite build' (exit 0 khi OK). Khi sửa frontend: chỉ cần chạy vite build để xác minh; đừng báo 'tsc pass sạch' vì nó luôn fail sẵn.
