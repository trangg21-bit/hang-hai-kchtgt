---
id: AM-1d7cd35f98e365e8
kind: gotcha
topic: dryport-form-limits
tags: []
importance: 0.6
agent: 
created: 2026-08-22T09:28:27.145Z
updated: 2026-08-22T09:28:27.145Z
---

DryPortListPage.tsx (pages/port — form cảng cạn): 1 block Form.Item DÙNG CHUNG cho create+update drawer (2 <Form> render cùng tabItems — hook useMaxReached dùng Form.useWatch(name) KHÔNG truyền form → context tự bind đúng form từng drawer; KHÔNG cần atMaxCreate/Update riêng). Giới hạn: dryPortName 255, detailedLocation 500, connectionMode 2000 (sửa từ 500), transportCorridor 100 (sửa từ 255), remarks 2000 (sửa từ 1000), announcementDecisionNumber 20 (sửa từ 100), announcementOrg 255, teuCapacity/area/warehouseArea/yardArea maxLength 20 (thêm mới). 3 lỗi tsc pre-existing: getActionLabel unused, ddToDms 1135, sort 1515.
