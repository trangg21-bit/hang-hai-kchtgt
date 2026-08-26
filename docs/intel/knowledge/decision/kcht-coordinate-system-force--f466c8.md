---
id: AM-f466c8354f75768b
kind: decision
topic: kcht-coordinate-system-force
tags: []
importance: 0.75
agent: 
created: 2026-08-14T01:45:28.806Z
updated: 2026-08-14T01:49:36.819Z
---

Form KCHT ép cứng coordinateSystem=1 (WGS-84): PierList.tsx initialValues + effect khi đổi geometryType ở PierForm.tsx/BerthForm.tsx/PortListPage.tsx (create+update) + initialValues ở PortCreatePage.tsx/DryPortForm.tsx. Đã sửa C0 cho Cầu cảng (PierList+PierForm): bỏ ép cứng, placeholder 'Chọn hệ quy chiếu', Select disabled={!watchedGeometryType} (chỉ mở khi đã chọn Loại đối tượng), kèm rules required có điều kiện (có trong file hiện tại). Bến cảng/Cảng biển/Cảng cạn VẪN CÒN lỗi ép WGS-84 — cần fix đồng bộ; DryPortForm là chuẩn (enabled + placeholder).
