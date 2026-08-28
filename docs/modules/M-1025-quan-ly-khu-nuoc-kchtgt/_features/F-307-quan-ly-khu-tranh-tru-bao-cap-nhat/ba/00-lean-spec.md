---
document: lean-spec
feature-id: F-307
feature-name: Cập nhật Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-307: Cập nhật Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** người có `stormshelter:update` (hoặc `stormshelter:approvec2` với hồ sơ Đã duyệt).
- **Trigger:** chọn "Sửa" trên dòng danh sách.
- **Main flow:** partial update #2–#32, #35 → "Lưu tạm"/"Lưu và gửi phê duyệt".
- **Alternate/error:** hồ sơ đang chờ duyệt → 403 đóng băng; đổi đơn vị ngoài scope → từ chối.

## Domain Model

Entity `StormShelterArea` + `storm_shelter_mooring_water_areas` / `storm_shelter_mooring_water_area_anchor_points`. Mã `stormShelterCode` immutable.

## Business Rules (bắt buộc)

- **BR-307-01..07:** partial update; mã không nhận; đổi đơn vị phải trong scope; đóng băng khi chờ duyệt; sửa APPROVED qua "Lưu và phê duyệt" (`approvec2`); bảng con thay thế toàn bộ; trim + updatedBy từ session.

## Approval

- Theo `approval-2-level-spec.md` mục 3.9. Trạng thái INT `@Enumerated ORDINAL`.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:update`; sửa Đã duyệt cần `stormshelter:approvec2`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt; #16 DWT + #20 Ghi chú DB-parity-only.
