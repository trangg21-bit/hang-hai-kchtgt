---
id: AM-a9f288c3fabcf62b
kind: gotcha
topic: date-filter-pattern-port-berth
tags: []
importance: 0.7
agent: 
created: 2026-08-18T02:52:57.128Z
updated: 2026-08-18T02:52:57.128Z
---

Pattern lọc ngày backend cảng/bến: controller nhận updatedFrom/updatedTo dạng String, service parse bằng LocalDateTime.parse(s.replace(" ", "T")) — KHÔNG dùng @DateTimeFormat(ISO.DATE_TIME) vì frontend gửi 'YYYY-MM-DD HH:mm' có space.
