---
feature-id: F-109
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng xem lịch sử thay đổi & phê duyệt Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** (a) `GET /api/v1/stations/cospas-sarsat/{id}/history` → getHistory (COSPAS_SARSAT_STATION, id, code); (b) `GET /api/v1/station-history?type=COSPAS_SARSAT` (map: "COSPAS_SARSAT" và "COSPAS-SARSAT" → COSPAS_SARSAT_STATION). ActionType: CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-109-01 | Người dùng | Menu dòng → Lịch sử | Mở timeline | Sự kiện CRUD + duyệt |
| UC-109-02 | Người dùng | Lọc | GET /api/v1/station-history?type=COSPAS_SARSAT&actionType=... | Trang đúng |

## Scope

| | Items |
|---|---|
| In scope | Timeline; 2 endpoint; lọc; phân trang; quyền đọc. |
| Out of scope | Ghi history. |

## Field Coverage Matrix

Không trường nhập liệu; hiển thị actionType (nhãn tiếng Việt), previousValue/newValue, changedBy (fullName), changedAt.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-109-01 | Mọi CRUD + duyệt ghi history | AC-109-01 | |
| BR-109-02 | GET /{id}/history giảm dần theo thời gian | AC-109-02 | |
| BR-109-03 | GET /api/v1/station-history lọc type/entityId/actionType/changedBy/from/to | AC-109-03 | |
| BR-109-04 | Type string: `COSPAS_SARSAT` / `COSPAS-SARSAT` | AC-109-04 | |
| BR-109-05 | changedBy hiển thị fullName | AC-109-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-097 với type=COSPAS_SARSAT. AC tương đương AC-097-01..05.
