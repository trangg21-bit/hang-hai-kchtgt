---
id: AM-18d7acb946cf7408
kind: fact
topic: frontend-tsc-pre-existing-errors
tags: []
importance: 0.7
agent: 
created: 2026-08-22T07:04:31.983Z
updated: 2026-08-22T07:04:31.983Z
---

tsc --noEmit -p tsconfig.app.json (frontend) exit 2 với ~30 lỗi PRE-EXISTING: vitest không có types (t.ts, permissionStore.test.ts), permissionStore.ts tự tham chiếu vòng (TS7022/7023/7024), theme.ts 256/260 duplicate key trong metronicTheme (TS1117), beacon.ts duplicate lastRepairDate (TS2300), types/gisSearch|lineObject|mapLayer|pointObject|polygonObject dùng enum với erasableSyntaxOnly (TS1294), vtsSystem.ts TS1117, capabilityParser/congNangParser biến match thừa (TS6133). Không file nào trong số này là do thay đổi phân trang/CSS; vite build vẫn pass. Đừng coi typecheck đỏ là do thay đổi frontend nhỏ.
