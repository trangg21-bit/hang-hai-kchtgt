---
id: AM-eb860f1bb93f4a14
kind: gotcha
topic: flyway-version-collision
tags: []
importance: 0.9
agent: 
created: 2026-08-19T09:16:27.358Z
updated: 2026-08-19T09:16:27.358Z
---

Flyway gotcha: một migration version đã có trong flyway_schema_history sẽ bị BỎ QUA im lặng (application-local.yml: validate-on-migrate=false + out-of-order=true) — không bao giờ tạo file migration dùng version trùng. Vụ buoy_station: file untracked V20260819120000__add_buoy_station_level_approval_columns.sql trùng version với migration server đã áp ('add buoy station audit fields', row 299) nên 4 cột level1/level2 approval không bao giờ được tạo → GET /api/v1/buoy-station 500 'column level1_approved_by does not exist'. Fix: rename sang version mới > max applied (20260819160000). Luôn kiểm tra max version qua flyway_schema_history trước khi đặt tên migration.
