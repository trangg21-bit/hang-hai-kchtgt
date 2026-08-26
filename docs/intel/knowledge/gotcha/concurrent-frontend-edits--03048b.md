---
id: AM-03048bf3abe24608
kind: gotcha
topic: concurrent-frontend-edits
tags: []
importance: 0.9
agent: 
created: 2026-08-22T06:51:41.351Z
updated: 2026-08-22T06:51:41.351Z
---

Process/concurrent khác đang sửa CẢ frontend source (không chỉ docs): commit 'Refactor' f4df7fa9 đã hấp thụ các edit của tôi vào HEAD giữa phiên, đổi historyGroupCount→historyFieldCount trong DryPortListPage, stage 7+ file khác (theme.ts, PortListPage, các DetailContent). Hệ quả: git diff --stat thay đổi giữa các bước, digest tsc có thể lệch trạng thái file, edit tool báo 'file not read at this version'. Phải đọc lại file trước mỗi edit và đối chiếu digest tsc chứ không tin số tuyệt đối.
