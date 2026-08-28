---
id: AM-e9c4e0b0a4aacf77
kind: gotcha
topic: tsc-baseline-red-frontend
tags: []
importance: 0.8
agent: 
created: 2026-08-22T08:25:37.604Z
updated: 2026-08-22T08:25:37.604Z
---

Baseline typecheck frontend VỐN ĐÃ ĐỎ: `npx tsc --noEmit -p tsconfig.app.json` exit 2 với 712 diagnostics có sẵn trên ~100 file (PortListPage 56, GISChartView 55...). Không dùng lệnh này làm cổng pass/fail — phải so sánh per-file (filter theo file mình đụng). Các file buoy/buoy-station có sẵn lỗi TS6133 unused imports (TreeSelect, BUOY_TYPE_MAP, textSecondary, fontWeightMedium, spaceXs...) + TS2339 displayRule thiếu trong BuoyStationResponse + TS1117 duplicate key. Lỗi cú pháp trong template literal không thể sinh lỗi TS mới.
