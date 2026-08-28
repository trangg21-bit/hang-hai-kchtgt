---
id: AM-158091b1ae22f059
kind: gotcha
topic: pier-service-findall-18-args
tags: []
importance: 0.8
agent: 
created: 2026-08-22T06:12:18.713Z
updated: 2026-08-22T06:12:18.713Z
---

PierService.findAll full signature = 18 tham số (page, size, orgUnitId, search, pierCode, pierName, berthId, portId, pierType, province, status, approvalStatus, navigationChannelId, constructionGrade, structureType, operationalFunction, updatedFrom, updatedTo) — PierService.java:213. PierController gọi overload đầy đủ này; test stub PierService.findAll PHẢI khớp 18 tham số. Lỗi 2026-08-22: PierControllerTest.java:138 stub 16 tham số → 'no suitable method found' → mvn package -DskipTests vẫn chạy testCompile nên làm hỏng build CI Docker. Fix: thêm any() cho đủ 18.
