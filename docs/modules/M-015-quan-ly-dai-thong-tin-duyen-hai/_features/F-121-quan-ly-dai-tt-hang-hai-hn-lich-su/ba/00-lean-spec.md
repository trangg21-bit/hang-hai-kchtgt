---
feature-id: F-121
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng xem lịch sử thay đổi & phê duyệt Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** (a) `GET /api/v1/stations/haiphong/{id}/history` → getHistory (HANOI_STATION, id, code); (b) `GET /api/v1/station-history?type=HAIPHONG` (map: "HAIPHONG" → HANOI_STATION — **ghi chú drift #4:** type string dùng "HAIPHONG" dù nhãn feature là Hà Nội). ActionType: CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-121-01 | Người dùng | Menu dòng → Lịch sử | Mở timeline | Sự kiện CRUD + duyệt |
| UC-121-02 | Người dùng | Lọc | GET /api/v1/station-history?type=HAIPHONG&actionType=... | Trang đúng |

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
| BR-121-01 | Mọi CRUD + duyệt ghi history | AC-121-01 | |
| BR-121-02 | GET /{id}/history giảm dần theo thời gian | AC-121-02 | |
| BR-121-03 | GET /api/v1/station-history lọc type/entityId/actionType/changedBy/from/to | AC-121-03 | |
| BR-121-04 | Type string: `HAIPHONG` (map → HANOI_STATION) | AC-121-04 | Drift #4 ghi nhận |
| BR-121-05 | changedBy hiển thị fullName | AC-121-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-097 với type=HAIPHONG. AC tương đương AC-097-01..05; drift #4 (tên type HAIPHONG vs nhãn Hà Nội) ghi nhận.
