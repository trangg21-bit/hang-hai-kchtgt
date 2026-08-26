---
id: AM-593d7d2ccc705908
kind: decision
topic: buoy-station-edit-rule
tags: []
importance: 0.7
agent: 
created: 2026-08-20T08:04:10.369Z
updated: 2026-08-20T08:04:10.369Z
---

Quản lý phao tiêu (M-013/F-075) — quy tắc sửa 'Thuộc nhà trạm QLVH phao, tiêu': Select buoyStationId trong BuoyFormContent.tsx disabled khi isEdit && !!currentStationId (prop mới từ BuoyListPage editingRecord.buoyStationId) — phao ĐÃ có nhà trạm thì khóa không đổi; phao CHƯA có trạm thì cho chọn/đổi. Backend BuoyService.update:427 đã sẵn sàng áp dụng buoyStationId (chỉ set khi non-null, không thể xóa trạm qua update). Code KHÔNG tự sinh lại khi đổi trạm ở edit mode (handleStationChange chỉ chạy createForm).
