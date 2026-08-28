---
feature-id: F-099
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng cập nhật hồ sơ Đài Inmarsat. **ĐÃ XÁC MINH:** `PUT /api/v1/stations/inmarsat/{id}` → `CoastalStationInmarsatService.updateStation` (FieldWriteGuard + assertEditable + check trùng mã). **KHÁC TTDH:** Excel sheet "Đài Inmarsat" cho **Sửa = T toàn bộ TAB1** (11 trường) — Inmarsat là nhóm đài cho phép sửa đầy đủ thông tin chung. Quy tắc sửa theo trạng thái (§3.9): DRAFT/REJECTED_* sửa được; PENDING_APPROVAL/APPROVED_LEVEL1 đóng băng (403); APPROVED sửa qua "Lưu và phê duyệt" (cần `coastalstationinmarsat:approvec2`). Ghi history UPDATE. `validateNotSelfApproval` áp dụng cho luồng duyệt, không cho update.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-099-01 | Người nhập | Hồ sơ DRAFT/REJECTED | Sửa TAB1 + GIS + file → Lưu tạm / Lưu và gửi duyệt | Cập nhật, history UPDATE; nếu gửi lại → PENDING_APPROVAL |
| UC-099-02 | Người có quyền duyệt | Hồ sơ APPROVED | "Lưu và phê duyệt" | Giữ APPROVED, ghi nhật ký thay đổi |
| UC-099-03 | Hệ thống | Update khi đang chờ duyệt | assertEditable | 403 |

## Scope

| | Items |
|---|---|
| In scope | Cập nhật TAB1 (11 trường) + GIS + file theo ma trận; trạng thái editable; history UPDATE; quyền `coastalstationinmarsat:update`; data scope. |
| Out of scope | Duyệt (F-101); xóa (F-100); auto-code (mã không đổi khi sửa). |

## Field Coverage Matrix

Giống F-098 (sheet "Đài Inmarsat") — cột Sửa = T cho toàn bộ TAB1 (khác TTDH). Mã đài `code` vẫn disabled khi sửa (chỉ hiển thị).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-099-01 | Chỉ sửa DRAFT/REJECTED_LEVEL1/REJECTED_LEVEL2 (assertEditable) | AC-099-01 | PENDING/APPROVED_LEVEL1 → 403 |
| BR-099-02 | APPROVED sửa qua "Lưu và phê duyệt" (quyền approvec2), giữ APPROVED, không hạ DRAFT | AC-099-02 | |
| BR-099-03 | Mã `code` không đổi khi sửa; nếu request đổi code → chặn trùng (IllegalArgumentException) | AC-099-03 | |
| BR-099-04 | Ghi history UPDATE (old/new) | AC-099-04 | |
| BR-099-05 | Sửa REJECTED + gửi lại → PENDING_APPROVAL (re-submit vòng 1) | AC-099-05 | |
| BR-099-06 | Quyền `coastalstationinmarsat:update` (fallback specialstation:update, data:update, admin:all) | AC-099-06 | |
| BR-099-07 | @PreUpdate đồng bộ code↔deviceCode, name↔stationName, orgUnitId↔unitId | AC-099-07 | |

## Domain Model

Giống F-098. `updatedAt` qua @PreUpdate; `conditionStatus` vẫn String.

## Approval flow (2 cấp C1→C2)

Không chuyển trạng thái khi sửa DRAFT; REJECTED_* + gửi lại → PENDING_APPROVAL; APPROVED giữ APPROVED; PENDING/APPROVED_LEVEL1 đóng băng.

## Validation Rules

- FieldWriteGuard.validateObject(request); assertEditable; tọa độ hợp lệ (nếu có validate trong update).
- Trùng mã khi đổi code → 400.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-099-01 | Given DRAFT, When PUT hợp lệ, Then 200 + updatedAt đổi; Given PENDING_APPROVAL, When PUT, Then 403 |
| AC-099-02 | Given APPROVED + user approvec2, When "Lưu và phê duyệt", Then giữ APPROVED |
| AC-099-03 | Given đổi code trùng, When PUT, Then 400 "Mã đài Inmarsat '...' đã được sử dụng" |
| AC-099-04 | History có UPDATE với old/new value |
| AC-099-05 | Given REJECTED_LEVEL1, When sửa + gửi lại, Then PENDING_APPROVAL |
| AC-099-06 | User không có quyền update → 403 |
| AC-099-07 | code==deviceCode, name==stationName sau update |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | |
| Architecture affected? | Low | |
| Implementation clear? | Yes | updateStation + assertEditable đã có |
| Documentation risk | Low | |
| **Verdict** | `Ready for Solution Designer review` | Rõ ràng |
