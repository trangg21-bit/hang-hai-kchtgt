---
id: AM-8b05a2f3cdcb0dcb
kind: gotcha
topic: spring-data-param-order-mismatch
tags: []
importance: 0.9
agent: 
created: 2026-08-22T04:39:41.479Z
updated: 2026-08-22T04:39:41.479Z
---

GOTCHA: khi thêm tham số vào Spring Data repository method (searchDryPorts), THỨ TỰ argument trong service call phải khớp THỨ TỰ @Param trong interface — nếu service truyền lệch (vd Integer vào chỗ String) javac báo 'incompatible types: Integer cannot be converted to String' ở service, kéo theo cả package DTO bị đánh rớt → 'package ...dto.dryport does not exist' dây chuyền. Verify bằng mvn compile + grep createdFiles.lst (class còn thiếu = file lỗi).
