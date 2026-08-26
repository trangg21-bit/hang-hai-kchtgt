---
id: AM-c9c2449edb191208
kind: gotcha
topic: buoy-update-snapshot-fields
tags: []
importance: 0.9
agent: 
created: 2026-08-19T08:12:55.590Z
updated: 2026-08-19T08:12:55.590Z
---

GOTCHA (M-013 Buoy): BuoyService.update tạo snapshot bằng Buoy.builder() nhưng CHỈ chụp ~17 field — thiếu period/classification/geometryType/mapSymbolId/coordinateSystem/condition/structure/... → recordChanges ghi oldValue=null cho các field thiếu → lịch sử hiển thị '—' và nhóm 1-item thành badge 'Thêm mới' dù là chỉnh sửa. ĐÃ FIX: bổ sung đầy đủ ~35 field còn lại vào snapshot builder. Khi làm entity khác: snapshot phải chụp ĐỦ mọi field có thể thay đổi.
