---
id: AM-a9c272fca2ce64f1
kind: pattern
topic: history-total-field-count
tags: []
importance: 0.7
agent: 
created: 2026-08-22T06:24:05.481Z
updated: 2026-08-22T06:24:05.481Z
---

Badge 'Tổng cộng' trong drawer lịch sử thay đổi (7 màn: Port/Berth/Pier/DryPort/BuoyStation/Buoy/VtsSystem) phải = số bản ghi changeHistory (mỗi ChangeLog = 1 trường thay đổi theo ChangeHistoryService.recordChanges). Đã sửa 2026-08-22: bỏ đếm nhóm (giây+actor = số lần thay đổi), dùng historyFieldCount = records.length. Màn mới copy pattern này phải đếm records.length, không đếm group.
