---
document: lean-spec
feature-id: F-309
feature-name: Phê duyệt Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-309: Phê duyệt Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** lãnh đạo Cảng vụ/Chi cục (C1), lãnh đạo Cục (C2).
- **Main flow:** approve C1 → `APPROVED_LEVEL1`; approve C2 → `APPROVED`; reject → `REJECTED_LEVEL1`/`REJECTED_LEVEL2` + lý do.
- **Alternate/error:** tự duyệt → 4-eyes từ chối; lý do < 10 ký tự → lỗi.

## Domain Model

Entity `StormShelterArea`; cột `port_authority_approved_*` (C1) / `department_approved_*` (C2) / `rejection_reason`; nhật ký `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-309-01..05:** C1→APPROVED_LEVEL1, C2→APPROVED; từ chối lý do ≥10 ký tự; 4-eyes; không nhảy vòng; ghi nhật ký.

## Approval

- 2 cấp C1→C2 theo `approval-2-level-spec.md` mục 3; 7 trạng thái INT `@Enumerated ORDINAL`; re-submit vào vòng 1.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:approvec1` / `stormshelter:approvec2` / `stormshelter:approve`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt; endpoint `approve` nhận tham số `cap`.
