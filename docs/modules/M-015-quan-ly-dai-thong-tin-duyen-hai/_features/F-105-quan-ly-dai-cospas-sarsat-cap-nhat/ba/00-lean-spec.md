---
feature-id: F-105
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng cập nhật hồ sơ Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** `PUT /api/v1/stations/cospas-sarsat/{id}` → `CoastalStationCospasSarsatService.updateStation` (FieldWriteGuard + assertEditable). Excel cho **Sửa = T toàn bộ TAB1** (như Inmarsat, khác TTDH). Quy tắc sửa theo trạng thái §3.9. Ghi history UPDATE. Quyền update + observation thiếu @PreAuthorize method-level cho PUT (như F-104).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-105-01 | Người nhập | DRAFT/REJECTED | Sửa TAB1 + GIS + file | Cập nhật + history UPDATE; gửi lại → PENDING_APPROVAL |
| UC-105-02 | Người có quyền duyệt | APPROVED | "Lưu và phê duyệt" | Giữ APPROVED |
| UC-105-03 | Hệ thống | PENDING/APPROVED_LEVEL1 | assertEditable | 403 |

## Scope

| | Items |
|---|---|
| In scope | Cập nhật TAB1 (11 trường) + GIS + file; editable theo trạng thái; history UPDATE; data scope. |
| Out of scope | Duyệt (F-107); xóa (F-106); auto-code. |

## Field Coverage Matrix

Giống F-104 (sheet "Đài Cospas-Sarsat") — Sửa = T toàn TAB1; mã `code` disabled khi sửa.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-105-01 | Chỉ sửa DRAFT/REJECTED_* (assertEditable) | AC-105-01 | |
| BR-105-02 | APPROVED sửa qua "Lưu và phê duyệt" (approvec2), giữ APPROVED | AC-105-02 | |
| BR-105-03 | Mã không đổi khi sửa | AC-105-03 | |
| BR-105-04 | History UPDATE (old/new) | AC-105-04 | |
| BR-105-05 | Sửa REJECTED + gửi lại → PENDING_APPROVAL | AC-105-05 | |
| BR-105-06 | Quyền `coastalstationcospassarsat:update` (fallback specialstation:update, data:update, admin:all) | AC-105-06 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-099 với resource Cospas. AC tương đương AC-099-01..06; observation thiếu @PreAuthorize PUT ghi nhận (chờ SA).
