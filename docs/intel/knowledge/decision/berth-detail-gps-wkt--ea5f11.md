---
id: AM-ea5f11ff922ac0b3
kind: decision
topic: berth-detail-gps-wkt
tags: []
importance: 0.7
agent: 
created: 2026-08-14T02:01:48.047Z
updated: 2026-08-14T02:01:48.047Z
---

Chi tiết bến cảng (BerthDetailContent.tsx) từng chỉ đọc latitude/longitude để hiển thị Tọa độ GPS — nhưng BerthService.toResponse chỉ parse được POINT (split 2 phần, dòng ~423-442) nên bản ghi lưu MULTIPOINT/LINESTRING/POLYGON trả latitude/longitude=null → chi tiết hiển thị 'Không có tọa độ' dù có dữ liệu. Response vẫn kèm trường coordinates (WKT đầy đủ qua builder.coordinates). Đã sửa 2026-08-14: thêm helper parseGisCoordinates trong BerthDetailContent (xử lý LINESTRING/POLYGON/MULTIPOINT/POINT + fallback lat/lng). Tham chiếu: PierDetailContent parse WKT nhưng chỉ MULTIPOINT/POINT; BerthForm có parseGisCoordinates đầy đủ.
