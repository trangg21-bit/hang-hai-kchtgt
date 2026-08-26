---
id: AM-21a899c4c231348e
kind: decision
topic: port-history-tracking-fix
tags: []
importance: 0.8
agent: 
created: 2026-08-17T09:34:57.872Z
updated: 2026-08-17T09:47:22.499Z
---

ĐÃ REVERT (2026-08-17, theo yêu cầu user): bỏ toàn bộ fix history tracking cảng biển — Port KHÔNG có field geometryType, PortService không set geometryType, EntityFields/ChangeTrackingService không skip infrastructureList/attachments, migration V20260817150000__add_port_geometry_type.sql đã xóa. Backend về trạng thái cũ: Loại đối tượng vẫn KHÔNG ghi history, infrastructureList vẫn ghi nhiễu (chấp nhận theo quyết định user). Frontend PortListPage vẫn giữ filter ẩn 2 field đó khi hiển thị lịch sử.
