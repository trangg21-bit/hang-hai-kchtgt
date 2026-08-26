---
id: AM-75c141b88f10117d
kind: gotcha
topic: beacon-history-changed-field-255
tags: []
importance: 0.8
agent: 
created: 2026-08-19T07:46:03.512Z
updated: 2026-08-19T07:46:03.512Z
---

BUG đã sửa (BuoyService + BeaconLightService logHistory): khi chỉnh sửa TẤT CẢ thông tin phao tiêu/đèn biển, getChangedFields nối ~40 tên field bằng ', ' thành chuỗi >255 ký tự gán vào cột beacon_history.changed_field (VARCHAR 255) → Postgres 'value too long for character varying(255)' → DataIntegrityViolationException → GlobalExceptionHandler trả 'Dữ liệu đã tồn tại hoặc không hợp lệ'. Fix: cắt substring(0,255) tại .changedField(...). Lịch sử đầy đủ vẫn còn trong diff_data JSON.
