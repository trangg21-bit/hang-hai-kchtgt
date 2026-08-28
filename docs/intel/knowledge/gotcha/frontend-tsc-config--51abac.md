---
id: AM-51abac75d3c8588b
kind: gotcha
topic: frontend-tsc-config
tags: []
importance: 0.9
agent: 
created: 2026-08-22T05:25:23.675Z
updated: 2026-08-22T05:25:23.675Z
---

frontend/tsconfig.json chỉ là project references (files:[] + references tsconfig.app.json / tsconfig.node.json) — chạy 'npx tsc --noEmit -p tsconfig.json' KHÔNG check gì, exit 0 vô nghĩa. Phải chạy 'npx tsc --noEmit -p tsconfig.app.json' (hoặc --build) mới typecheck src thật. Dự án hiện có ~hàng trăm lỗi TS pre-existing ở 90+ file (WaterZoneListPage, theme.ts, types/*.ts với erasableSyntaxOnly, beacon.ts duplicate lastRepairDate...) — typecheck toàn cục exit 2 là trạng thái nền, không phải do thay đổi cục bộ gây ra.
