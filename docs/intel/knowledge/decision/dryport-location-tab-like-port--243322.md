---
id: AM-243322f407e49a7b
kind: decision
topic: dryport-location-tab-like-port
tags: []
importance: 0.75
agent: 
created: 2026-08-14T10:17:44.022Z
updated: 2026-08-14T10:17:44.022Z
---

Tab Vị trí form Cảng cạn (DryPortForm.tsx) đã sửa giống cảng biển 2026-08-14: bỏ GisLocationSelector + ép cứng geometryType='POINT', thay bằng bảng tọa độ DMS (Độ/Phút/Giây, Vĩ độ N / Kinh độ E) với GEOMETRY_POINT_COUNT (POINT=1/LINE=2/POLYGON=3), mapSymbolId/coordinateSystem/displayRule có rules required có điều kiện theo geometryType, coordinateSystem=1 + displayRule='Độ, phút, giây (DMS)' tự set khi chọn Loại đối tượng. Payload gửi geometryType + coordinates WKT (buildCoordinatesWkt: POINT/LINESTRING/POLYGON/MULTIPOINT) + latitude/longitude điểm đầu. Backend DryPortService (create+update) bỏ ép GisGeometryType.POINT, nhận request.getGeometryType() + helper getSpatialObjectType (POINT_PORT/LINE_OTHER/POLYGON_OTHER); Create/UpdateDryPortRequest + types/port.ts thêm field geometryType. Lưu ý: DryPortForm dùng handleSave qua form.getFieldsValue() (không validateFields) nên rules mapSymbolId chỉ là visual, block thật là GPS GEOMETRY_POINT_COUNT (toast thủ công).
