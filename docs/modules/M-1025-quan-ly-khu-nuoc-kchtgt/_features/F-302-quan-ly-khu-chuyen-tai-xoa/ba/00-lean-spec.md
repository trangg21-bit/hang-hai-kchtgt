---
document: lean-spec
feature-id: F-302
feature-name: Xóa Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-302: Xóa (soft delete) Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** người nhập có `transferarea:delete`.
- **Trigger:** chọn "Xóa" trên dòng hồ sơ DRAFT.
- **Preconditions:** hồ sơ ở `DRAFT`, trong scope đơn vị.
- **Main flow:** xác nhận xóa → soft delete (ghi `deletedAt`/`deletedBy`, chuyển `ARCHIVED`).
- **Alternate/error:** trạng thái khác DRAFT → từ chối (xóa hồ sơ Đã duyệt bị cấm — đổi tình trạng hoạt động thay vì xóa).

## Domain Model

Entity `TransferArea` kế thừa `BaseEntity` (soft-delete). Dùng `ApprovalHistoryUtils.recordSoftDelete(operatorId)`.

## Business Rules (bắt buộc)

- **BR-302-01:** chỉ xóa DRAFT.
- **BR-302-02:** xóa mềm, không xóa vật lý.
- **BR-302-03:** truyền đủ kiểm toán (`deletedBy`/`operatorId`).

## Approval

- Không có bước phê duyệt. Trạng thái sau xóa = `ARCHIVED` (7).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `transferarea:delete`.

## Drift ghi nhận

- `@PreAuthorize` bị comment ở controller — SA/PMO chốt.
