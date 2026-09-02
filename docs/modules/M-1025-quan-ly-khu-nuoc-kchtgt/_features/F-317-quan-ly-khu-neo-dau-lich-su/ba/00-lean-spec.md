---
document: lean-spec
feature-id: F-317
feature-name: Lịch sử Khu neo đậu
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-317: Lịch sử Khu neo đậu (Anchorage)

## Use Case

- **Actor:** người có `anchorage:history`.
- **Main flow:** hiển thị thay đổi/phê duyệt ĐÃ duyệt (approved-only).

## Domain Model

Bảng `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-317-01:** approved-only. **BR-317-02:** Nháp/Lưu tạm không hiển thị. **BR-317-03:** data scope.

## Approval

- Không có bước phê duyệt. Nguồn: sheet "1 số logic" + tài liệu phê duyệt Mục 5 (Ca sử dụng 8).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `anchorage:history`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
