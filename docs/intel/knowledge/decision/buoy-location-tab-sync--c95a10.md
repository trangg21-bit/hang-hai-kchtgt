---
id: AM-c95a10062a354c2d
kind: decision
topic: buoy-location-tab-sync
tags: []
importance: 0.8
agent: 
created: 2026-08-18T07:26:53.990Z
updated: 2026-08-18T07:26:53.990Z
---

Đồng bộ tab Thông tin vị trí Phao tiêu theo Bến cảng (M-013/F-075, triage C3) làm inline theo user chốt bypass vì dispatch PMO fail-closed do ticket ledger M-013 kẹt: Buoy entity +4 cột geometry_type/map_symbol_id/coordinate_system/display_rule + Flyway V20260818160000__add_buoy_gis_columns.sql; BuoyService thêm buildBuoyWkt() + resolveGeometryType(), spatial vẫn POINT_BUOY; frontend thay GisLocationSelector bằng UI giống BerthForm (Loại đối tượng + Biểu tượng + Hệ quy chiếu + bảng DMS), payload WKT POINT/MULTIPOINT. Gate: mvn (Maven IntelliJ) + npm run build đều exit 0.
