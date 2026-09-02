---
document: lean-spec
feature-id: F-300
feature-name: Tạo mới Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-300: Tạo mới Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** Chuyên viên / người có quyền `transferarea:create`.
- **Trigger:** Chọn "Thêm mới" trên màn danh sách Khu chuyển tải.
- **Preconditions:** Đã đăng nhập, có quyền tạo, chọn được Cảng biển trong phạm vi đơn vị.
- **Main flow:** nhập thông tin chung (#2–#8) → kỹ thuật (#9–#18) → công bố (#19–#21) → thời gian hoạt động (#22–#23) → khu nước neo buộc + điểm neo (#24–#29) → GIS (#30–#34) → file đính kèm (#35) → "Lưu tạm" (DRAFT) hoặc "Gửi duyệt" (PENDING_APPROVAL).
- **Alternate/error:** thiếu trường bắt buộc → 400; đơn vị ngoài scope → 403; tọa độ neo sai số lượng → lỗi validation.

## Domain Model

- **Entity cha:** `TransferArea` (`transfer_areas`) — kế thừa `BaseEntity`, `@FieldNameConstants`, `@Filter(orgUnitFilter)` + `@Filter(recordSecurityLevelFilter)`.
- **Bảng con 1:** `TransferAreaMooringWaterArea` (`transfer_area_mooring_water_areas`) — FK `transfer_area_id`; trường `description`, `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule`.
- **Bảng con 2:** `TransferAreaMooringWaterAreaAnchorPoint` (`transfer_area_mooring_water_area_anchor_points`) — FK `transfer_area_mooring_water_area_id`; `name`, `latitude`, `longitude`.

## Auto-code

- `transferAreaCode` = `{portCode}-CT-{seq}` — sinh bởi `TransferAreaService.generateTransferAreaCode(UUID portId)` (TransferAreaService.java:296); unique, immutable sau tạo; ô UI disabled.

## Business Rules (bắt buộc)

- **BR-300-01:** mã server sinh, client không sửa.
- **BR-300-02:** tên bắt buộc, trim.
- **BR-300-03:** `orgUnitId` bắt buộc, trong scope user, cấm NULL.
- **BR-300-04:** `portId` bắt buộc khi tạo.
- **BR-300-05 (khu nước neo buộc logic):** Điểm ('1') = đúng 1 cặp tọa độ; Đường ('2') ≥ 2; Vùng ('3') ≥ 3 (nguồn sheet "1 số logic").
- **BR-300-06:** Hệ quy chiếu mặc định WGS-84; hiển thị mặc định DMS; VN-2000/DD chỉ khi migration.
- **BR-300-07/08:** trim text; ghi createdBy/createdAt từ session.

## Approval

- Theo `docs/conventions/approval-2-level-spec.md` mục 3. Trạng thái lưu INT `@Enumerated(ORDINAL)`. Tạo mới → DRAFT hoặc PENDING_APPROVAL.

## Data scope

- `@DataScope` class-level (TransferAreaController.java:34); entity `@Filter(orgUnitFilter)`. Ghi phải validate `OrgUnitScopeService.Scope.allows`.

## Permissions

- `transferarea:create` (tạo + gợi ý mã). Bộ 10 permission đã seed trong `PermissionSeeder.java`.

## Drift ghi nhận

- `@PreAuthorize` ở TransferAreaController bị comment ("TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN") — permission đã seed nhưng chưa enforce; SA/PMO chốt, không sửa trong module này.
- Tỉnh/TP filter hiện diện dù CSV Filter=FALSE.
