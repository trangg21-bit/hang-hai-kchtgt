---
document: lean-spec
feature-id: F-301
feature-name: Cập nhật Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-301: Cập nhật Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** người có `transferarea:update` (hoặc `transferarea:approvec2` với hồ sơ Đã duyệt).
- **Trigger:** chọn "Sửa" trên dòng của màn danh sách.
- **Preconditions:** hồ sơ tồn tại, chưa xóa mềm, trong scope đơn vị.
- **Main flow:** mở form sửa → partial update các trường #2–#35 → "Lưu tạm" hoặc "Lưu và gửi phê duyệt".
- **Alternate/error:** hồ sơ đang chờ duyệt → 403 đóng băng; đổi đơn vị ngoài scope → từ chối.

## Domain Model

Entity `TransferArea` + bảng con `transfer_area_mooring_water_areas` / `transfer_area_mooring_water_area_anchor_points` (như F-300). Mã `transferAreaCode` immutable.

## Business Rules (bắt buộc)

- **BR-301-01:** partial update (chỉ field gửi mới áp dụng).
- **BR-301-02:** mã không nhận từ client.
- **BR-301-03:** đổi `orgUnitId` phải trong scope (`OrgUnitScopeService.Scope.allows`).
- **BR-301-04:** đóng băng `PENDING_APPROVAL`/`APPROVED_LEVEL1` (403).
- **BR-301-05:** sửa `APPROVED` qua "Lưu và phê duyệt" (quyền `approvec2`), giữ APPROVED.
- **BR-301-06:** bảng con thay thế toàn bộ trong cùng transaction.

## Approval

- Theo `approval-2-level-spec.md` mục 3.9 (ma trận quyền sửa theo trạng thái). Trạng thái INT `@Enumerated ORDINAL`.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`; ghi validate scope đơn vị.

## Permissions

- `transferarea:update`; sửa Đã duyệt cần `transferarea:approvec2`.

## Drift ghi nhận

- `@PreAuthorize` bị comment ở controller (chưa enforce) — SA/PMO chốt.
