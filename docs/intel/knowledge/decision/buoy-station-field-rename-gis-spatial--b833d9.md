---
id: AM-b833d9ec1eb15cbd
kind: decision
topic: buoy-station-field-rename-gis-spatial
tags: []
importance: 0.8
agent: 
created: 2026-08-19T06:39:28.809Z
updated: 2026-08-19T06:39:28.809Z
---

Đã đổi 3 trường tiếng Việt trong frontend/src/services/buoy-station/types.ts: loaiHinhHoc→geometryType, toaDo→coordinates, khongGianId→spatialId (khớp backend BuoyStationResponse.java dùng geometryType/coordinates/spatialId + PortResponse.java). Lưu ý: loaiHinhHoc/toaDo/khongGianId vẫn là contract của GisSpatialObject (GIS spatial object) — được đọc ở ~15 file FE khác (waterzone, pier, dryport, beacons, lighthouse, shiprepair, radar, navigationchannel, GISChartView) + backend KchtGis155Service. Đây là nợ kỹ thuật riêng, đổi cần sửa cả backend GIS + FE đồng bộ.
