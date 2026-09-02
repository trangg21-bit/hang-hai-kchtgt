---
document: lean-spec
feature-id: F-313
feature-name: Cập nhật Khu neo đậu
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-313: Cập nhật Khu neo đậu (Anchorage)

## Use Case

- **Actor:** người có `anchorage:update` (hoặc `anchorage:approvec2` với hồ sơ Đã duyệt).
- **Main flow:** partial update → "Lưu tạm"/"Lưu và gửi phê duyệt".
- **Alternate/error:** hồ sơ đang chờ duyệt → 403 đóng băng; đổi đơn vị ngoài scope → từ chối.

## Domain Model

Entity `Anchorage` + `mooring_water_areas` / `mooring_water_area_anchor_points`. Mã `anchorageCode` immutable.

## Business Rules (bắt buộc)

- **BR-313-01..07:** partial update; mã không nhận; đổi đơn vị phải trong scope; đóng băng khi chờ duyệt; sửa APPROVED qua "Lưu và phê duyệt" (`approvec2`); bảng con thay thế toàn bộ; trim + updatedBy từ session.

## Approval

- Theo `approval-2-level-spec.md` mục 3.9. Trạng thái INT `@Enumerated ORDINAL`.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `anchorage:update`; sửa Đã duyệt cần `anchorage:approvec2`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
