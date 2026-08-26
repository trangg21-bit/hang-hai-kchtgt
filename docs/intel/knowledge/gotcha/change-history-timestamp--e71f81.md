---
id: AM-e71f8109b0062097
kind: gotcha
topic: change-history-timestamp
tags: []
importance: 0.8
agent: 
created: 2026-08-22T02:46:47.012Z
updated: 2026-08-22T02:46:47.012Z
---

ROOT CAUSE lịch sử hiện 'Thêm mới' khi chỉnh sửa (2026-08-22): ChangeHistoryService.recordChanges gọi LocalDateTime.now() RIÊNG TỪNG DÒNG trong loop diff → row change_logs cùng 1 lần save bị lệch giây → frontend group theo giây (toSec) → vỡ 1 lần lưu thành nhiều group; group nào toàn field oldValue rỗng bị gắn nhầm 'Thêm mới'. ĐÃ FIX: chụp 1 timestamp duy nhất (now) cho cả lần ghi (recordChanges + insertChangeRecord). GOTCHA: mvn KHÔNG có trên PATH shell này (repo không có mvnw) — không verify backend compile được qua bash, user chạy Maven qua IDE.
