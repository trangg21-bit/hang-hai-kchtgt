---
feature-id: F-103
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng xem lịch sử thay đổi & phê duyệt Đài Inmarsat. **ĐÃ XÁC MINH:** (a) `GET /api/v1/stations/inmarsat/{id}/history` → `getHistory` (InfrastructureType.INMARSAT_STATION, id, code); (b) `GET /api/v1/station-history?type=INMARSAT&...` (map: "INMARSAT" → INMARSAT_STATION). ActionType: CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT. Lịch sử tập trung (không dùng change_logs/approval_logs).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-103-01 | Người dùng | Menu dòng → Lịch sử | Mở timeline | Sự kiện CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT |
| UC-103-02 | Người dùng | Lọc theo loại | GET /api/v1/station-history?type=INMARSAT&actionType=... | Trang kết quả đúng |

## Scope

| | Items |
|---|---|
| In scope | Timeline; 2 endpoint; lọc; phân trang; quyền đọc. |
| Out of scope | Ghi history. |

## Field Coverage Matrix

Không trường nhập liệu. Hiển thị actionType (nhãn tiếng Việt), previousValue/newValue, changedBy (fullName), changedAt.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-103-01 | Mọi CRUD + duyệt ghi history | AC-103-01 | |
| BR-103-02 | GET /{id}/history trả theo thời gian giảm dần | AC-103-02 | |
| BR-103-03 | GET /api/v1/station-history lọc type/entityId/actionType/changedBy/from/to, sort approvedDate desc | AC-103-03 | |
| BR-103-04 | Type string: `INMARSAT` | AC-103-04 | |
| BR-103-05 | changedBy hiển thị fullName | AC-103-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-097 với type=INMARSAT. AC tương đương AC-097-01..05.
