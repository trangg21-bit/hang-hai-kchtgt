---
feature-id: F-106
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng xóa hồ sơ Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** `DELETE /api/v1/stations/cospas-sarsat/{id}` → `CoastalStationCospasSarsatService.deleteStation` → `approvalService.deleteDraft(entity, COSPAS_SARSAT_STATION, userId)` (chỉ DRAFT) → xóa mềm + history DELETE. Quyền `coastalstationcospassarsat:delete` — observation: không có @PreAuthorize method-level cho DELETE (chờ SA). Như F-094.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-106-01 | Người nhập | DRAFT → Xóa | deleteDraft | deletedAt set, history DELETE |
| UC-106-02 | Người nhập | Không phải DRAFT | Xóa | Chặn "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm DRAFT; history DELETE; data scope. |
| Out of scope | Xóa cứng; hồ sơ đã duyệt. |

## Field Coverage Matrix

Không trường nhập liệu; điều kiện theo `approvalStatus` (TAB5). Ma trận đầy đủ: F-104.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-106-01 | Chỉ xóa DRAFT — assertDeletable | AC-106-01 | |
| BR-106-02 | Xóa mềm: set deletedAt, giữ bản ghi | AC-106-02 | |
| BR-106-03 | History DELETE | AC-106-03 | |
| BR-106-04 | Quyền `coastalstationcospassarsat:delete` | AC-106-04 | Observation: chưa có @PreAuthorize |
| BR-106-05 | Nút Xóa chỉ hiện khi DRAFT | AC-106-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-094 với resource Cospas. AC tương đương AC-094-01..05.
