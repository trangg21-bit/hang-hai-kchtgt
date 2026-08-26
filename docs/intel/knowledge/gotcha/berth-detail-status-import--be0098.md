---
id: AM-be00988e6ef35298
kind: gotcha
topic: berth-detail-status-import
tags: []
importance: 0.8
agent: 
created: 2026-08-26T02:41:57.573Z
updated: 2026-08-26T02:41:57.573Z
---

BerthDetailContent.tsx từng thiếu import statusOperational/statusAttention/statusCritical từ tokens.ts (dùng ở dòng 'Tình trạng' operationalStatus map) → ReferenceError runtime trong Vite dev. Đã sửa 2026-08-26 (thêm vào import). Các DetailContent khác (DryPort, Pier, Buoy, BuoyStation) đều đã import đủ — khi thêm khối dùng status* vào file DetailContent mới phải nhớ thêm import, vì tsc build KHÔNG chặn (vite build dùng esbuild) mà chỉ tsc --noEmit chặn.
