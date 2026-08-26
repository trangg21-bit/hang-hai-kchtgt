---
id: AM-898bb89c0ec8361e
kind: decision
topic: buoy-code-regeneration
tags: []
importance: 0.85
agent: 
created: 2026-08-20T06:48:57.651Z
updated: 2026-08-20T06:48:57.651Z
---

Quyết định nghiệp vụ (08/2026): Mã phao, tiêu giờ CÓ THỂ sinh lại khi đổi 'Thuộc nhà trạm QLVH' ở cả form thêm mới lẫn chỉnh sửa — trái với BR-075-01 cũ (code immutable). Backend UpdateBuoyRequest.java đã thêm field code; BuoyService.update() cho đổi code nhưng vẫn check trùng buoyRepo.existsByCode || beaconLightRepo.existsByCode (BR-001 duy nhất). Tài liệu BA F-075 BR-008 vẫn ghi 'không thể thay đổi' — chưa cập nhật, cần đồng bộ sau.
