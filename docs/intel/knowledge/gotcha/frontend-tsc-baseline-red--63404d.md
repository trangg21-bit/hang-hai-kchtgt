---
id: AM-63404d3bd3e206af
kind: gotcha
topic: frontend-tsc-baseline-red
tags: []
importance: 0.8
agent: 
created: 2026-08-22T06:47:40.966Z
updated: 2026-08-22T06:47:40.966Z
---

Frontend tsc full-project (npx tsc --noEmit -p tsconfig.app.json) đang RED sẵn (exit 2) do lỗi pre-existing: theme.ts:256/260 duplicate key Modal/Dropdown (TS1117), types/beacon.ts duplicate lastRepairDate (TS2300) lan ~90 file. Khi verify 1 thay đổi nhỏ, đừng kết luận theo exit code full run — chạy standalone: npx tsc --noEmit --ignoreConfig --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target es2020 --esModuleInterop --allowSyntheticDefaultImports --strict false <file(s)> rồi so lỗi chỉ nằm trong file mình sửa.
