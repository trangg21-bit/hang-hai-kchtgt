---
feature-id: F-100
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng xóa hồ sơ Đài Inmarsat. **ĐÃ XÁC MINH:** `DELETE /api/v1/stations/inmarsat/{id}` → `CoastalStationInmarsatService.deleteStation` → `approvalService.deleteDraft(entity, INMARSAT_STATION, userId)` (`assertDeletable` — chỉ DRAFT) → xóa mềm `deletedAt` + history DELETE. Quyền `coastalstationinmarsat:delete`. Như TTDH (F-094) — quy trình chung §3.6.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-100-01 | Người nhập | Hồ sơ DRAFT → Xóa | deleteDraft | deletedAt set, history DELETE, ẩn khỏi list |
| UC-100-02 | Người nhập | Hồ sơ không phải DRAFT | Bấm Xóa | Chặn "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm DRAFT; history DELETE; quyền `coastalstationinmarsat:delete`; data scope. |
| Out of scope | Xóa cứng; hồ sơ đã duyệt. |

## Field Coverage Matrix

Không trường nhập liệu; điều kiện xóa dựa trên `approvalStatus` (TAB5). Ma trận đầy đủ giống F-098.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-100-01 | Chỉ xóa DRAFT — assertDeletable | AC-100-01 | |
| BR-100-02 | Xóa mềm: set deletedAt, giữ bản ghi DB | AC-100-02 | |
| BR-100-03 | History DELETE kèm người + thời điểm | AC-100-03 | |
| BR-100-04 | Quyền `coastalstationinmarsat:delete` (fallback specialstation:delete, data:delete, admin:all) | AC-100-04 | |
| BR-100-05 | Nút Xóa chỉ hiện khi DRAFT (frontend) | AC-100-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-094 (xóa mềm chuẩn, deleteDraft chung, không tương tác luồng duyệt). Acceptance Criteria tương đương AC-094-01..05 với resource `coastalstationinmarsat`.
