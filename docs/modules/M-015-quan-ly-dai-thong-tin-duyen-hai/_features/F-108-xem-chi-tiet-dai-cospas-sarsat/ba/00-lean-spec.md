---
feature-id: F-108
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng xem chi tiết hồ sơ Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** `GET /api/v1/stations/cospas-sarsat/{id}` → `getStationById` + buildResponse (đầy đủ: code, name, frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, locationAddress, contactPerson/Phone, signalRange, operatingMode, approval fields). Observation: GET không có @PreAuthorize method-level (chính sách đọc chờ SA). Drawer 5 tab như TTDH.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-108-01 | Người dùng trong phạm vi | Bấm hàng → Xem chi tiết | Drawer 5 tab | Hiển thị theo cột CT |
| UC-108-02 | Người dùng ngoài phạm vi | GET /{id} | DataScope | Không nhận dữ liệu |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 5 tab; quyền đọc; data scope; trường kỹ thuật đặc thù (beaconProtocol...). |
| Out of scope | CRUD; duyệt; lịch sử (F-109). |

## Field Coverage Matrix

Sheet "Đài Cospas-Sarsat" cột CT (như F-104): TAB1 11 trường, GIS 5 trường, File, TAB4 VH&BT read-only, TAB5 11 trường.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-108-01 | GET /{id} 200; không tồn tại → 404 | AC-108-01 | |
| BR-108-02 | Data scope unitId | AC-108-02 | |
| BR-108-03 | Quyền đọc: chờ SA chốt chính sách (hiện không có @PreAuthorize) | AC-108-03 | Observation |
| BR-108-04 | Tên người hiển thị fullName | AC-108-04 | |
| BR-108-05 | Tên đơn vị qua OrgUnitCacheService | AC-108-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-096 với resource Cospas. AC tương đương AC-096-01..05; observation quyền đọc ghi nhận.
