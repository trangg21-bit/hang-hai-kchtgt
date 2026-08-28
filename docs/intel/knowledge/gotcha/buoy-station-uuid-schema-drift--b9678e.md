---
id: AM-b9678ec03ad7d65f
kind: gotcha
topic: buoy-station-uuid-schema-drift
tags: []
importance: 0.85
agent: 
created: 2026-08-20T06:18:46.242Z
updated: 2026-08-20T06:23:39.706Z
---

Gotcha (M-014 buoy_station): ClassCastException String→UUID ở BuoyStationService.findAll vì 13 cột entity map UUID (unit_id, operating_org_id, port_id, waterway_id, waterway_route_id, spatial_id, approved_by, level1/2_approved_by, sent_approved_by + created_by/updated_by/deleted_by) là VARCHAR trong DB thật; repair migration V20260803370000 bỏ sót phần buoy_station. ĐÃ FIX: migration V20260820120000__convert_buoy_station_uuid_columns.sql (2026-08-20) chuyển cả 13 cột sang uuid, idempotent, regex-guard. Lưu ý môi trường: máy này KHÔNG có mvn/mvnw/psql — không chạy được mvn compile hay truy vấn DB trực tiếp.
