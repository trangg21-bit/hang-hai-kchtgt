---
id: AM-007ca1f4ad9564a9
kind: gotcha
topic: frontend-tsc-false-pass-baseline
tags: []
importance: 0.9
agent: 
created: 2026-08-18T04:53:08.117Z
updated: 2026-08-18T04:53:08.117Z
---

GATE VERIFY FRONTEND (gotcha quan trọng): `npx tsc --noEmit` (bare) là FALSE-PASS vì tsconfig.json kiểu solution chỉ có files:[] — gate thật là `npx tsc -p tsconfig.app.json --noEmit` và HIỆN TẠI ĐÃ CÓ SẴN ~988 lỗi/115 file baseline (drift thêm do pages/station/** sửa ngoài). `npm run build` (vite) exit 0. Vì vậy với thay đổi frontend: gate = KHÔNG phát sinh lỗi MỚI so với baseline snapshot, không phải 0 lỗi tuyệt đối. Ghi trong lần verify 2026-08-18 (session PMO M-1014).
