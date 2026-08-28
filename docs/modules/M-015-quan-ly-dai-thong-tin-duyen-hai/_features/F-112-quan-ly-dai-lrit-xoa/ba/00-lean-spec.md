---
feature-id: F-112
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng xóa hồ sơ Đài LRIT. **ĐÃ XÁC MINH:** `DELETE /api/v1/stations/lrit/{id}` → `CoastalStationLRITService.deleteStation` → `approvalService.deleteDraft(entity, LRIT_STATION, userId)` (chỉ DRAFT) → xóa mềm + history DELETE. Quyền `coastalstationlrit:delete`. Như F-094.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-112-01 | Người nhập | DRAFT → Xóa | deleteDraft | deletedAt set, history DELETE |
| UC-112-02 | Người nhập | Không phải DRAFT | Xóa | Chặn "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm DRAFT; history DELETE; data scope. |
| Out of scope | Xóa cứng; hồ sơ đã duyệt. |

## Field Coverage Matrix

Không trường nhập liệu; điều kiện theo `approvalStatus` (TAB5). Ma trận đầy đủ: F-110.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-112-01 | Chỉ xóa DRAFT — assertDeletable | AC-112-01 | |
| BR-112-02 | Xóa mềm: set deletedAt | AC-112-02 | |
| BR-112-03 | History DELETE | AC-112-03 | |
| BR-112-04 | Quyền `coastalstationlrit:delete` (fallback specialstation:delete, data:delete, admin:all) | AC-112-04 | Có @PreAuthorize |
| BR-112-05 | Nút Xóa chỉ hiện khi DRAFT | AC-112-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-094 với resource LRIT. AC tương đương AC-094-01..05.
