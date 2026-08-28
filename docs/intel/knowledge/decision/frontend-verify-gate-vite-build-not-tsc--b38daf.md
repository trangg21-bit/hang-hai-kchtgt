---
id: AM-b38dafa3c632a7e1
kind: decision
topic: frontend-verify-gate-vite-build-not-tsc
tags: []
importance: 0.75
agent: 
created: 2026-08-14T01:38:47.054Z
updated: 2026-08-14T01:38:47.054Z
---

Frontend: `npx tsc --noEmit -p tsconfig.app.json` KHÔNG sạch baseline — có hàng trăm lỗi TS6133 (import unused) + 2 lỗi PierFormProps trong App.tsx tồn tại sẵn, exit code 2. Gate thực sự để verify là `npm run build` (vite build), build này pass. Khi verify thay đổi frontend, chạy vite build chứ đừng dùng tsc --noEmit làm gate.
