---
feature-id: F-115
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng xem lịch sử thay đổi & phê duyệt Đài LRIT. **ĐÃ XÁC MINH:** (a) `GET /api/v1/stations/lrit/{id}/history` → getHistory (LRIT_STATION, id, code); (b) `GET /api/v1/station-history?type=LRIT` (map: "LRIT" → LRIT_STATION). ActionType: CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-115-01 | Người dùng | Menu dòng → Lịch sử | Mở timeline | Sự kiện CRUD + duyệt |
| UC-115-02 | Người dùng | Lọc | GET /api/v1/station-history?type=LRIT&actionType=... | Trang đúng |

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
| BR-115-01 | Mọi CRUD + duyệt ghi history | AC-115-01 | |
| BR-115-02 | GET /{id}/history giảm dần theo thời gian | AC-115-02 | |
| BR-115-03 | GET /api/v1/station-history lọc type/entityId/actionType/changedBy/from/to | AC-115-03 | |
| BR-115-04 | Type string: `LRIT` | AC-115-04 | |
| BR-115-05 | changedBy hiển thị fullName | AC-115-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-097 với type=LRIT. AC tương đương AC-097-01..05.
