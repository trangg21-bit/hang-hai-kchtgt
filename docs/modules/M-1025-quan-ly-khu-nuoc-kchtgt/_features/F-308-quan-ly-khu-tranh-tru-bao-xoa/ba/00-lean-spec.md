---
document: lean-spec
feature-id: F-308
feature-name: Xóa Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-308: Xóa (soft delete) Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** người nhập có `stormshelter:delete`.
- **Trigger:** chọn "Xóa" trên hồ sơ DRAFT.
- **Main flow:** soft delete → `deletedAt`/`deletedBy`, chuyển `ARCHIVED`.
- **Alternate/error:** trạng thái khác DRAFT → từ chối.

## Domain Model

Entity `StormShelterArea` kế thừa `BaseEntity` (soft-delete); dùng `ApprovalHistoryUtils.recordSoftDelete`.

## Business Rules (bắt buộc)

- **BR-308-01:** chỉ xóa DRAFT. **BR-308-02:** xóa mềm. **BR-308-03:** truyền đủ kiểm toán.

## Approval

- Không có bước phê duyệt. Sau xóa = `ARCHIVED` (7).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:delete`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
