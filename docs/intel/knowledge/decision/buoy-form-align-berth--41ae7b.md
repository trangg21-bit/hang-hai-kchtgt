---
id: AM-41ae7b7b1c1db812
kind: decision
topic: buoy-form-align-berth
tags: []
importance: 0.8
agent: 
created: 2026-08-18T07:05:41.739Z
updated: 2026-08-18T07:05:41.739Z
---

Đồng bộ form Phao tiêu theo Bến cảng (đã làm): create footer đổi nhãn 'Lưu và phê duyệt' → 'Lưu và gửi phê duyệt' (action vẫn là submit → PENDING_APPROVAL, nhãn cũ gây hiểu nhầm); edit footer 'Lưu' → 'Cập nhật'; edit title 'Chỉnh sửa thông tin — {name}'. KHÔNG thêm nút 'Lưu và phê duyệt' (duyệt thẳng) như Berth vì vi phạm F-074 BR-3 (phao mới bắt buộc pending_approval); BerthService.applySaveAction hỗ trợ DRAFT/SUBMIT/APPROVED còn BuoyService.create chỉ draft/submit.
