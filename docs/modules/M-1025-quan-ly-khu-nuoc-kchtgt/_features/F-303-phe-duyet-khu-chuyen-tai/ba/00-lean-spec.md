---
document: lean-spec
feature-id: F-303
feature-name: Phê duyệt Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-303: Phê duyệt Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** lãnh đạo Cảng vụ/Chi cục (C1), lãnh đạo Cục (C2).
- **Trigger:** chọn duyệt/từ chối trên hồ sơ đang chờ.
- **Main flow:** approve C1 → `APPROVED_LEVEL1`; approve C2 → `APPROVED`; reject → `REJECTED_LEVEL1`/`REJECTED_LEVEL2` + lý do.
- **Alternate/error:** tự duyệt → từ chối (4-eyes); lý do < 10 ký tự → lỗi.

## Domain Model

Entity `TransferArea`; cột tracking `port_authority_approved_*` (C1) / `department_approved_*` (C2) / `rejection_reason`. Ghi nhật ký `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-303-01:** C1 → `APPROVED_LEVEL1`; C2 → `APPROVED`.
- **BR-303-02:** từ chối bắt buộc lý do ≥ 10 ký tự.
- **BR-303-03:** 4-eyes (chống tự duyệt).
- **BR-303-04:** không nhảy vòng/duyệt ngược.
- **BR-303-05:** ghi nhật ký người duyệt + thời điểm.

## Approval

- 2 cấp C1 → C2 theo `approval-2-level-spec.md` mục 3; 7 trạng thái INT `@Enumerated ORDINAL`; re-submit luôn vào vòng 1.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`; người duyệt chỉ thấy hồ sơ trong scope.

## Permissions

- `transferarea:approvec1` / `transferarea:approvec2` / `transferarea:approve`.

## Drift ghi nhận

- `@PreAuthorize` bị comment ở controller — SA/PMO chốt; endpoint `approve` nhận tham số `cap` (C1/C2).
