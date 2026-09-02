---
feature-id: F-118
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng xóa hồ sơ Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** `DELETE /api/v1/stations/haiphong/{id}` → `CoastalStationHaiphongService.deleteStation` → `approvalService.deleteDraft(entity, HANOI_STATION, userId)` (chỉ DRAFT) → xóa mềm + history DELETE. Quyền `coastalstationhaiphong:delete`. Như F-094.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-118-01 | Người nhập | DRAFT → Xóa | deleteDraft | deletedAt set, history DELETE |
| UC-118-02 | Người nhập | Không phải DRAFT | Xóa | Chặn "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm DRAFT; history DELETE; data scope. |
| Out of scope | Xóa cứng; hồ sơ đã duyệt. |

## Field Coverage Matrix

Không trường nhập liệu; điều kiện theo `approvalStatus` (TAB5). Ma trận đầy đủ: F-116.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-118-01 | Chỉ xóa DRAFT — assertDeletable | AC-118-01 | |
| BR-118-02 | Xóa mềm: set deletedAt | AC-118-02 | |
| BR-118-03 | History DELETE | AC-118-03 | |
| BR-118-04 | Quyền `coastalstationhaiphong:delete` (fallback specialstation:delete, data:delete, admin:all) | AC-118-04 | Có @PreAuthorize |
| BR-118-05 | Nút Xóa chỉ hiện khi DRAFT | AC-118-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-094 với resource Haiphong. AC tương đương AC-094-01..05.
