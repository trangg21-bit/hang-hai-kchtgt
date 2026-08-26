---
id: AM-b7ec0d22986b444b
kind: gotcha
topic: bash-wait-exit-code-gotcha
tags: []
importance: 0.8
agent: 
created: 2026-08-20T02:10:43.901Z
updated: 2026-08-20T02:10:43.901Z
---

GOTCHA bash tool: lệnh mvn nền (background job) — kết quả wait tool 'Command exited with code 0' là exit code CỦA THAO TÁC WAIT, KHÔNG phải của job; exit code thật của job đến MUỘN qua supervised completion message (kèm output đầy đủ). Đừng kết luận build pass khi chỉ thấy wait báo 0 — phải đọc completion thật hoặc chạy lại incremental ('Nothing to compile' = pass chắc chắn).
