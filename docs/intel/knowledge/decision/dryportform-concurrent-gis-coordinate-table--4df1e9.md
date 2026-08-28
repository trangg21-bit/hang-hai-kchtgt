---
id: AM-4df1e9961599318a
kind: decision
topic: dryportform-concurrent-gis-coordinate-table
tags: []
importance: 0.7
agent: 
created: 2026-08-14T10:24:40.538Z
updated: 2026-08-14T10:24:40.538Z
---

DryPortForm.tsx (cảng cạn) đang có SỬA ĐỔI ĐỒNG THỜI ở phần GIS/tọa độ: tab 'Vị trí' đã chuyển sang bảng tọa độ DMS (dùng ddToDms, updateGpsPoint, addGpsPoint, removeCoordinate, buildCoordinatesWkt, Space.Compact) thay cho GisLocationSelector cũ. fontSizeSm VẪN ĐƯỢC DÙNG ở bảng tọa độ (separator ° ' ") — KHÔNG được gỡ khỏi import. Các lần đọc file có thể bị stale do parallel session; khi sửa phải re-read sát thời điểm edit (multi_edit từng cảnh báo 'applied against content this session had not read'). actionPrimary thì đúng là không còn dùng (đã gỡ an toàn).
