---
feature-id: F-117
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng cập nhật hồ sơ Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** `PUT /api/v1/stations/haiphong/{id}` → `CoastalStationHaiphongService.updateStation` (FieldWriteGuard + assertEditable + check trùng mã). Excel cho **Sửa = T toàn bộ TAB1** (9 trường — không có Vùng phủ sóng/Tần số liên lạc). Quy tắc sửa theo trạng thái §3.9. History UPDATE. Drift #4 (tên entity Haiphong vs nhãn Hà Nội) ghi nhận ở F-116.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-117-01 | Người nhập | DRAFT/REJECTED | Sửa TAB1 + GIS + file | Cập nhật + history UPDATE; gửi lại → PENDING_APPROVAL |
| UC-117-02 | Người có quyền duyệt | APPROVED | "Lưu và phê duyệt" | Giữ APPROVED |
| UC-117-03 | Hệ thống | PENDING/APPROVED_LEVEL1 | assertEditable | 403 |

## Scope

| | Items |
|---|---|
| In scope | Cập nhật TAB1 (9 trường) + GIS + file; editable theo trạng thái; history UPDATE; data scope. |
| Out of scope | Duyệt (F-119); xóa (F-118); auto-code. |

## Field Coverage Matrix

Giống F-116 (sheet "Đài TTXLTT Hà Nội") — Sửa = T toàn TAB1; mã `code` disabled khi sửa; "Địa điểm chi tiết" có Bộ lọc = T.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-117-01 | Chỉ sửa DRAFT/REJECTED_* (assertEditable) | AC-117-01 | |
| BR-117-02 | APPROVED sửa qua "Lưu và phê duyệt" (approvec2), giữ APPROVED | AC-117-02 | |
| BR-117-03 | Mã không đổi; đổi code trùng → 400 "Mã đài TTXLTT '...' đã được sử dụng" | AC-117-03 | |
| BR-117-04 | History UPDATE (old/new) | AC-117-04 | |
| BR-117-05 | Sửa REJECTED + gửi lại → PENDING_APPROVAL | AC-117-05 | |
| BR-117-06 | Quyền `coastalstationhaiphong:update` (fallback specialstation:update, data:update, admin:all) | AC-117-06 | |
| BR-117-07 | @PreUpdate đồng bộ code↔stationCode, name↔stationName, orgUnitId↔unitId | AC-117-07 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-099 với resource Haiphong. AC tương đương AC-099-01..07.
