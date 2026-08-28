---
id: AM-f57fc37026969e1c
kind: gotcha
topic: frontend-tsc-file-scoped-verify
tags: []
importance: 0.7
agent: 
created: 2026-08-18T06:21:57.386Z
updated: 2026-08-18T06:21:57.386Z
---

Output 'npx tsc -p tsconfig.app.json --noEmit' của project này quá lớn (1MB+) nên bị externalize thành JSON 1 dòng — output_read không trích được phần giữa. Cách verify file-scoped: tạo tsconfig tạm trong scratch dir (phải BỎ 'types': ['vite/client'] và baseUrl vì resolve từ scratch sẽ fail) với include là các file cần kiểm, rồi chạy 'npx tsc -p <scratch>/tsconfig.json --noEmit --pretty false'. BuoyStationList.tsx có 5 lỗi tsc baseline cũ (66 useAuthStore implicit any, 270-274 Divider orientation, 345 columns render index)
