---
feature-id: F-111
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng cập nhật hồ sơ Đài LRIT. **ĐÃ XÁC MINH:** `PUT /api/v1/stations/lrit/{id}` → `CoastalStationLRITService.updateStation` (FieldWriteGuard + assertEditable + check trùng mã). Excel cho **Sửa = T toàn bộ TAB1** (10 trường — không có Tần số liên lạc). Quy tắc sửa theo trạng thái §3.9. History UPDATE. validateNotSelfApproval áp dụng cho luồng duyệt.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-111-01 | Người nhập | DRAFT/REJECTED | Sửa TAB1 + GIS + file | Cập nhật + history UPDATE; gửi lại → PENDING_APPROVAL |
| UC-111-02 | Người có quyền duyệt | APPROVED | "Lưu và phê duyệt" | Giữ APPROVED |
| UC-111-03 | Hệ thống | PENDING/APPROVED_LEVEL1 | assertEditable | 403 |

## Scope

| | Items |
|---|---|
| In scope | Cập nhật TAB1 (10 trường) + GIS + file; editable theo trạng thái; history UPDATE; data scope. |
| Out of scope | Duyệt (F-113); xóa (F-112); auto-code. |

## Field Coverage Matrix

Giống F-110 (sheet "Đài LRIT") — Sửa = T toàn TAB1; mã `code` disabled khi sửa.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-111-01 | Chỉ sửa DRAFT/REJECTED_* (assertEditable) | AC-111-01 | |
| BR-111-02 | APPROVED sửa qua "Lưu và phê duyệt" (approvec2), giữ APPROVED | AC-111-02 | |
| BR-111-03 | Mã không đổi; đổi code trùng → 400 "Mã đài LRIT '...' đã được sử dụng" | AC-111-03 | |
| BR-111-04 | History UPDATE (old/new) | AC-111-04 | |
| BR-111-05 | Sửa REJECTED + gửi lại → PENDING_APPROVAL | AC-111-05 | |
| BR-111-06 | Quyền `coastalstationlrit:update` (fallback specialstation:update, data:update, admin:all) | AC-111-06 | |
| BR-111-07 | @PreUpdate đồng bộ code↔stationCode, name↔stationName, orgUnitId↔unitId | AC-111-07 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-099 với resource LRIT. AC tương đương AC-099-01..07.
