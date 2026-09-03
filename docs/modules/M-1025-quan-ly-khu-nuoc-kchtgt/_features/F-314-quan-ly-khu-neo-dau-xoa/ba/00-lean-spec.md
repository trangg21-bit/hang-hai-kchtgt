---
document: lean-spec
feature-id: F-314
feature-name: Xóa Khu neo đậu
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-314: Xóa (soft delete) Khu neo đậu (Anchorage)

## Use Case

- **Actor:** người nhập có `anchorage:delete`.
- **Main flow:** soft delete → `deletedAt`/`deletedBy`, chuyển `ARCHIVED`.
- **Alternate/error:** trạng thái khác DRAFT → từ chối.

## Domain Model

Entity `Anchorage` kế thừa `BaseEntity` (soft-delete); dùng `ApprovalHistoryUtils.recordSoftDelete`.

## Business Rules (bắt buộc)

- **BR-314-01:** chỉ xóa DRAFT. **BR-314-02:** xóa mềm. **BR-314-03:** truyền đủ kiểm toán.

## Approval

- Không có bước phê duyệt. Sau xóa = `ARCHIVED` (7).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `anchorage:delete`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
