---
id: AM-7ddebf86563525de
kind: decision
topic: port-update-coordsys-autofill
tags: []
importance: 0.7
agent: 
created: 2026-08-14T01:50:01.284Z
updated: 2026-08-14T01:50:01.284Z
---

PortListPage form CHỈNH SỬA cảng biển từng có effect tự điền coordinateSystem=1 (WGS-84) + displayRule='Độ, phút, giây (DMS)' với điều kiện `updateGeometryType !== 'POINT'` → chọn 'Đối tượng điểm' không tự điền Hệ quy chiếu. Vì Select Hệ quy chiếu bị disabled (dòng ~2813) và có rules required có điều kiện theo geometryType (dòng 2815: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng') nên bug chặn LUÔN việc lưu. Đã sửa 2026-08-14: bỏ điều kiện !== 'POINT' ở dòng 774, tự điền cho mọi loại đối tượng (khớp form thêm mới dòng 768-773 và BerthForm).
