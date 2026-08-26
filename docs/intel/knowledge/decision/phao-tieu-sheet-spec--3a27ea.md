---
id: AM-3a27eaebf1f459f3
kind: decision
topic: phao-tieu-sheet-spec
tags: []
importance: 0.85
agent: 
created: 2026-08-18T03:29:19.679Z
updated: 2026-08-19T08:24:59.808Z
---

ĐÃ bổ sung 14 trường thiếu theo CSV 'QL Phao tiêu' (STT 41/44/45-56): level1/level2ApprovalContent (Nội dung phê duyệt Cảng vụ/Cục) + operationPlanCode/Name/StartDate/EndDate (vận hành khai thác) + maintenancePlanCode/Name/StartTime/EndTime (bảo trì) + incidentCode/Type/Location/Time (sự cố) — tất cả String nullable. Migration V20260819160000__add_buoy_ops_maintenance_incident_fields.sql. Theo CSV: các trường này READ-ONLY (chỉ hiển thị ở detail, không nhập form) → chưa có nguồn dữ liệu (module kế hoạch vận hành/bảo trì/sự cố chưa tồn tại) nên hiển thị '—'. Triển khai: entity Buoy + BuoyResponse + BuoyService (snapshot+toResponse) + beacon.ts + BuoyDetailContent (3 nhóm mới + 2 nội dung phê duyệt trong Collapse) + BuoyListPage (14 nhãn history). Triage C3 do migration one-way-door — làm inline theo user cấm PMO.
