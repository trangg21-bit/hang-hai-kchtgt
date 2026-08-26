---
id: AM-207d8d0c18684494
kind: decision
topic: port-cluster-decimal-display-fix
tags: []
importance: 0.7
agent: 
created: 2026-08-17T05:45:40.587Z
updated: 2026-08-17T07:02:00.878Z
---

Đuôi .00 trong InputNumber cụm cảng: nguyên nhân gốc là @rc-component/input-number (AntD 6) TỰ SUY precision từ step khi không khai precision — step={0.01} → precision=2 → blur hiện '10.00' dù đã bỏ precision={2}. Fix hoàn chỉnh 2026-08-17: helper fmtInputNumber trong frontend/src/utils/numFmt.ts (formatter strip trailing zeros, giữ nguyên khi userTyping) gắn vào mọi ô step={0.01}/{0.1} + ô giây tọa độ của PortListPage.tsx (10 chỗ), BerthForm.tsx (8 chỗ), PierForm.tsx (8 chỗ). DryPortList.tsx VẪN còn pattern cũ (step={0.01} lines 990/995/1002 + DMS) — chưa sửa vì ngoài scope và file đang có thay đổi chưa commit của user.
