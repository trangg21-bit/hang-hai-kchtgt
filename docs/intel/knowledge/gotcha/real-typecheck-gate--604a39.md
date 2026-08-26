---
id: AM-604a39f8c78c2680
kind: gotcha
topic: real-typecheck-gate
tags: []
importance: 0.85
agent: 
created: 2026-08-18T04:30:51.001Z
updated: 2026-08-18T04:30:51.001Z
---

Gate typecheck thật của frontend = `npx tsc -p tsconfig.app.json --noEmit`; bare `npx tsc --noEmit` trên tsconfig.json solution-style (files:[]) KHÔNG check file nào và luôn pass giả. Baseline tsc toàn dự án ĐỎ sẵn (~600 lỗi; staged changeset M-1010: BerthList 36 / PierList 23 / PortListPage 54 lỗi, chưa từng được typecheck). Gate thật dự án đang dùng: `npm run build` (vite build — pass) + `npm run lint` (eslint).
