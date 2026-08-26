---
id: AM-76635b5fec166e74
kind: fact
topic: anchorage-operationalstatusnull-bug
tags: []
importance: 0.9
agent: 
created: 2026-08-26T03:32:00.994Z
updated: 2026-08-26T03:32:00.994Z
---

BUG LIST KHU NEO ĐẬU RỖNG (2026-08-26, TRI-1787715022925-b181): AnchorageService.findAll truyền 'operationalStatus == null' làm tham số operationalStatusNull của searchAnchorages — khi KHÔNG lọc tình trạng → operationalStatusNull=true → SQL thành 'a.operationalStatus IS NULL' → loại hết bản ghi có operational_status != NULL (DB: cả 6 bản ghi đều có giá trị) → API trả rỗng dù DB có dữ liệu. BerthService.findAll:211 truyền 'false' (đúng). ĐÃ SỬA: AnchorageService.java:254 'operationalStatus == null' → 'false'. Lưu ý: deprecated default searchAnchorages cũng truyền false — false là giá trị chuẩn khi không lọc. Lỗi 'java: package com.hanghai.kchtg.common.entity does not exist' trong IntelliJ là do mvn clean xóa target/ làm IDE mất đồng bộ — khắc phục bằng Build→Rebuild Project, KHÔNG phải lỗi source.
