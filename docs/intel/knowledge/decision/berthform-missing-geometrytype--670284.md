---
id: AM-6702847a47b74ae7
kind: decision
topic: berthform-missing-geometrytype
tags: []
importance: 0.7
agent: 
created: 2026-08-13T10:45:26.753Z
updated: 2026-08-13T10:45:26.753Z
---

BerthForm.tsx (bến cảng) khi create/update KHÔNG gửi trường geometryType trong payload (chỉ gửi mapSymbolId, coordinateSystem, displayRule, latitude/longitude, coordinates) → BerthService mặc định GisGeometryType.POINT nên bến cảng luôn lưu POINT dù user chọn LINE/POLYGON. PierForm và PortListPage có gửi geometryType, chỉ BerthForm thiếu.
