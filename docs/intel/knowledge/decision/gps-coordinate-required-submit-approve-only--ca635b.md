---
id: AM-ca635b1b9e93e1d7
kind: decision
topic: gps-coordinate-required-submit-approve-only
tags: []
importance: 0.9
agent: 
created: 2026-08-22T08:41:16.876Z
updated: 2026-08-22T08:45:14.704Z
---

Rule tọa độ GPS — ĐÃ ĐỒNG BỘ TOÀN BỘ 6 module KCHT (2026-08-22): nhà trạm phao tiêu, phao tiêu, cảng biển, bến cảng, cầu cảng, cảng cạn. CHỈ 2 nút 'Lưu và gửi phê duyệt'/'Lưu và phê duyệt' ở CREATE yêu cầu >=1 tọa độ GPS → toast.error('Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt') + setGpsError + chuyển tab GIS + return. Lưu nháp/Cập nhật (edit) KHÔNG yêu cầu tọa độ. ĐÃ BỎ check GEOMETRY_POINT_COUNT chặn mọi action ở: BuoyStationFormContent, BuoyListPage (create+edit), PortListPage (create+update), BerthForm, PierForm, DryPortListPage (kể cả rule form _gisCoordinates). GEOMETRY_POINT_COUNT vẫn dùng để khởi tạo hàng tọa độ khi đổi loại đối tượng. TRI records: TRI-1787388040289-ceec (buoy/buoy-station), TRI-1787388268750-9a8a (port/berth/pier/dryport). Gate: npm run build exit 0.
